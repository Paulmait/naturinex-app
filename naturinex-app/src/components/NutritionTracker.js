import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions
} from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import HealthIntegrationService from '../services/HealthIntegrationService';
import HealthDataModel from '../models/HealthDataModel';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Nutrition Tracker Component
 * Tracks daily nutrition intake and provides dietary insights
 */
const NutritionTracker = ({ navigation }) => {
  const [nutritionData, setNutritionData] = useState([]);
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    water: 0
  });
  const [nutritionGoals, setNutritionGoals] = useState({
    calories: 2000,
    carbs: 250, // grams
    protein: 150, // grams
    fat: 65, // grams
    fiber: 25, // grams
    sugar: 50, // grams
    sodium: 2300, // mg
    water: 2000 // ml
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [quickAddItem, setQuickAddItem] = useState('');

  const healthDataModel = new HealthDataModel();

  useEffect(() => {
    initializeNutritionTracker();
  }, []);

  useEffect(() => {
    loadDailyNutrition();
  }, [selectedDate]);

  const initializeNutritionTracker = async () => {
    try {
      setIsLoading(true);
      await loadDailyNutrition();
      await loadNutritionGoals();
    } catch (error) {
      console.error('Nutrition tracker initialization failed:', error);
      Alert.alert('Error', 'Failed to initialize nutrition tracker');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDailyNutrition = async () => {
    try {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      // Load nutrition data from health integration service
      const result = await HealthIntegrationService.readHealthData('nutrition', {
        startDate,
        endDate
      });

      let dailyData = [];
      if (result.success && result.data.length > 0) {
        dailyData = result.data;
      } else {
        // Generate mock data for demonstration
        dailyData = generateMockNutritionData();
      }

      setNutritionData(dailyData);
      calculateDailyTotals(dailyData);
    } catch (error) {
      console.error('Failed to load nutrition data:', error);
    }
  };

  const generateMockNutritionData = () => {
    const meals = [
      {
        name: 'Breakfast',
        calories: 350,
        carbs: 45,
        protein: 15,
        fat: 12,
        fiber: 5,
        sugar: 8,
        sodium: 400,
        time: '08:00'
      },
      {
        name: 'Lunch',
        calories: 520,
        carbs: 55,
        protein: 30,
        fat: 18,
        fiber: 8,
        sugar: 12,
        sodium: 600,
        time: '12:30'
      },
      {
        name: 'Dinner',
        calories: 650,
        carbs: 65,
        protein: 40,
        fat: 25,
        fiber: 10,
        sugar: 15,
        sodium: 800,
        time: '19:00'
      },
      {
        name: 'Snacks',
        calories: 200,
        carbs: 25,
        protein: 8,
        fat: 8,
        fiber: 3,
        sugar: 18,
        sodium: 150,
        time: '15:30'
      }
    ];

    return meals.map((meal, index) =>
      healthDataModel.createHealthDataEntry('nutrition', meal, {
        timestamp: new Date(selectedDate.getTime() + index * 3600000).toISOString(),
        source: 'manual',
        metadata: { mealType: meal.name }
      })
    );
  };

  const calculateDailyTotals = (data) => {
    const totals = {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      water: 1500 // Mock water intake
    };

    data.forEach(entry => {
      const nutrition = entry.value;
      totals.calories += nutrition.calories || 0;
      totals.carbs += nutrition.carbs || 0;
      totals.protein += nutrition.protein || 0;
      totals.fat += nutrition.fat || 0;
      totals.fiber += nutrition.fiber || 0;
      totals.sugar += nutrition.sugar || 0;
      totals.sodium += nutrition.sodium || 0;
    });

    setDailyTotals(totals);
  };

  const loadNutritionGoals = async () => {
    try {
      // In a real app, this would load user-specific goals from storage
      // For now, using default goals based on general recommendations
    } catch (error) {
      console.error('Failed to load nutrition goals:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await HealthIntegrationService.syncAllData();
      await loadDailyNutrition();
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert('Error', 'Failed to refresh nutrition data');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const addQuickNutrition = async () => {
    if (!quickAddItem.trim()) return;

    try {
      // In a real app, this would use a food database API to get nutrition info
      const mockNutrition = {
        name: quickAddItem,
        calories: 100 + Math.random() * 200,
        carbs: 10 + Math.random() * 20,
        protein: 5 + Math.random() * 15,
        fat: 2 + Math.random() * 10,
        fiber: 1 + Math.random() * 5,
        sugar: 2 + Math.random() * 10,
        sodium: 50 + Math.random() * 300
      };

      const nutritionEntry = healthDataModel.createHealthDataEntry('nutrition', mockNutrition, {
        timestamp: new Date().toISOString(),
        source: 'manual',
        metadata: { mealType: 'Snack', quickAdd: true }
      });

      // In a real app, this would save to the health service
      const updatedData = [...nutritionData, nutritionEntry];
      setNutritionData(updatedData);
      calculateDailyTotals(updatedData);

      setQuickAddItem('');
      setQuickAddVisible(false);

      Alert.alert('Success', `Added ${quickAddItem} to your nutrition log`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add nutrition item');
    }
  };

  const renderCaloriesSummary = () => {
    const remaining = nutritionGoals.calories - dailyTotals.calories;
    const percentage = (dailyTotals.calories / nutritionGoals.calories) * 100;

    return (
      <View style={styles.caloriesSummary}>
        <View style={styles.caloriesHeader}>
          <Text style={styles.caloriesTitle}>Daily Calories</Text>
          <TouchableOpacity onPress={() => setQuickAddVisible(true)}>
            <MaterialIcons name="add-circle" size={24} color="#4a90e2" />
          </TouchableOpacity>
        </View>

        <View style={styles.caloriesContent}>
          <View style={styles.caloriesLeft}>
            <Text style={styles.caloriesValue}>{Math.round(dailyTotals.calories)}</Text>
            <Text style={styles.caloriesLabel}>Consumed</Text>
          </View>

          <View style={styles.caloriesCenter}>
            <View style={styles.caloriesProgress}>
              <View
                style={[
                  styles.caloriesProgressFill,
                  { width: `${Math.min(percentage, 100)}%` }
                ]}
              />
            </View>
            <Text style={styles.caloriesGoal}>Goal: {nutritionGoals.calories}</Text>
          </View>

          <View style={styles.caloriesRight}>
            <Text style={[
              styles.caloriesValue,
              { color: remaining >= 0 ? '#2ecc71' : '#e74c3c' }
            ]}>
              {Math.abs(Math.round(remaining))}
            </Text>
            <Text style={styles.caloriesLabel}>
              {remaining >= 0 ? 'Remaining' : 'Over'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMacronutrients = () => {
    const macros = [
      {
        name: 'Carbs',
        current: dailyTotals.carbs,
        goal: nutritionGoals.carbs,
        unit: 'g',
        color: '#3498db'
      },
      {
        name: 'Protein',
        current: dailyTotals.protein,
        goal: nutritionGoals.protein,
        unit: 'g',
        color: '#e74c3c'
      },
      {
        name: 'Fat',
        current: dailyTotals.fat,
        goal: nutritionGoals.fat,
        unit: 'g',
        color: '#f39c12'
      }
    ];

    return (
      <View style={styles.macroContainer}>
        <Text style={styles.sectionTitle}>Macronutrients</Text>
        <View style={styles.macroGrid}>
          {macros.map((macro, index) => {
            const percentage = (macro.current / macro.goal) * 100;
            return (
              <View key={index} style={styles.macroCard}>
                <Text style={styles.macroName}>{macro.name}</Text>
                <Text style={styles.macroValue}>
                  {Math.round(macro.current)}{macro.unit}
                </Text>
                <View style={styles.macroProgress}>
                  <View
                    style={[
                      styles.macroProgressFill,
                      {
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: macro.color
                      }
                    ]}
                  />
                </View>
                <Text style={styles.macroGoal}>
                  {Math.round(percentage)}% of {macro.goal}{macro.unit}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderNutritionChart = () => {
    const chartData = [
      {
        name: 'Carbs',
        population: dailyTotals.carbs,
        color: '#3498db',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      },
      {
        name: 'Protein',
        population: dailyTotals.protein,
        color: '#e74c3c',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      },
      {
        name: 'Fat',
        population: dailyTotals.fat,
        color: '#f39c12',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      }
    ];

    const chartConfig = {
      backgroundGradientFrom: '#fff',
      backgroundGradientTo: '#fff',
      color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Macronutrient Distribution</Text>
        <PieChart
          data={chartData}
          width={screenWidth - 60}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
        />
      </View>
    );
  };

  const renderMealsList = () => (
    <View style={styles.mealsContainer}>
      <Text style={styles.sectionTitle}>Today's Meals</Text>
      {nutritionData.map((meal, index) => (
        <View key={index} style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealName}>
              {meal.metadata?.mealType || 'Meal'} - {meal.value.name || 'Food Item'}
            </Text>
            <Text style={styles.mealTime}>
              {new Date(meal.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          <View style={styles.mealNutrition}>
            <Text style={styles.mealCalories}>
              {Math.round(meal.value.calories)} cal
            </Text>
            <Text style={styles.mealMacros}>
              C: {Math.round(meal.value.carbs)}g |
              P: {Math.round(meal.value.protein)}g |
              F: {Math.round(meal.value.fat)}g
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderMicronutrients = () => {
    const micros = [
      {
        name: 'Fiber',
        current: dailyTotals.fiber,
        goal: nutritionGoals.fiber,
        unit: 'g',
        color: '#2ecc71'
      },
      {
        name: 'Sugar',
        current: dailyTotals.sugar,
        goal: nutritionGoals.sugar,
        unit: 'g',
        color: '#e67e22'
      },
      {
        name: 'Sodium',
        current: dailyTotals.sodium,
        goal: nutritionGoals.sodium,
        unit: 'mg',
        color: '#9b59b6'
      },
      {
        name: 'Water',
        current: dailyTotals.water,
        goal: nutritionGoals.water,
        unit: 'ml',
        color: '#3498db'
      }
    ];

    return (
      <View style={styles.microContainer}>
        <Text style={styles.sectionTitle}>Other Nutrients</Text>
        <View style={styles.microGrid}>
          {micros.map((micro, index) => {
            const percentage = (micro.current / micro.goal) * 100;
            return (
              <View key={index} style={styles.microCard}>
                <View style={styles.microHeader}>
                  <Text style={styles.microName}>{micro.name}</Text>
                  <Text style={[styles.microPercentage, { color: micro.color }]}>
                    {Math.round(percentage)}%
                  </Text>
                </View>
                <View style={styles.microProgress}>
                  <View
                    style={[
                      styles.microProgressFill,
                      {
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: micro.color
                      }
                    ]}
                  />
                </View>
                <Text style={styles.microValue}>
                  {Math.round(micro.current)} / {micro.goal} {micro.unit}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDateSelector = () => (
    <View style={styles.dateSelector}>
      <TouchableOpacity
        style={styles.dateNavButton}
        onPress={() => {
          const newDate = new Date(selectedDate);
          newDate.setDate(newDate.getDate() - 1);
          setSelectedDate(newDate);
        }}
      >
        <MaterialIcons name="chevron-left" size={24} color="#4a90e2" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.dateDisplay}>
        <Text style={styles.selectedDate}>
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
          })}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dateNavButton}
        onPress={() => {
          const newDate = new Date(selectedDate);
          newDate.setDate(newDate.getDate() + 1);
          if (newDate <= new Date()) {
            setSelectedDate(newDate);
          }
        }}
      >
        <MaterialIcons name="chevron-right" size={24} color="#4a90e2" />
      </TouchableOpacity>
    </View>
  );

  const renderQuickAdd = () => {
    if (!quickAddVisible) return null;

    return (
      <View style={styles.quickAddContainer}>
        <View style={styles.quickAddHeader}>
          <Text style={styles.quickAddTitle}>Quick Add Food</Text>
          <TouchableOpacity onPress={() => setQuickAddVisible(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.quickAddInput}
          placeholder="Enter food name..."
          value={quickAddItem}
          onChangeText={setQuickAddItem}
          onSubmitEditing={addQuickNutrition}
        />
        <View style={styles.quickAddButtons}>
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={addQuickNutrition}
          >
            <Text style={styles.quickAddButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="restaurant" size={48} color="#4a90e2" />
        <Text style={styles.loadingText}>Loading nutrition data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nutrition Tracker</Text>
        <TouchableOpacity onPress={onRefresh}>
          <MaterialIcons name="refresh" size={24} color="#4a90e2" />
        </TouchableOpacity>
      </View>

      {/* Date Selector */}
      {renderDateSelector()}

      {/* Quick Add */}
      {renderQuickAdd()}

      {/* Calories Summary */}
      {renderCaloriesSummary()}

      {/* Macronutrients */}
      {renderMacronutrients()}

      {/* Nutrition Chart */}
      {renderNutritionChart()}

      {/* Micronutrients */}
      {renderMicronutrients()}

      {/* Meals List */}
      {renderMealsList()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    marginBottom: 10
  },
  dateNavButton: {
    padding: 5
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center'
  },
  selectedDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50'
  },
  quickAddContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  quickAddHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  quickAddTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50'
  },
  quickAddInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  quickAddButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6
  },
  quickAddButtonText: {
    color: '#fff',
    fontWeight: '500'
  },
  caloriesSummary: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  caloriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  caloriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  caloriesContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  caloriesLeft: {
    alignItems: 'center',
    marginRight: 20
  },
  caloriesCenter: {
    flex: 1
  },
  caloriesRight: {
    alignItems: 'center',
    marginLeft: 20
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  caloriesLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  caloriesProgress: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 5
  },
  caloriesProgressFill: {
    height: '100%',
    backgroundColor: '#4a90e2',
    borderRadius: 4
  },
  caloriesGoal: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  macroContainer: {
    marginHorizontal: 20,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  macroName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8
  },
  macroProgress: {
    width: '100%',
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginBottom: 5
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 2
  },
  macroGoal: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center'
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10
  },
  microContainer: {
    marginHorizontal: 20,
    marginBottom: 20
  },
  microGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  microCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  microHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  microName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50'
  },
  microPercentage: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  microProgress: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginBottom: 8
  },
  microProgressFill: {
    height: '100%',
    borderRadius: 2
  },
  microValue: {
    fontSize: 12,
    color: '#666'
  },
  mealsContainer: {
    marginHorizontal: 20,
    marginBottom: 30
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50'
  },
  mealTime: {
    fontSize: 12,
    color: '#666'
  },
  mealNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a90e2'
  },
  mealMacros: {
    fontSize: 12,
    color: '#666'
  }
});

export default NutritionTracker;