// Marketing Assets Management Component
// Provides affiliates access to marketing materials, banners, templates, and creative assets
// Created: 2025-09-16

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../../config/supabase';

const { width: screenWidth } = Dimensions.get('window');

const MarketingAssets = ({ affiliateId }) => {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const categories = [
    { id: 'all', name: 'All Assets', icon: 'dashboard' },
    { id: 'banner', name: 'Banners', icon: 'crop-landscape' },
    { id: 'logo', name: 'Logos', icon: 'business' },
    { id: 'social_post', name: 'Social Media', icon: 'share' },
    { id: 'email_template', name: 'Email Templates', icon: 'email' },
    { id: 'video', name: 'Videos', icon: 'play-circle' },
    { id: 'landing_page', name: 'Landing Pages', icon: 'web' },
    { id: 'brochure', name: 'Brochures', icon: 'description' }
  ];

  const assetTypes = {
    banner: {
      name: 'Banner',
      icon: 'crop-landscape',
      color: '#1976D2'
    },
    logo: {
      name: 'Logo',
      icon: 'business',
      color: '#388E3C'
    },
    social_post: {
      name: 'Social Media',
      icon: 'share',
      color: '#F57C00'
    },
    email_template: {
      name: 'Email Template',
      icon: 'email',
      color: '#7B1FA2'
    },
    video: {
      name: 'Video',
      icon: 'play-circle',
      color: '#D32F2F'
    },
    landing_page: {
      name: 'Landing Page',
      icon: 'web',
      color: '#0288D1'
    },
    brochure: {
      name: 'Brochure',
      icon: 'description',
      color: '#689F38'
    }
  };

  useEffect(() => {
    loadMarketingAssets();
  }, [affiliateId]);

  useEffect(() => {
    filterAssets();
  }, [assets, selectedCategory, searchQuery]);

  const loadMarketingAssets = async () => {
    try {
      setLoading(true);

      // Get affiliate tier to determine access level
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('tier')
        .eq('id', affiliateId)
        .single();

      if (!affiliate) {
        Alert.alert('Error', 'Affiliate not found');
        return;
      }

      // Get marketing assets based on tier access
      const { data: assetsData, error } = await supabase
        .from('marketing_assets')
        .select('*')
        .eq('status', 'active')
        .or(`tier_access.cs.{${affiliate.tier}},tier_access.eq.{}`);

      if (error) throw error;

      // Add mock assets for demonstration
      const mockAssets = [
        {
          id: 'mock-1',
          title: 'NaturineX Square Logo',
          description: 'Main brand logo in square format for social media profiles',
          asset_type: 'logo',
          file_url: 'https://via.placeholder.com/300x300/2E7D32/FFFFFF?text=NaturineX',
          dimensions: '300x300',
          file_size: 45120,
          file_type: 'PNG',
          download_count: 247,
          tags: ['logo', 'brand', 'square', 'social'],
          created_at: '2025-01-15T10:00:00Z'
        },
        {
          id: 'mock-2',
          title: 'Health Benefits Banner',
          description: 'Horizontal banner highlighting natural health benefits',
          asset_type: 'banner',
          file_url: 'https://via.placeholder.com/728x90/4CAF50/FFFFFF?text=Natural+Health+Benefits',
          dimensions: '728x90',
          file_size: 156780,
          file_type: 'PNG',
          download_count: 189,
          tags: ['banner', 'health', 'benefits', 'leaderboard'],
          created_at: '2025-01-12T14:30:00Z'
        },
        {
          id: 'mock-3',
          title: 'Instagram Story Template',
          description: 'Engaging story template for Instagram marketing',
          asset_type: 'social_post',
          file_url: 'https://via.placeholder.com/1080x1920/FF9800/FFFFFF?text=Instagram+Story',
          dimensions: '1080x1920',
          file_size: 234560,
          file_type: 'PNG',
          download_count: 156,
          tags: ['instagram', 'story', 'social', 'template'],
          created_at: '2025-01-10T09:15:00Z'
        },
        {
          id: 'mock-4',
          title: 'Welcome Email Template',
          description: 'Professional email template for welcoming new referrals',
          asset_type: 'email_template',
          file_url: '/templates/welcome-email.html',
          file_size: 12450,
          file_type: 'HTML',
          download_count: 98,
          tags: ['email', 'welcome', 'template', 'referral'],
          created_at: '2025-01-08T16:45:00Z'
        },
        {
          id: 'mock-5',
          title: 'Product Demo Video',
          description: '60-second product demonstration video',
          asset_type: 'video',
          file_url: 'https://via.placeholder.com/400x225/E91E63/FFFFFF?text=Product+Demo+Video',
          dimensions: '1920x1080',
          file_size: 15670000,
          file_type: 'MP4',
          download_count: 67,
          tags: ['video', 'demo', 'product', 'marketing'],
          created_at: '2025-01-05T11:20:00Z'
        },
        {
          id: 'mock-6',
          title: 'Medication Safety Brochure',
          description: 'Educational brochure about medication safety and natural alternatives',
          asset_type: 'brochure',
          file_url: 'https://via.placeholder.com/300x400/673AB7/FFFFFF?text=Safety+Brochure',
          dimensions: '8.5x11',
          file_size: 567890,
          file_type: 'PDF',
          download_count: 134,
          tags: ['brochure', 'safety', 'education', 'print'],
          created_at: '2025-01-03T13:10:00Z'
        }
      ];

      const combinedAssets = [...(assetsData || []), ...mockAssets];
      setAssets(combinedAssets);

    } catch (error) {
      console.error('Error loading marketing assets:', error);
      Alert.alert('Error', 'Failed to load marketing assets');
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(asset => asset.asset_type === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(asset =>
        asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.tags && asset.tags.some(tag =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }

    setFilteredAssets(filtered);
  };

  const downloadAsset = async (asset) => {
    try {
      // Track download
      await supabase
        .from('marketing_assets')
        .update({
          download_count: (asset.download_count || 0) + 1
        })
        .eq('id', asset.id);

      // Update local state
      setAssets(prev => prev.map(a =>
        a.id === asset.id
          ? { ...a, download_count: (a.download_count || 0) + 1 }
          : a
      ));

      // Open download link
      if (asset.file_url.startsWith('http')) {
        Linking.openURL(asset.file_url);
      } else {
        // Handle local files differently in production
        Alert.alert('Download', `File would be downloaded: ${asset.title}`);
      }

      Alert.alert('Success', 'Asset downloaded successfully!');

    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download asset');
    }
  };

  const shareAsset = async (asset) => {
    try {
      const shareContent = {
        title: asset.title,
        message: `Check out this marketing asset from NaturineX: ${asset.title}`,
        url: asset.file_url
      };

      // Use React Native Share if available
      if (typeof Share !== 'undefined') {
        await Share.share(shareContent);
      } else {
        Alert.alert('Share', `Share: ${asset.title}\n${asset.file_url}`);
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const previewAsset = (asset) => {
    setSelectedAsset(asset);
    setShowPreviewModal(true);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAssetTypeInfo = (type) => {
    return assetTypes[type] || {
      name: type.charAt(0).toUpperCase() + type.slice(1),
      icon: 'insert-drive-file',
      color: '#666'
    };
  };

  const renderCategoryTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryTabs}
      contentContainerStyle={styles.categoryTabsContent}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryTab,
            selectedCategory === category.id && styles.activeCategoryTab
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Icon
            name={category.icon}
            size={20}
            color={selectedCategory === category.id ? '#2E7D32' : '#666'}
          />
          <Text style={[
            styles.categoryTabText,
            selectedCategory === category.id && styles.activeCategoryTabText
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAssetCard = ({ item: asset }) => {
    const typeInfo = getAssetTypeInfo(asset.asset_type);

    return (
      <View style={styles.assetCard}>
        <TouchableOpacity onPress={() => previewAsset(asset)}>
          <View style={styles.assetImageContainer}>
            {asset.file_url.startsWith('http') && asset.asset_type !== 'email_template' ? (
              <Image
                source={{ uri: asset.file_url }}
                style={styles.assetImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.assetPlaceholder, { backgroundColor: typeInfo.color + '20' }]}>
                <Icon name={typeInfo.icon} size={32} color={typeInfo.color} />
              </View>
            )}

            <View style={styles.assetTypeOverlay}>
              <Text style={styles.assetTypeText}>{typeInfo.name}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.assetInfo}>
          <Text style={styles.assetTitle} numberOfLines={2}>
            {asset.title}
          </Text>
          <Text style={styles.assetDescription} numberOfLines={2}>
            {asset.description}
          </Text>

          <View style={styles.assetMeta}>
            {asset.dimensions && (
              <Text style={styles.assetMetaText}>{asset.dimensions}</Text>
            )}
            <Text style={styles.assetMetaText}>
              {formatFileSize(asset.file_size || 0)}
            </Text>
            <Text style={styles.assetMetaText}>
              {asset.download_count || 0} downloads
            </Text>
          </View>

          {asset.tags && (
            <View style={styles.tagContainer}>
              {asset.tags.slice(0, 3).map((tag, index) => (
                <Text key={index} style={styles.tag}>
                  {tag}
                </Text>
              ))}
              {asset.tags.length > 3 && (
                <Text style={styles.tagMore}>+{asset.tags.length - 3}</Text>
              )}
            </View>
          )}

          <View style={styles.assetActions}>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => downloadAsset(asset)}
            >
              <Icon name="download" size={16} color="#fff" />
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => shareAsset(asset)}
            >
              <Icon name="share" size={16} color="#2E7D32" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => previewAsset(asset)}
            >
              <Icon name="visibility" size={16} color="#2E7D32" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderPreviewModal = () => (
    <Modal
      visible={showPreviewModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPreviewModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.previewModal}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>
              {selectedAsset?.title}
            </Text>
            <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {selectedAsset && (
            <ScrollView style={styles.previewContent}>
              <View style={styles.previewImageContainer}>
                {selectedAsset.file_url.startsWith('http') &&
                 selectedAsset.asset_type !== 'email_template' ? (
                  <Image
                    source={{ uri: selectedAsset.file_url }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.previewPlaceholder}>
                    <Icon
                      name={getAssetTypeInfo(selectedAsset.asset_type).icon}
                      size={64}
                      color="#666"
                    />
                    <Text style={styles.previewPlaceholderText}>
                      {selectedAsset.title}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.previewDetails}>
                <Text style={styles.previewDescription}>
                  {selectedAsset.description}
                </Text>

                <View style={styles.previewMeta}>
                  <View style={styles.previewMetaRow}>
                    <Text style={styles.previewMetaLabel}>Type:</Text>
                    <Text style={styles.previewMetaValue}>
                      {getAssetTypeInfo(selectedAsset.asset_type).name}
                    </Text>
                  </View>

                  {selectedAsset.dimensions && (
                    <View style={styles.previewMetaRow}>
                      <Text style={styles.previewMetaLabel}>Dimensions:</Text>
                      <Text style={styles.previewMetaValue}>
                        {selectedAsset.dimensions}
                      </Text>
                    </View>
                  )}

                  <View style={styles.previewMetaRow}>
                    <Text style={styles.previewMetaLabel}>File Size:</Text>
                    <Text style={styles.previewMetaValue}>
                      {formatFileSize(selectedAsset.file_size || 0)}
                    </Text>
                  </View>

                  <View style={styles.previewMetaRow}>
                    <Text style={styles.previewMetaLabel}>Format:</Text>
                    <Text style={styles.previewMetaValue}>
                      {selectedAsset.file_type || 'Unknown'}
                    </Text>
                  </View>

                  <View style={styles.previewMetaRow}>
                    <Text style={styles.previewMetaLabel}>Downloads:</Text>
                    <Text style={styles.previewMetaValue}>
                      {selectedAsset.download_count || 0}
                    </Text>
                  </View>
                </View>

                {selectedAsset.tags && (
                  <View style={styles.previewTags}>
                    <Text style={styles.previewTagsLabel}>Tags:</Text>
                    <View style={styles.previewTagContainer}>
                      {selectedAsset.tags.map((tag, index) => (
                        <Text key={index} style={styles.previewTag}>
                          {tag}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.previewActions}>
                  <TouchableOpacity
                    style={styles.previewDownloadButton}
                    onPress={() => {
                      downloadAsset(selectedAsset);
                      setShowPreviewModal(false);
                    }}
                  >
                    <Icon name="download" size={20} color="#fff" />
                    <Text style={styles.previewDownloadText}>Download</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.previewShareButton}
                    onPress={() => shareAsset(selectedAsset)}
                  >
                    <Icon name="share" size={20} color="#2E7D32" />
                    <Text style={styles.previewShareText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading marketing assets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search assets..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="clear" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Tabs */}
      {renderCategoryTabs()}

      {/* Assets Grid */}
      <FlatList
        data={filteredAssets}
        renderItem={renderAssetCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        style={styles.assetsList}
        contentContainerStyle={styles.assetsListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="photo-library" size={48} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No assets found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? 'Try adjusting your search or category filter'
                : 'No marketing assets available for your tier'
              }
            </Text>
          </View>
        }
      />

      {/* Preview Modal */}
      {renderPreviewModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16
  },
  categoryTabs: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  categoryTabsContent: {
    paddingHorizontal: 16
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5'
  },
  activeCategoryTab: {
    backgroundColor: '#e8f5e8'
  },
  categoryTabText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#666'
  },
  activeCategoryTabText: {
    color: '#2E7D32',
    fontWeight: '600'
  },
  assetsList: {
    flex: 1
  },
  assetsListContent: {
    padding: 16
  },
  assetCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  assetImageContainer: {
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden'
  },
  assetImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0'
  },
  assetPlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0'
  },
  assetTypeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  assetTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600'
  },
  assetInfo: {
    padding: 12
  },
  assetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  assetDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16
  },
  assetMeta: {
    marginBottom: 8
  },
  assetMetaText: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  tag: {
    backgroundColor: '#e8f5e8',
    color: '#2E7D32',
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 2
  },
  tagMore: {
    fontSize: 9,
    color: '#666',
    fontStyle: 'italic'
  },
  assetActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    marginRight: 8
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4
  },
  shareButton: {
    padding: 8,
    marginRight: 4
  },
  previewButton: {
    padding: 8
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  previewModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxWidth: screenWidth * 0.9,
    maxHeight: '90%',
    width: '90%'
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 16
  },
  previewContent: {
    maxHeight: '80%'
  },
  previewImageContainer: {
    alignItems: 'center',
    padding: 20
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8
  },
  previewPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8
  },
  previewPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  previewDetails: {
    padding: 20
  },
  previewDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20
  },
  previewMeta: {
    marginBottom: 20
  },
  previewMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  previewMetaLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600'
  },
  previewMetaValue: {
    fontSize: 14,
    color: '#333'
  },
  previewTags: {
    marginBottom: 20
  },
  previewTagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  previewTagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  previewTag: {
    backgroundColor: '#e8f5e8',
    color: '#2E7D32',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  previewDownloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginRight: 8
  },
  previewDownloadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  previewShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 8
  },
  previewShareText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  }
});

export default MarketingAssets;