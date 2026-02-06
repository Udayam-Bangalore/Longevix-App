/**
 * Nutrition Constants
 * 
 * This file contains default nutritional values and RDA (Recommended Dietary Allowance) values.
 * These are used as fallbacks when user-specific values are not available from the API.
 * 
 * NOTE: In the future, these values should be fetched from the backend API
 * to support personalized nutrition targets based on user profile (age, gender, weight, goals, etc.)
 */

// Default macro targets
export const DEFAULT_MACRO_TARGETS = {
  calories: 2200,
  protein: 75, // grams
} as const;

// RDA Values for micronutrients (daily recommended amounts)
// Based on general adult recommendations
export const RDA_VALUES: Record<string, number> = {
  // Vitamins
  vitamin_c: 90, // mg
  vitamin_d: 20, // mcg
  vitamin_a: 900, // mcg
  vitamin_b12: 2.4, // mcg
  vitamin_b6: 1.3, // mg
  folate: 400, // mcg
  vitamin_e: 15, // mg
  vitamin_k: 120, // mcg
  thiamin: 1.2, // mg
  riboflavin: 1.3, // mg
  niacin: 16, // mg
  
  // Minerals
  iron: 18, // mg
  calcium: 1000, // mg
  magnesium: 400, // mg
  potassium: 2600, // mg
  zinc: 11, // mg
  selenium: 55, // mcg
  copper: 0.9, // mg
  manganese: 2.3, // mg
  iodine: 150, // mcg
  phosphorus: 1250, // mg
  chromium: 35, // mcg
  molybdenum: 45, // mcg
} as const;

// Units for each nutrient
export const NUTRIENT_UNITS: Record<string, string> = {
  vitamin_c: 'mg',
  vitamin_d: 'mcg',
  vitamin_a: 'mcg',
  vitamin_b12: 'mcg',
  vitamin_b6: 'mg',
  folate: 'mcg',
  vitamin_e: 'mg',
  vitamin_k: 'mcg',
  thiamin: 'mg',
  riboflavin: 'mg',
  niacin: 'mg',
  iron: 'mg',
  calcium: 'mg',
  magnesium: 'mg',
  potassium: 'mg',
  zinc: 'mg',
  selenium: 'mcg',
  copper: 'mg',
  manganese: 'mg',
  iodine: 'mcg',
  phosphorus: 'mg',
  chromium: 'mcg',
  molybdenum: 'mcg',
} as const;

// Display names for nutrients
export const NUTRIENT_DISPLAY_NAMES: Record<string, string> = {
  vitamin_c: 'Vitamin C',
  vitamin_d: 'Vitamin D',
  vitamin_a: 'Vitamin A',
  vitamin_b12: 'Vitamin B12',
  vitamin_b6: 'Vitamin B6',
  vitamin_e: 'Vitamin E',
  vitamin_k: 'Vitamin K',
  thiamin: 'Thiamin',
  riboflavin: 'Riboflavin',
  niacin: 'Niacin',
  folate: 'Folate',
  iron: 'Iron',
  calcium: 'Calcium',
  magnesium: 'Magnesium',
  potassium: 'Potassium',
  zinc: 'Zinc',
  selenium: 'Selenium',
  copper: 'Copper',
  manganese: 'Manganese',
  iodine: 'Iodine',
  phosphorus: 'Phosphorus',
  chromium: 'Chromium',
  molybdenum: 'Molybdenum',
} as const;

// Map nutrient display names to RDA keys
export const NUTRIENT_NAME_TO_KEY: Record<string, string> = {
  'Vitamin C': 'vitamin_c',
  'Iron': 'iron',
  'Calcium': 'calcium',
  'Vitamin D': 'vitamin_d',
  'Vitamin A': 'vitamin_a',
  'Vitamin B12': 'vitamin_b12',
  'Vitamin B6': 'vitamin_b6',
  'Folate': 'folate',
  'Magnesium': 'magnesium',
  'Potassium': 'potassium',
  'Zinc': 'zinc',
  'Selenium': 'selenium',
  'Copper': 'copper',
  'Manganese': 'manganese',
  'Iodine': 'iodine',
  'Vitamin E': 'vitamin_e',
  'Vitamin K': 'vitamin_k',
  'Thiamin': 'thiamin',
  'Riboflavin': 'riboflavin',
  'Niacin': 'niacin',
  'Phosphorus': 'phosphorus',
  'Chromium': 'chromium',
  'Molybdenum': 'molybdenum',
} as const;

// Normalize nutrient name to match RDA keys
export function normalizeNutrientName(name: string): string {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  // Map common variations
  const mappings: Record<string, string> = {
    'vitaminc': 'vitamin_c',
    'ascorbicacid': 'vitamin_c',
    'vitamind': 'vitamin_d',
    'vitamina': 'vitamin_a',
    'retinol': 'vitamin_a',
    'vitaminb12': 'vitamin_b12',
    'cobalamin': 'vitamin_b12',
    'folate': 'folate',
    'folicacid': 'folate',
    'vitamine': 'vitamin_e',
    'vitamink': 'vitamin_k',
    'vitaminb1': 'thiamin',
    'thiamin': 'thiamin',
    'thiamine': 'thiamin',
    'vitaminb2': 'riboflavin',
    'riboflavin': 'riboflavin',
    'vitaminb3': 'niacin',
    'niacin': 'niacin',
    'vitaminb6': 'vitamin_b6',
    'pyridoxine': 'vitamin_b6',
  };
  return mappings[normalized] || normalized;
}

// Get unit for nutrient
export function getUnitForNutrient(nutrientName: string): string {
  const normalizedName = normalizeNutrientName(nutrientName);
  return NUTRIENT_UNITS[normalizedName] || 'mg';
}

// Calculate RDA achievement for a specific nutrient
export function calculateRDAAchievement(
  nutrientName: string,
  consumedAmount: number,
  daysInRange: number = 1
): { name: string; achieved: number; total: number; percentage: number } | null {
  const normalizedName = normalizeNutrientName(nutrientName);
  const rdaValue = RDA_VALUES[normalizedName];
  if (!rdaValue) return null;

  // Calculate total RDA needed for the period
  const totalRDA = rdaValue * daysInRange;
  const achieved = Math.min(consumedAmount, totalRDA);

  return {
    name: nutrientName,
    achieved,
    total: totalRDA,
    percentage: Math.min((consumedAmount / totalRDA) * 100, 100),
  };
}

// Default micronutrient display data (for UI initialization)
export const DEFAULT_MICRONUTRIENTS = [
  {
    id: 'vitamin_c',
    name: 'Vitamin C',
    value: 0,
    unit: 'mg',
    percentage: 0,
    rda: 'RDA: 90mg',
    status: 'low' as const,
    icon: 'dna',
    iconColor: '#FF9800',
    iconBg: '#FFF3E0',
    description: 'A powerful antioxidant essential for immune function, collagen synthesis, and iron absorption.',
  },
  {
    id: 'iron',
    name: 'Iron',
    value: 0,
    unit: 'mg',
    percentage: 0,
    rda: 'RDA: 18mg',
    status: 'low' as const,
    icon: 'blood-bag',
    iconColor: '#795548',
    iconBg: '#EFEBE9',
    description: 'Critical mineral for oxygen transport in blood, energy production, and cognitive function.',
  },
  {
    id: 'calcium',
    name: 'Calcium',
    value: 0,
    unit: 'mg',
    percentage: 0,
    rda: 'RDA: 1,000mg',
    status: 'low' as const,
    icon: 'bone',
    iconColor: '#2196F3',
    iconBg: '#E3F2FD',
    description: 'Essential mineral for strong bones, teeth, muscle function, and nerve signaling.',
  },
  {
    id: 'vitamin_d',
    name: 'Vitamin D',
    value: 0,
    unit: 'mcg',
    percentage: 0,
    rda: 'RDA: 20mcg',
    status: 'low' as const,
    icon: 'white-balance-sunny',
    iconColor: '#FFC107',
    iconBg: '#FFFDE7',
    description: 'Fat-soluble vitamin crucial for calcium absorption, bone health, and immune regulation.',
  },
  {
    id: 'vitamin_a',
    name: 'Vitamin A',
    value: 0,
    unit: 'mcg',
    percentage: 0,
    rda: 'UL: 3,000mcg',
    status: 'low' as const,
    icon: 'eye',
    iconColor: '#9C27B0',
    iconBg: '#F3E5F5',
    description: 'Important for vision, immune function, skin health, and reproductive health.',
  },
  {
    id: 'vitamin_b12',
    name: 'Vitamin B12',
    value: 0,
    unit: 'mcg',
    percentage: 0,
    rda: 'RDA: 2.4mcg',
    status: 'low' as const,
    icon: 'brain',
    iconColor: '#673AB7',
    iconBg: '#EDE7F6',
    description: 'Essential B vitamin for nerve tissue health, brain function, and red blood cell formation.',
  },
  {
    id: 'vitamin_b6',
    name: 'Vitamin B6',
    value: 0,
    unit: 'mg',
    percentage: 0,
    rda: 'RDA: 1.3mg',
    status: 'low' as const,
    icon: 'cellphone-text',
    iconColor: '#3F51B5',
    iconBg: '#E8EAF6',
    description: 'Crucial for protein metabolism, cognitive development, and neurotransmitter synthesis.',
  },
  {
    id: 'folate',
    name: 'Folate',
    value: 0,
    unit: 'mcg',
    percentage: 0,
    rda: 'RDA: 400mcg',
    status: 'low' as const,
    icon: 'flower',
    iconColor: '#009688',
    iconBg: '#E0F2F1',
    description: 'B vitamin critical for DNA synthesis, cell division, and preventing neural tube defects.',
  },
  {
    id: 'magnesium',
    name: 'Magnesium',
    value: 0,
    unit: 'mg',
    percentage: 0,
    rda: 'RDA: 400mg',
    status: 'low' as const,
    icon: 'zodiac-gemini',
    iconColor: '#8BC34A',
    iconBg: '#DCEDC8',
    description: 'Involved in 300+ biochemical reactions including energy production, muscle function, and nerve signaling.',
  },
  {
    id: 'potassium',
    name: 'Potassium',
    value: 0,
    unit: 'mg',
    percentage: 0,
    rda: 'RDA: 2,600mg',
    status: 'low' as const,
    icon: 'turbine',
    iconColor: '#CDDC39',
    iconBg: '#F0F4C3',
    description: 'Electrolyte essential for fluid balance, muscle contractions, and heart rhythm.',
  },
  {
    id: 'zinc',
    name: 'Zinc',
    value: 0,
    unit: 'mg',
    percentage: 0,
    rda: 'RDA: 11mg',
    status: 'low' as const,
    icon: 'zodiac-aquarius',
    iconColor: '#00BCD4',
    iconBg: '#B2EBF2',
    description: 'Essential trace mineral for immune function, wound healing, and protein synthesis.',
  },
  {
    id: 'selenium',
    name: 'Selenium',
    value: 0,
    unit: 'mcg',
    percentage: 0,
    rda: 'RDA: 55mcg',
    status: 'low' as const,
    icon: 'atom',
    iconColor: '#03A9F4',
    iconBg: '#B3E5FC',
    description: 'Powerful antioxidant trace mineral that supports thyroid function and immune health.',
  },
  {
    id: 'copper',
    name: 'Copper',
    value: 0,
    unit: 'mg',
    percentage: 0,
    rda: 'RDA: 0.9mg',
    status: 'low' as const,
    icon: 'circle-outline',
    iconColor: '#FF5722',
    iconBg: '#FBE9E7',
    description: 'Trace mineral essential for iron metabolism, connective tissue formation, and energy production.',
  },
  {
    id: 'manganese',
    name: 'Manganese',
    value: 0,
    unit: 'mg',
    percentage: 0,
    rda: 'RDA: 2.3mg',
    status: 'low' as const,
    icon: 'chart-line',
    iconColor: '#607D8B',
    iconBg: '#ECEFF1',
    description: 'Trace mineral important for bone formation, metabolism, and antioxidant defense.',
  },
  {
    id: 'iodine',
    name: 'Iodine',
    value: 0,
    unit: 'mcg',
    percentage: 0,
    rda: 'RDA: 150mcg',
    status: 'low' as const,
    icon: 'water',
    iconColor: '#00BCD4',
    iconBg: '#E0F7FA',
    description: 'Essential mineral for thyroid hormone production and proper metabolism regulation.',
  },
];
