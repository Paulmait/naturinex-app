-- ============================================================================
-- NATURINEX COMMUNITY FEATURES DATABASE SCHEMA
-- ============================================================================
-- Comprehensive community system with support groups, user-generated content,
-- gamification, moderation, and expert Q&A features
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- SUPPORT GROUPS
-- ============================================================================

-- Support groups for different health conditions
CREATE TABLE IF NOT EXISTS support_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL, -- Encrypted for privacy
    guidelines TEXT, -- Encrypted group guidelines

    -- Group characteristics
    condition_category VARCHAR(100) NOT NULL, -- diabetes, anxiety, arthritis, etc.
    tags TEXT[] DEFAULT '{}',
    is_private BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT FALSE,
    max_members INTEGER DEFAULT 1000,
    moderation_level VARCHAR(20) DEFAULT 'moderate' CHECK (moderation_level IN ('light', 'moderate', 'strict')),

    -- Group settings
    allow_posts BOOLEAN DEFAULT TRUE,
    allow_images BOOLEAN DEFAULT TRUE,
    allow_anonymous BOOLEAN DEFAULT TRUE,
    auto_archive_days INTEGER DEFAULT 365,

    -- Management
    created_by UUID NOT NULL,
    moderator_ids UUID[] DEFAULT '{}',
    featured BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    member_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Search optimization
    search_vector tsvector
);

-- Group membership table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES support_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- Membership details
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'banned', 'left')),

    -- Member preferences
    notification_level VARCHAR(20) DEFAULT 'normal' CHECK (notification_level IN ('none', 'minimal', 'normal', 'all')),
    muted BOOLEAN DEFAULT FALSE,

    -- Activity tracking
    posts_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Timestamps
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(group_id, user_id)
);

-- ============================================================================
-- POSTS AND CONTENT
-- ============================================================================

-- User posts in community
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL,
    group_id UUID REFERENCES support_groups(id) ON DELETE SET NULL,

    -- Content
    title VARCHAR(255),
    content TEXT NOT NULL, -- Encrypted for privacy
    post_type VARCHAR(20) DEFAULT 'text' CHECK (post_type IN ('text', 'success_story', 'question', 'recipe', 'progress', 'review')),

    -- Media and attachments
    media_urls TEXT[] DEFAULT '{}',
    media_types TEXT[] DEFAULT '{}', -- image, video, document

    -- Categorization
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100),
    condition_related VARCHAR(100),

    -- Privacy and visibility
    is_anonymous BOOLEAN DEFAULT FALSE,
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'group', 'private')),

    -- Engagement metrics
    view_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    reaction_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,

    -- Moderation
    moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged', 'hidden')),
    moderation_score DECIMAL(3,2) DEFAULT 0.5,
    moderated_by UUID,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderation_notes TEXT,

    -- Content flags
    contains_medical_advice BOOLEAN DEFAULT FALSE,
    contains_personal_info BOOLEAN DEFAULT FALSE,
    requires_expert_review BOOLEAN DEFAULT FALSE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Search optimization
    search_vector tsvector
);

-- Comments on posts
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,

    -- Content
    content TEXT NOT NULL, -- Encrypted for privacy

    -- Engagement
    reaction_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,

    -- Moderation
    moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
    moderation_score DECIMAL(3,2) DEFAULT 0.5,
    moderated_by UUID,
    moderated_at TIMESTAMP WITH TIME ZONE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reactions to posts and comments
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,

    -- Reaction details
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'helpful', 'support', 'celebrate', 'sad', 'angry')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL)),
    UNIQUE(user_id, post_id, comment_id)
);

-- ============================================================================
-- CONTENT MODERATION
-- ============================================================================

-- Content reports and flagging
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL,

    -- Content being reported
    content_id UUID NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('post', 'comment', 'group', 'user')),

    -- Report details
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'medical_misinformation', 'privacy_violation', 'off_topic', 'hate_speech', 'other')),
    description TEXT,

    -- Report status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Resolution
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution VARCHAR(50),
    resolution_notes TEXT,
    action_taken VARCHAR(50),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content moderation queue
CREATE TABLE IF NOT EXISTS moderation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('post', 'comment', 'group')),

    -- Moderation details
    assigned_moderator UUID,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    automated_flags TEXT[] DEFAULT '{}',
    risk_score DECIMAL(3,2) DEFAULT 0.5,

    -- Review status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'escalated')),
    review_started_at TIMESTAMP WITH TIME ZONE,
    review_completed_at TIMESTAMP WITH TIME ZONE,

    -- Decision
    decision VARCHAR(20),
    decision_reason TEXT,
    moderator_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- GAMIFICATION SYSTEM
-- ============================================================================

-- User achievements and points
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,

    -- Points and level
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,

    -- Achievements and badges
    achievements TEXT[] DEFAULT '{}',
    badges TEXT[] DEFAULT '{}',

    -- Activity stats
    posts_created INTEGER DEFAULT 0,
    comments_created INTEGER DEFAULT 0,
    reactions_given INTEGER DEFAULT 0,
    reactions_received INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,

    -- Streaks and milestones
    daily_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,

    -- Community standing
    reputation_score DECIMAL(5,2) DEFAULT 0,
    community_rank INTEGER,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Point transactions log
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,

    -- Transaction details
    action VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    multiplier DECIMAL(3,2) DEFAULT 1.0,

    -- Context
    related_content_id UUID,
    related_content_type VARCHAR(20),
    description TEXT,

    -- Metadata
    session_id UUID,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Available badges and achievements
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_url VARCHAR(500),

    -- Badge properties
    category VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    points_required INTEGER,

    -- Unlock criteria
    criteria JSONB NOT NULL,
    is_stackable BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EXPERT Q&A SYSTEM
-- ============================================================================

-- Questions submitted to medical experts
CREATE TABLE IF NOT EXISTS expert_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL,

    -- Question content
    question TEXT NOT NULL, -- Encrypted for privacy
    category VARCHAR(100) NOT NULL,
    tags TEXT[] DEFAULT '{}',

    -- Question metadata
    is_anonymous BOOLEAN DEFAULT FALSE,
    urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
    condition_context VARCHAR(100),

    -- Status tracking
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed', 'flagged')),
    assigned_expert UUID,

    -- Engagement
    view_count INTEGER DEFAULT 0,
    upvote_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answered_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Expert answers to questions
CREATE TABLE IF NOT EXISTS expert_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES expert_questions(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL,

    -- Answer content
    answer TEXT NOT NULL, -- Encrypted for privacy

    -- Answer metadata
    confidence_level VARCHAR(20) DEFAULT 'medium' CHECK (confidence_level IN ('low', 'medium', 'high')),
    sources TEXT[], -- References and sources

    -- Peer review
    peer_reviewed BOOLEAN DEFAULT FALSE,
    peer_reviewer_id UUID,
    peer_review_notes TEXT,

    -- Engagement
    helpful_votes INTEGER DEFAULT 0,
    not_helpful_votes INTEGER DEFAULT 0,

    -- Status
    is_accepted BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CONTENT SHARING AND RECIPES
-- ============================================================================

-- Natural remedy recipes shared by users
CREATE TABLE IF NOT EXISTS remedy_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL,

    -- Recipe details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL, -- Encrypted
    ingredients JSONB NOT NULL, -- Structured ingredient list
    instructions TEXT NOT NULL, -- Encrypted

    -- Recipe metadata
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    prep_time_minutes INTEGER,
    total_time_minutes INTEGER,
    servings INTEGER,

    -- Health information
    conditions_helped TEXT[] DEFAULT '{}',
    benefits TEXT[] DEFAULT '{}',
    warnings TEXT[] DEFAULT '{}',

    -- Media
    image_urls TEXT[] DEFAULT '{}',
    video_url VARCHAR(500),

    -- Engagement
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    tried_count INTEGER DEFAULT 0,
    saved_count INTEGER DEFAULT 0,

    -- Moderation
    moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
    verified_safe BOOLEAN DEFAULT FALSE,
    expert_reviewed BOOLEAN DEFAULT FALSE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress tracking and journeys
CREATE TABLE IF NOT EXISTS user_journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,

    -- Journey details
    title VARCHAR(255) NOT NULL,
    description TEXT, -- Encrypted
    journey_type VARCHAR(50) NOT NULL, -- treatment, lifestyle, prevention
    condition VARCHAR(100) NOT NULL,

    -- Journey timeline
    start_date DATE NOT NULL,
    target_end_date DATE,
    actual_end_date DATE,

    -- Progress tracking
    milestones JSONB DEFAULT '[]',
    current_phase VARCHAR(100),
    progress_percentage INTEGER DEFAULT 0,

    -- Privacy settings
    is_public BOOLEAN DEFAULT FALSE,
    is_anonymous BOOLEAN DEFAULT TRUE,

    -- Engagement
    view_count INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    inspiration_count INTEGER DEFAULT 0, -- How many people this inspired

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'discontinued')),
    is_success_story BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journey updates and progress entries
CREATE TABLE IF NOT EXISTS journey_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journey_id UUID NOT NULL REFERENCES user_journeys(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- Update content
    title VARCHAR(255),
    content TEXT NOT NULL, -- Encrypted
    update_type VARCHAR(50) DEFAULT 'progress' CHECK (update_type IN ('progress', 'milestone', 'setback', 'insight', 'completion')),

    -- Progress data
    progress_metrics JSONB,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),

    -- Media
    image_urls TEXT[] DEFAULT '{}',

    -- Engagement
    reaction_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS AND METRICS
-- ============================================================================

-- Community engagement analytics
CREATE TABLE IF NOT EXISTS community_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,

    -- Action tracking
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50),

    -- Context
    content_id UUID,
    content_type VARCHAR(20),
    group_id UUID,

    -- Session information
    session_id UUID,
    device_type VARCHAR(50),
    user_agent TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily community metrics summary
CREATE TABLE IF NOT EXISTS daily_community_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,

    -- User metrics
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    returning_users INTEGER DEFAULT 0,

    -- Content metrics
    posts_created INTEGER DEFAULT 0,
    comments_created INTEGER DEFAULT 0,
    reactions_given INTEGER DEFAULT 0,

    -- Engagement metrics
    avg_session_duration INTERVAL,
    avg_posts_per_user DECIMAL(5,2) DEFAULT 0,
    avg_comments_per_post DECIMAL(5,2) DEFAULT 0,

    -- Community health
    moderation_actions INTEGER DEFAULT 0,
    content_reports INTEGER DEFAULT 0,
    user_retention_rate DECIMAL(5,2) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Support groups indexes
CREATE INDEX IF NOT EXISTS idx_support_groups_condition ON support_groups (condition_category) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_support_groups_featured ON support_groups (featured, member_count DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_support_groups_search ON support_groups USING gin(search_vector);

-- Group members indexes
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members (user_id, status);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members (group_id, role, status);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts (author_id, created_at DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_posts_group ON posts (group_id, created_at DESC) WHERE is_active = TRUE AND moderation_status = 'approved';
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts (post_type, created_at DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_posts_moderation ON posts (moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING gin(search_vector);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id, created_at DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_comment_id, created_at DESC);

-- Reactions indexes
CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions (post_id, reaction_type);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions (user_id, created_at DESC);

-- Moderation indexes
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports (status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue (status, priority, created_at DESC);

-- Gamification indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_points ON user_achievements (total_points DESC, level DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions (user_id, created_at DESC);

-- Expert Q&A indexes
CREATE INDEX IF NOT EXISTS idx_expert_questions_status ON expert_questions (status, urgency, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expert_answers_question ON expert_answers (question_id, helpful_votes DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_community_analytics_user ON community_analytics (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_community_analytics_action ON community_analytics (action, timestamp DESC);

-- ============================================================================
-- SEARCH VECTOR UPDATES
-- ============================================================================

-- Function to update search vectors for groups
CREATE OR REPLACE FUNCTION update_group_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.condition_category, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vectors for posts
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for search vector updates
CREATE TRIGGER support_groups_search_vector_update
    BEFORE INSERT OR UPDATE ON support_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_group_search_vector();

CREATE TRIGGER posts_search_vector_update
    BEFORE INSERT OR UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_post_search_vector();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE support_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_answers ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read access to public groups"
    ON support_groups FOR SELECT
    USING (is_active = TRUE AND (is_private = FALSE OR auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = id AND status = 'active')));

CREATE POLICY "Users can manage their group memberships"
    ON group_members FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Public read access to approved posts"
    ON posts FOR SELECT
    USING (is_active = TRUE AND moderation_status = 'approved' AND (visibility = 'public' OR (visibility = 'group' AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND status = 'active'))));

CREATE POLICY "Users can manage their own posts"
    ON posts FOR ALL
    USING (auth.uid() = author_id);

CREATE POLICY "Users can manage their own comments"
    ON comments FOR ALL
    USING (auth.uid() = author_id);

CREATE POLICY "Users can manage their own reactions"
    ON reactions FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view and manage their own achievements"
    ON user_achievements FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to calculate user reputation
CREATE OR REPLACE FUNCTION calculate_user_reputation(user_id_param UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    reputation DECIMAL(5,2) := 0;
    post_score DECIMAL(5,2);
    comment_score DECIMAL(5,2);
    reaction_score DECIMAL(5,2);
BEGIN
    -- Posts score (based on reactions received)
    SELECT COALESCE(SUM(reaction_count) * 0.5, 0)
    INTO post_score
    FROM posts
    WHERE author_id = user_id_param AND is_active = TRUE;

    -- Comments score (based on reactions received)
    SELECT COALESCE(SUM(reaction_count) * 0.3, 0)
    INTO comment_score
    FROM comments
    WHERE author_id = user_id_param AND is_active = TRUE;

    -- Helpful reactions given score
    SELECT COALESCE(COUNT(*) * 0.1, 0)
    INTO reaction_score
    FROM reactions
    WHERE user_id = user_id_param AND reaction_type IN ('helpful', 'support');

    reputation := post_score + comment_score + reaction_score;

    RETURN GREATEST(0, reputation);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending posts
CREATE OR REPLACE FUNCTION get_trending_posts(hours_back INTEGER DEFAULT 24, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    post_id UUID,
    title VARCHAR(255),
    engagement_score DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id as post_id,
        p.title,
        (p.reaction_count * 1.0 + p.comment_count * 2.0 + p.view_count * 0.1) as engagement_score
    FROM posts p
    WHERE p.created_at >= NOW() - INTERVAL '1 hour' * hours_back
      AND p.is_active = TRUE
      AND p.moderation_status = 'approved'
    ORDER BY engagement_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS FOR COUNTERS AND ANALYTICS
-- ============================================================================

-- Update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE support_groups
        SET member_count = member_count + 1, last_activity = NOW()
        WHERE id = NEW.group_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active' THEN
        UPDATE support_groups
        SET member_count = member_count + 1, last_activity = NOW()
        WHERE id = NEW.group_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active' THEN
        UPDATE support_groups
        SET member_count = member_count - 1, last_activity = NOW()
        WHERE id = NEW.group_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        UPDATE support_groups
        SET member_count = member_count - 1, last_activity = NOW()
        WHERE id = OLD.group_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER group_member_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_group_member_count();

-- Update post/comment counters
CREATE OR REPLACE FUNCTION update_engagement_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE posts SET comment_count = comment_count + 1, last_activity = NOW() WHERE id = NEW.post_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'reactions' THEN
        IF TG_OP = 'INSERT' THEN
            IF NEW.post_id IS NOT NULL THEN
                UPDATE posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
            ELSIF NEW.comment_id IS NOT NULL THEN
                UPDATE comments SET reaction_count = reaction_count + 1 WHERE id = NEW.comment_id;
            END IF;
        ELSIF TG_OP = 'DELETE' THEN
            IF OLD.post_id IS NOT NULL THEN
                UPDATE posts SET reaction_count = reaction_count - 1 WHERE id = OLD.post_id;
            ELSIF OLD.comment_id IS NOT NULL THEN
                UPDATE comments SET reaction_count = reaction_count - 1 WHERE id = OLD.comment_id;
            END IF;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_counter_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_engagement_counters();

CREATE TRIGGER reaction_counter_trigger
    AFTER INSERT OR DELETE ON reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_engagement_counters();

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant appropriate permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON support_groups, group_members, posts, comments, reactions TO authenticated;
GRANT ALL ON user_achievements, point_transactions TO authenticated;
GRANT ALL ON expert_questions, expert_answers TO authenticated;
GRANT ALL ON remedy_recipes, user_journeys, journey_updates TO authenticated;
GRANT INSERT ON content_reports, community_analytics TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION calculate_user_reputation TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_posts TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE support_groups IS 'Support groups for different health conditions and wellness topics';
COMMENT ON TABLE group_members IS 'Membership records for support groups with roles and status';
COMMENT ON TABLE posts IS 'User-generated content posts in community and groups';
COMMENT ON TABLE comments IS 'Comments on posts with threading support';
COMMENT ON TABLE reactions IS 'User reactions to posts and comments';
COMMENT ON TABLE user_achievements IS 'Gamification system tracking user points, levels, and badges';
COMMENT ON TABLE expert_questions IS 'Questions submitted to verified medical experts';
COMMENT ON TABLE expert_answers IS 'Answers provided by verified medical professionals';
COMMENT ON TABLE remedy_recipes IS 'User-shared natural remedy recipes with safety information';
COMMENT ON TABLE user_journeys IS 'Health and wellness journey tracking and sharing';
COMMENT ON TABLE community_analytics IS 'Detailed tracking of community engagement and user behavior';