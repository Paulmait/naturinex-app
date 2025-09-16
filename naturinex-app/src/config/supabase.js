// Supabase configuration for enterprise scale
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. App will use Firebase fallback.');
}

// Create Supabase client with optimizations for scale
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Rate limit realtime events
      },
    },
    global: {
      headers: {
        'x-app-version': process.env.REACT_APP_VERSION || '1.0.0',
      },
    },
    db: {
      schema: 'public',
    },
    // Connection pooling for better performance
    pool: {
      min: 2,
      max: 10,
    },
  }
) : null;

// Helper functions for common operations with caching
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const supabaseHelpers = {
  // Get user profile with caching
  async getUserProfile(userId) {
    const cacheKey = `profile_${userId}`;
    const cached = cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Cache the result
      cache.set(cacheKey, {
        data,
        expires: Date.now() + CACHE_TTL,
      });

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  // Insert scan with automatic stats update
  async insertScan(scanData) {
    try {
      // Start a transaction
      const { data: scan, error: scanError } = await supabase
        .from('scans')
        .insert(scanData)
        .select()
        .single();

      if (scanError) throw scanError;

      // Update user stats (using stored procedure for atomicity)
      const { error: statsError } = await supabase
        .rpc('increment_scan_count', { p_user_id: scanData.user_id });

      if (statsError) throw statsError;

      // Invalidate cache
      cache.delete(`profile_${scanData.user_id}`);

      return scan;
    } catch (error) {
      console.error('Error inserting scan:', error);
      throw error;
    }
  },

  // Get scans with pagination
  async getScans(userId, page = 0, limit = 20) {
    try {
      const from = page * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('scans')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('scan_date', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        scans: data,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      console.error('Error fetching scans:', error);
      return { scans: [], total: 0, page: 0, totalPages: 0 };
    }
  },

  // Batch insert for migrations
  async batchInsert(table, records, batchSize = 100) {
    const results = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      try {
        const { data, error } = await supabase
          .from(table)
          .insert(batch)
          .select();

        if (error) throw error;
        results.push(...data);
      } catch (error) {
        console.error(`Batch insert error at ${i}:`, error);
        // Continue with next batch
      }
    }

    return results;
  },

  // Search products with caching
  async searchProducts(query) {
    const cacheKey = `products_${query}`;
    const cached = cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .textSearch('name', query, {
          type: 'websearch',
          config: 'english',
        })
        .limit(10);

      if (error) throw error;

      cache.set(cacheKey, {
        data,
        expires: Date.now() + CACHE_TTL,
      });

      return data;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  // Clear cache
  clearCache() {
    cache.clear();
  },

  // Health check
  async healthCheck() {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  },
};

// Export auth helpers
export const supabaseAuth = {
  // Sign up
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;

      // Create profile
      if (data.user) {
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          email: data.user.email,
          ...metadata,
        });
      }

      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  // Sign in
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear cache on sign out
      supabaseHelpers.clearCache();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },

  // Social auth
  async signInWithProvider(provider) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('OAuth error:', error);
      throw error;
    }
  },
};

export default supabase;