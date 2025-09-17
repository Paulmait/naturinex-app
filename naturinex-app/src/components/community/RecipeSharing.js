/**
 * Recipe Sharing Component
 * Platform for sharing natural remedy recipes and wellness treatments
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  TextInput,
  ScrollView,
  Modal
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import CommunityService from '../../services/CommunityService';
import LoadingAnimation from '../LoadingAnimation';

const RecipeSharing = ({ user, navigation }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateRecipe, setShowCreateRecipe] = useState(false);
  const [sortBy, setSortBy] = useState('recent');

  // Recipe form state
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [recipeCategory, setRecipeCategory] = useState('');
  const [ingredients, setIngredients] = useState([{ name: '', amount: '', unit: '' }]);
  const [instructions, setInstructions] = useState(['']);
  const [prepTime, setPrepTime] = useState('');
  const [totalTime, setTotalTime] = useState('');
  const [servings, setServings] = useState('');
  const [conditions, setConditions] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [difficulty, setDifficulty] = useState('medium');

  const categories = [
    { id: 'all', name: 'All Recipes', icon: 'restaurant' },
    { id: 'teas_beverages', name: 'Teas & Beverages', icon: 'local-cafe' },
    { id: 'tinctures', name: 'Tinctures & Extracts', icon: 'science' },
    { id: 'topical', name: 'Topical Remedies', icon: 'healing' },
    { id: 'supplements', name: 'Supplement Blends', icon: 'medication' },
    { id: 'foods', name: 'Healing Foods', icon: 'restaurant' },
    { id: 'aromatherapy', name: 'Aromatherapy', icon: 'spa' },
    { id: 'digestive', name: 'Digestive Health', icon: 'favorite' },
    { id: 'immune_support', name: 'Immune Support', icon: 'shield' },
    { id: 'stress_relief', name: 'Stress Relief', icon: 'self-improvement' },
    { id: 'sleep_aid', name: 'Sleep Aid', icon: 'bedtime' },
    { id: 'pain_relief', name: 'Pain Relief', icon: 'local-hospital' }
  ];

  const conditionOptions = [
    'Anxiety', 'Depression', 'Insomnia', 'Digestive Issues', 'Inflammation',
    'Joint Pain', 'Headaches', 'Cold & Flu', 'Allergies', 'High Blood Pressure',
    'Diabetes', 'Skin Conditions', 'Fatigue', 'Memory Issues', 'PMS'
  ];

  const loadRecipes = useCallback(async () => {
    try {
      setLoading(true);
      // This would need to be implemented in CommunityService
      // const recipesData = await CommunityService.getRemedyRecipes({
      //   category: selectedCategory === 'all' ? null : selectedCategory,
      //   search: searchQuery,
      //   sortBy,
      //   limit: 20
      // });

      // Mock data for now
      const mockRecipes = [
        {
          id: '1',
          title: 'Anti-Inflammatory Golden Milk',
          description: 'A warming turmeric-based drink perfect for reducing inflammation and promoting better sleep.',
          category: 'teas_beverages',
          difficulty: 'easy',
          prep_time_minutes: 5,
          total_time_minutes: 10,
          servings: 2,
          rating_average: 4.8,
          rating_count: 24,
          tried_count: 156,
          saved_count: 89,
          author_id: 'user1',
          created_at: '2024-01-15T10:00:00Z',
          image_urls: ['https://example.com/golden-milk.jpg'],
          conditions_helped: ['Inflammation', 'Insomnia', 'Joint Pain'],
          benefits: ['Anti-inflammatory', 'Sleep promoting', 'Antioxidant'],
          profiles: { display_name: 'Sarah Chen' },
          ingredients: [
            { name: 'Turmeric powder', amount: '1', unit: 'tsp' },
            { name: 'Coconut milk', amount: '1', unit: 'cup' },
            { name: 'Ginger powder', amount: '1/2', unit: 'tsp' },
            { name: 'Cinnamon', amount: '1/4', unit: 'tsp' },
            { name: 'Black pepper', amount: 'pinch', unit: '' },
            { name: 'Honey', amount: '1', unit: 'tbsp' }
          ]
        },
        {
          id: '2',
          title: 'Lavender Sleep Balm',
          description: 'A soothing topical balm to help promote restful sleep and reduce anxiety.',
          category: 'topical',
          difficulty: 'medium',
          prep_time_minutes: 20,
          total_time_minutes: 45,
          servings: 1,
          rating_average: 4.6,
          rating_count: 18,
          tried_count: 87,
          saved_count: 134,
          author_id: 'user2',
          created_at: '2024-01-16T14:00:00Z',
          image_urls: ['https://example.com/lavender-balm.jpg'],
          conditions_helped: ['Insomnia', 'Anxiety', 'Stress'],
          benefits: ['Calming', 'Sleep promoting', 'Moisturizing'],
          profiles: { display_name: 'Dr. Maria Rodriguez' },
          ingredients: [
            { name: 'Coconut oil', amount: '2', unit: 'tbsp' },
            { name: 'Beeswax', amount: '1', unit: 'tbsp' },
            { name: 'Lavender essential oil', amount: '10', unit: 'drops' },
            { name: 'Chamomile essential oil', amount: '5', unit: 'drops' }
          ]
        }
      ];

      setRecipes(mockRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
      Alert.alert('Error', 'Failed to load recipes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecipes();
  };

  const handleCreateRecipe = async () => {
    try {
      if (!recipeTitle.trim() || !recipeDescription.trim() || !recipeCategory) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const recipeData = {
        title: recipeTitle,
        description: recipeDescription,
        category: recipeCategory,
        difficulty,
        prep_time_minutes: parseInt(prepTime) || 0,
        total_time_minutes: parseInt(totalTime) || 0,
        servings: parseInt(servings) || 1,
        ingredients: ingredients.filter(ing => ing.name.trim()),
        instructions: instructions.filter(inst => inst.trim()),
        conditions_helped: conditions,
        benefits,
        warnings
      };

      // This would be implemented in CommunityService
      // const newRecipe = await CommunityService.createRemedyRecipe(recipeData, user.uid);
      // setRecipes(prev => [newRecipe, ...prev]);

      setShowCreateRecipe(false);
      resetForm();
      Alert.alert('Success', 'Your recipe has been shared with the community!');
    } catch (error) {
      console.error('Error creating recipe:', error);
      Alert.alert('Error', 'Failed to share recipe');
    }
  };

  const resetForm = () => {
    setRecipeTitle('');
    setRecipeDescription('');
    setRecipeCategory('');
    setIngredients([{ name: '', amount: '', unit: '' }]);
    setInstructions(['']);
    setPrepTime('');
    setTotalTime('');
    setServings('');
    setConditions([]);
    setBenefits([]);
    setWarnings([]);
    setDifficulty('medium');
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const updateInstruction = (index, value) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const removeInstruction = (index) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#666';
    }
  };

  const renderCategorySelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categorySelector}
      contentContainerStyle={styles.categorySelectorContent}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            selectedCategory === category.id && styles.categoryChipActive
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <MaterialIcons
            name={category.icon}
            size={16}
            color={selectedCategory === category.id ? '#fff' : '#666'}
          />
          <Text style={[
            styles.categoryText,
            selectedCategory === category.id && styles.categoryTextActive
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderRecipeCard = ({ item: recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
    >
      <View style={styles.recipeImageContainer}>
        <Image
          source={{ uri: recipe.image_urls?.[0] || 'https://via.placeholder.com/150' }}
          style={styles.recipeImage}
        />
        <View style={styles.difficultyBadge}>
          <Text style={[styles.difficultyText, { color: getDifficultyColor(recipe.difficulty) }]}>
            {recipe.difficulty}
          </Text>
        </View>
        <TouchableOpacity style={styles.saveButton}>
          <MaterialIcons name="bookmark-border" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
        <Text style={styles.recipeDescription} numberOfLines={2}>
          {recipe.description}
        </Text>

        <View style={styles.recipeDetails}>
          <View style={styles.timeInfo}>
            <MaterialIcons name="schedule" size={14} color="#666" />
            <Text style={styles.timeText}>{recipe.total_time_minutes}min</Text>
          </View>
          <View style={styles.servingInfo}>
            <MaterialIcons name="restaurant" size={14} color="#666" />
            <Text style={styles.servingText}>{recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.conditionsContainer}
        >
          {recipe.conditions_helped.map((condition, index) => (
            <View key={index} style={styles.conditionTag}>
              <Text style={styles.conditionText}>{condition}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.recipeFooter}>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>by {recipe.profiles?.display_name}</Text>
          </View>

          <View style={styles.recipeStats}>
            <View style={styles.rating}>
              <MaterialIcons name="star" size={14} color="#FFC107" />
              <Text style={styles.ratingText}>{recipe.rating_average}</Text>
              <Text style={styles.ratingCount}>({recipe.rating_count})</Text>
            </View>
            <View style={styles.triedCount}>
              <MaterialIcons name="check-circle" size={14} color="#4CAF50" />
              <Text style={styles.triedText}>{recipe.tried_count} tried</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Natural Recipes</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateRecipe(true)}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {renderCategorySelector()}

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[styles.sortOption, sortBy === 'recent' && styles.sortOptionActive]}
          onPress={() => setSortBy('recent')}
        >
          <Text style={[styles.sortText, sortBy === 'recent' && styles.sortTextActive]}>Recent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortOption, sortBy === 'popular' && styles.sortOptionActive]}
          onPress={() => setSortBy('popular')}
        >
          <Text style={[styles.sortText, sortBy === 'popular' && styles.sortTextActive]}>Popular</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortOption, sortBy === 'rating' && styles.sortOptionActive]}
          onPress={() => setSortBy('rating')}
        >
          <Text style={[styles.sortText, sortBy === 'rating' && styles.sortTextActive]}>Top Rated</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCreateRecipeModal = () => (
    <Modal
      visible={showCreateRecipe}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateRecipe(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Share Recipe</Text>
          <TouchableOpacity onPress={handleCreateRecipe}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Basic Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Recipe Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter recipe title"
                value={recipeTitle}
                onChangeText={setRecipeTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your recipe and its benefits"
                value={recipeDescription}
                onChangeText={setRecipeDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.filter(c => c.id !== 'all').map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      recipeCategory === category.id && styles.categoryOptionSelected
                    ]}
                    onPress={() => setRecipeCategory(category.id)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      recipeCategory === category.id && styles.categoryOptionTextSelected
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Prep Time (min)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="15"
                  value={prepTime}
                  onChangeText={setPrepTime}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Total Time (min)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="30"
                  value={totalTime}
                  onChangeText={setTotalTime}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Servings</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2"
                  value={servings}
                  onChangeText={setServings}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Difficulty</Text>
                <View style={styles.difficultyOptions}>
                  {['easy', 'medium', 'hard'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.difficultyOption,
                        difficulty === level && styles.difficultyOptionSelected
                      ]}
                      onPress={() => setDifficulty(level)}
                    >
                      <Text style={[
                        styles.difficultyOptionText,
                        difficulty === level && styles.difficultyOptionTextSelected
                      ]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <TextInput
                  style={[styles.input, styles.ingredientName]}
                  placeholder="Ingredient name"
                  value={ingredient.name}
                  onChangeText={(value) => updateIngredient(index, 'name', value)}
                />
                <TextInput
                  style={[styles.input, styles.ingredientAmount]}
                  placeholder="Amount"
                  value={ingredient.amount}
                  onChangeText={(value) => updateIngredient(index, 'amount', value)}
                />
                <TextInput
                  style={[styles.input, styles.ingredientUnit]}
                  placeholder="Unit"
                  value={ingredient.unit}
                  onChangeText={(value) => updateIngredient(index, 'unit', value)}
                />
                {ingredients.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeIngredient(index)}
                  >
                    <MaterialIcons name="remove-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
              <MaterialIcons name="add-circle" size={20} color="#2E7D32" />
              <Text style={styles.addButtonText}>Add Ingredient</Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionRow}>
                <Text style={styles.stepNumber}>{index + 1}.</Text>
                <TextInput
                  style={[styles.input, styles.instructionInput]}
                  placeholder={`Step ${index + 1}`}
                  value={instruction}
                  onChangeText={(value) => updateInstruction(index, value)}
                  multiline
                />
                {instructions.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeInstruction(index)}
                  >
                    <MaterialIcons name="remove-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addInstruction}>
              <MaterialIcons name="add-circle" size={20} color="#2E7D32" />
              <Text style={styles.addButtonText}>Add Step</Text>
            </TouchableOpacity>
          </View>

          {/* Health Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Health Information</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Conditions This Helps</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {conditionOptions.map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    style={[
                      styles.conditionOption,
                      conditions.includes(condition) && styles.conditionOptionSelected
                    ]}
                    onPress={() => {
                      if (conditions.includes(condition)) {
                        setConditions(conditions.filter(c => c !== condition));
                      } else {
                        setConditions([...conditions, condition]);
                      }
                    }}
                  >
                    <Text style={[
                      styles.conditionOptionText,
                      conditions.includes(condition) && styles.conditionOptionTextSelected
                    ]}>
                      {condition}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.disclaimer}>
              <MaterialIcons name="warning" size={16} color="#FF9800" />
              <Text style={styles.disclaimerText}>
                This recipe is for educational purposes only and is not intended to diagnose, treat, cure, or prevent any disease.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingAnimation />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2E7D32']}
            tintColor="#2E7D32"
          />
        }
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.recipeRow}
      />

      {renderCreateRecipeModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  categorySelector: {
    marginBottom: 16,
  },
  categorySelectorContent: {
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#2E7D32',
  },
  categoryText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  categoryTextActive: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  sortOptionActive: {
    backgroundColor: '#2E7D32',
  },
  sortText: {
    fontSize: 12,
    color: '#666',
  },
  sortTextActive: {
    color: '#fff',
  },
  recipeRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recipeImageContainer: {
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  saveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeContent: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 8,
  },
  recipeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  servingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  conditionsContainer: {
    marginBottom: 8,
  },
  conditionTag: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
  },
  conditionText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '500',
  },
  recipeFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  authorInfo: {
    marginBottom: 4,
  },
  authorName: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  recipeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 11,
    color: '#333',
    marginLeft: 2,
    fontWeight: '600',
  },
  ratingCount: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
  },
  triedCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  triedText: {
    fontSize: 10,
    color: '#4CAF50',
    marginLeft: 2,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  shareText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formGroupHalf: {
    width: '48%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  categoryOption: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryOptionSelected: {
    backgroundColor: '#2E7D32',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#666',
  },
  categoryOptionTextSelected: {
    color: '#fff',
  },
  difficultyOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyOption: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  difficultyOptionSelected: {
    backgroundColor: '#2E7D32',
  },
  difficultyOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  difficultyOptionTextSelected: {
    color: '#fff',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientName: {
    flex: 2,
    marginRight: 8,
  },
  ingredientAmount: {
    flex: 1,
    marginRight: 8,
  },
  ingredientUnit: {
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 8,
    fontWeight: '500',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginRight: 8,
    width: 20,
  },
  instructionInput: {
    flex: 1,
    marginRight: 8,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  conditionOption: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  conditionOptionSelected: {
    backgroundColor: '#2E7D32',
  },
  conditionOptionText: {
    fontSize: 12,
    color: '#666',
  },
  conditionOptionTextSelected: {
    color: '#fff',
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default RecipeSharing;