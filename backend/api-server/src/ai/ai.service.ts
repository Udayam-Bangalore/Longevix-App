import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Meal } from '../meals/entities/meal.entity';
import { User } from '../user/entities/user.entity';
import { GenerateNutrientDto } from './dto/generate-nutrient.dto';

interface ChatContext {
  user: User | null;
  todaysMeals: Meal[];
}

export interface Micronutrients {
  vitamin_c: number;
  iron: number;
  calcium: number;
  vitamin_d: number;
  vitamin_a: number;
  vitamin_b12: number;
  vitamin_b6: number;
  folate: number;
  magnesium: number;
  potassium: number;
  zinc: number;
  selenium: number;
  copper: number;
  manganese: number;
  iodine: number;
}

export interface NutrientData {
  calories: number;
  fat: number;
  protein: number;
  carbohydrates: number;
  micronutrients: Micronutrients;
}

export interface FoodItemWithNutrients extends NutrientData {
  name: string;
  quantity: number;
  unit: string;
}

// USDA FoodData Central API Configuration
const USDA_API_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// Unit conversion factors to grams
const UNIT_CONVERSIONS: { [key: string]: number } = {
  g: 1,
  gm: 1,
  gram: 1,
  grams: 1,
  mg: 0.001,
  ml: 1,
  cup: 240,
  cups: 240,
  glass: 250,
  katori: 150,
  bowl: 250,
  tsp: 5,
  teaspoon: 5,
  tbsp: 15,
  tablespoon: 15,
  oz: 28.35,
  ounce: 28.35,
  lb: 453.6,
  pound: 453.6,
  kg: 1000,
  kilogram: 1000,
};

// Average weights for common food items when measured by piece (grams per piece)
// This converts "1 carrot" or "2 eggs" to accurate gram weights for nutrient calculation
const PIECE_WEIGHTS: { [key: string]: number } = {
  // Eggs
  egg: 50,
  eggs: 50,

  // Fruits
  banana: 120,
  bananas: 120,
  apple: 180,
  apples: 180,
  orange: 150,
  oranges: 150,
  mango: 200,
  mangoes: 200,
  pear: 180,
  pears: 180,
  peach: 150,
  peaches: 150,
  plum: 80,
  plums: 80,
  grape: 5,
  grapes: 5,
  strawberry: 12,
  strawberries: 12,
  blueberry: 2,
  blueberries: 2,
  watermelon: 15000,
  watermelons: 15000,
  melon: 1000,
  melons: 1000,
  pineapple: 1000,
  pineapples: 1000,

  // Vegetables
  carrot: 60,
  carrots: 60, // 1 medium carrot ≈ 60g
  potato: 150,
  potatoes: 150, // 1 medium potato ≈ 150g
  onion: 150,
  onions: 150, // 1 medium onion ≈ 150g
  tomato: 120,
  tomatoes: 120, // 1 medium tomato ≈ 120g
  cucumber: 300,
  cucumbers: 300,
  capsicum: 120,
  capsicums: 120,
  'bell pepper': 120,
  'bell peppers': 120,
  broccoli: 300,
  broccolis: 300,
  cauliflower: 600,
  cauliflowers: 600,
  eggplant: 300,
  eggplants: 300,
  brinjal: 300,
  brinjals: 300,
  spinach: 30,
  spinaches: 30,
  lettuce: 200,
  lettuces: 200,
  cabbage: 1000,
  cabbages: 1000,
  garlic: 5,
  garlics: 5,
  ginger: 50,
  gingers: 50,
  chili: 10,
  chilies: 10,
  chillis: 10,
  'green chili': 10,
  'green chilies': 10,
  lemon: 60,
  lemons: 60,
  lime: 50,
  limes: 50,
  corn: 300,
  corns: 300,
  peas: 50, // per pod
  'green beans': 5, // per bean
  okra: 20,
  okras: 20,
  'ladies finger': 20,
  'ladies fingers': 20,
  'bitter gourd': 150,
  'bitter gourds': 150,
  'bottle gourd': 1000,
  'bottle gourds': 1000,
  'ridge gourd': 250,
  'ridge gourds': 250,
  drumstick: 150,
  drumsticks: 150,
  beetroot: 150,
  beetroots: 150,
  radish: 100,
  radishes: 100,
  turnip: 150,
  turnips: 150,

  // Indian Breads
  roti: 30,
  rotis: 30,
  chapati: 30,
  chapatis: 30,
  paratha: 50,
  parathas: 50,
  naan: 80,
  naans: 80,
  kulcha: 60,
  kulchas: 60,
  puri: 25,
  puris: 25,
  bhatura: 40,
  bhaturas: 40,
  dosa: 80,
  dosas: 80,
  idli: 40,
  idlis: 40,
  uttapam: 100,
  uttapams: 100,
  appam: 60,
  appams: 60,
  bread: 30,
  breads: 30,
  slice: 30,
  slices: 30,
  bun: 40,
  buns: 40,
  pav: 40,
  pavs: 40,

  // Prepared Foods & Snacks
  samosa: 50,
  samosas: 50,
  pakora: 25,
  pakoras: 25,
  vada: 40,
  vadas: 40,
  bonda: 40,
  bondas: 40,
  cutlet: 60,
  cutlets: 60,
  roll: 150,
  rolls: 150,
  burger: 250,
  burgers: 250,
  sandwich: 200,
  sandwiches: 200,
  pizza: 800,
  pizzas: 800,
  'slice of pizza': 200,
  pasta: 100,
  pastas: 100,
  noodle: 100,
  noodles: 100,
  'spring roll': 50,
  'spring rolls': 50,
  momos: 20,
  momo: 20,
  kachori: 40,
  kachoris: 40,
  jalebi: 30,
  jalebis: 30,
  ladoo: 40,
  ladoos: 40,
  barfi: 40,
  barfis: 40,
  'gulab jamun': 50,
  'gulab jamuns': 50,
  rasgulla: 50,
  rasgullas: 50,

  // Dairy
  cheese: 30,
  cheeses: 30,
  'cheese slice': 20,
  paneer: 50,
  paneers: 50,
  tofu: 150,
  tofus: 150,
  yogurt: 150,
  yogurts: 150,
  curd: 150,
  curds: 150,
  dahi: 150,
  milk: 250,
  milks: 250, // 1 cup
  lassi: 300,
  lassis: 300,
  buttermilk: 250,
  butter: 10,
  butters: 10, // per pat
  ghee: 15, // per spoon
  cream: 15,
  'ice cream': 100,
  'ice creams': 100,
  kulfi: 80,
  kulfis: 80,

  // Meat & Fish
  chicken: 150,
  chickens: 150,
  'chicken breast': 150,
  'chicken thigh': 100,
  'chicken leg': 120,
  'chicken wing': 40,
  fish: 150,
  fishes: 150,
  salmon: 150,
  tuna: 150,
  mackerel: 150,
  sardine: 20,
  sardines: 20,
  prawn: 15,
  prawns: 15,
  shrimp: 15,
  shrimps: 15,
  mutton: 150,
  muttons: 150,
  lamb: 150,
  beef: 150,
  pork: 150,
  sausage: 50,
  sausages: 50,
  bacon: 30,
  bacons: 30,
  ham: 30,
  hams: 30,
  meatball: 30,
  meatballs: 30,
  kebab: 50,
  kebabs: 50,
  tikka: 50,
  tikkas: 50,

  // Grains & Legumes
  rice: 200,
  rices: 200, // 1 cup cooked
  pancake: 40,
  pancakes: 40,
  waffle: 50,
  waffles: 50,
  croissant: 60,
  croissants: 60,
  muffin: 60,
  muffins: 60,
  bagel: 90,
  bagels: 90,
  donut: 60,
  donuts: 60,
  cookie: 15,
  cookies: 15,
  biscuit: 15,
  biscuits: 15,
  cracker: 5,
  crackers: 5,
  chips: 30,
  chip: 30,
  'french fries': 100,

  // Nuts & Seeds
  almond: 1.2,
  almonds: 1.2,
  cashew: 1.5,
  cashews: 1.5,
  walnut: 4,
  walnuts: 4,
  pistachio: 0.7,
  pistachios: 0.7,
  peanut: 0.6,
  peanuts: 0.6,
  raisin: 0.5,
  raisins: 0.5,
  date: 7,
  dates: 7,
  fig: 50,
  figs: 50,
  prune: 10,
  prunes: 10,

  // Beverages
  tea: 250,
  teas: 250, // 1 cup
  coffee: 250,
  coffees: 250,
  juice: 250,
  juices: 250,
  smoothie: 300,
  smoothies: 300,
  soda: 330,
  sodas: 330,
  'soft drink': 330,
  'soft drinks': 330,
  water: 250,
  waters: 250,
  beer: 350,
  beers: 350,
  wine: 150,
  wines: 150,

  // Sweets & Desserts
  chocolate: 20,
  chocolates: 20,
  candy: 10,
  candies: 10,
  cake: 100,
  cakes: 100,
  pastry: 80,
  pastries: 80,
  pie: 150,
  pies: 150,
  pudding: 150,
  puddings: 150,
  custard: 150,
  halwa: 100,
  halwas: 100,
  kheer: 200,
  payasam: 200,
  rabri: 150,
  shrikhand: 150,
  basundi: 150,
  sandesh: 30,
  sandeshs: 30,
  rosogolla: 50,
  rosogollas: 50,
  'mishti doi': 150,

  // Spices & Condiments (per spoon/tspoon measure)
  turmeric: 3,
  'chili powder': 3,
  cumin: 3,
  coriander: 3,
  'garam masala': 3,
  salt: 6,
  sugar: 4,
  honey: 21, // 1 tbsp
  oil: 14, // 1 tbsp
  vinegar: 15,
  'soy sauce': 15,
  ketchup: 15,
  mustard: 5,
  mayonnaise: 15,
  pickle: 15,
  achaar: 15,
  chutney: 30,

  // Soups & Curries (per bowl/serving)
  soup: 250,
  soups: 250,
  dal: 250,
  sambar: 250,
  rasam: 200,
  curry: 200,
  curries: 200,
  gravy: 150,
  stew: 250,
  stews: 250,

  // Default fallback
  default: 100,
};

// Nutrient ID mappings for USDA API
const NUTRIENT_IDS = {
  calories: 1008, // Energy (kcal)
  protein: 1003,
  fat: 1004,
  carbohydrates: 1005,
  vitamin_c: 1162,
  iron: 1089,
  calcium: 1087,
  vitamin_d: 1094,
  vitamin_a: 1104,
  vitamin_b12: 1095,
  vitamin_b6: 1096,
  folate: 1177,
  magnesium: 1090,
  potassium: 1092,
  zinc: 1093,
  selenium: 1103,
  copper: 1098,
  manganese: 1101,
  iodine: 1100,
};

@Injectable()
export class AiService {
  private readonly aiServiceUrl: string;
  private readonly usdaApiKey: string;
  private readonly apiServiceKey: string;

  constructor(private readonly configService: ConfigService) {
    this.aiServiceUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:8000';
    this.usdaApiKey = this.configService.get<string>('USDA_API_KEY') || '';
    this.apiServiceKey =
      this.configService.get<string>('API_SERVICE_KEY') || '';
  }

  async chat(message: string, context: ChatContext) {
    try {
      // Build context message with user profile and today's food data
      const contextMessage = this.buildContextMessage(context);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add API key if configured
      if (this.apiServiceKey) {
        headers['Authorization'] = `Bearer ${this.apiServiceKey}`;
      }

      const res = await fetch(`${this.aiServiceUrl}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          context: contextMessage,
        }),
      });

      if (!res.ok) {
        throw new Error('AI chat service failed');
      }

      return await res.json();
    } catch (error) {
      console.error('Error calling AI chat service:', error);

      return {
        response: `This is a fallback response to your question: ${message}`,
      };
    }
  }

  async chatWithImage(
    message: string,
    imageBase64: string,
    context: ChatContext,
  ) {
    try {
      // Build context message with user profile and today's food data
      const contextMessage = this.buildContextMessage(context);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add API key if configured
      if (this.apiServiceKey) {
        headers['Authorization'] = `Bearer ${this.apiServiceKey}`;
      }

      const res = await fetch(`${this.aiServiceUrl}/chat-with-image`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          image: imageBase64,
          context: contextMessage,
        }),
      });

      if (!res.ok) {
        // If the AI service doesn't have the chat-with-image endpoint, fall back to regular chat
        if (res.status === 404) {
          console.log(
            'Chat with image endpoint not found, falling back to text-only chat',
          );
          return this.chat(message, context);
        }
        throw new Error('AI chat with image service failed');
      }

      return await res.json();
    } catch (error) {
      console.error('Error calling AI chat with image service:', error);

      // Return a helpful fallback response for food image analysis
      return {
        response: `I apologize, but I'm currently unable to analyze images directly. However, I can help you with general nutrition advice! 

Based on your profile, here's what I can tell you: ${this.buildContextMessage(context)}

Please describe the food in the image (e.g., "grilled chicken with vegetables"), and I'll provide personalized feedback on whether it's a good choice for your diet and goals!`,
      };
    }
  }

  private buildContextMessage(context: ChatContext): string {
    const { user, todaysMeals } = context;

    let contextMessage = '';

    // Add user profile information
    if (user) {
      contextMessage += 'User Profile:\n';
      if (user.age) contextMessage += `- Age: ${user.age}\n`;
      if (user.sex) contextMessage += `- Sex: ${user.sex}\n`;
      if (user.height) contextMessage += `- Height: ${user.height} cm\n`;
      if (user.weight) contextMessage += `- Weight: ${user.weight} kg\n`;
      if (user.activityLevel)
        contextMessage += `- Activity Level: ${user.activityLevel}\n`;
      if (user.dietType) contextMessage += `- Diet Type: ${user.dietType}\n`;
      if (user.primaryGoal)
        contextMessage += `- Primary Goal: ${user.primaryGoal}\n`;
      contextMessage += '\n';
    }

    // Aggregate today's nutrients
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalVitaminC = 0;
    let totalIron = 0;
    let totalCalcium = 0;
    let totalVitaminD = 0;
    let totalVitaminA = 0;
    let totalVitaminB12 = 0;
    let totalMagnesium = 0;
    let totalPotassium = 0;
    let totalZinc = 0;

    if (todaysMeals && todaysMeals.length > 0) {
      contextMessage += "Today's Food Intake:\n";

      todaysMeals.forEach((meal) => {
        contextMessage += `\n${meal.name}:\n`;
        meal.items.forEach((item) => {
          contextMessage += `- ${item.name}: ${item.calories} cal, ${item.protein}g protein, ${item.carbohydrates}g carbs, ${item.fat}g fat\n`;
          totalCalories += Number(item.calories);
          totalProtein += Number(item.protein);
          totalCarbs += Number(item.carbohydrates);
          totalFat += Number(item.fat);

          if (item.micronutrients) {
            totalVitaminC += Number(item.micronutrients.vitamin_c || 0);
            totalIron += Number(item.micronutrients.iron || 0);
            totalCalcium += Number(item.micronutrients.calcium || 0);
            totalVitaminD += Number(item.micronutrients.vitamin_d || 0);
            totalVitaminA += Number(item.micronutrients.vitamin_a || 0);
            totalVitaminB12 += Number(item.micronutrients.vitamin_b12 || 0);
            totalMagnesium += Number(item.micronutrients.magnesium || 0);
            totalPotassium += Number(item.micronutrients.potassium || 0);
            totalZinc += Number(item.micronutrients.zinc || 0);
          }
        });
      });

      contextMessage += `\nToday's Totals: ${Math.round(totalCalories)} cal, ${Math.round(totalProtein)}g protein, ${Math.round(totalCarbs)}g carbs, ${Math.round(totalFat)}g fat\n`;
    } else {
      contextMessage += 'No food logged today.\n';
    }

    // Calculate all nutrient targets if user data is available
    if (user && user.weight && user.height && user.age && user.sex) {
      const targets = this.calculateDailyTargets(user, {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        vitaminC: totalVitaminC,
        iron: totalIron,
        calcium: totalCalcium,
        vitaminD: totalVitaminD,
        vitaminA: totalVitaminA,
        vitaminB12: totalVitaminB12,
        magnesium: totalMagnesium,
        potassium: totalPotassium,
        zinc: totalZinc,
      });

      contextMessage += `\nDaily Targets & Remaining:\n`;
      contextMessage += `- Calories: ${targets.caloriesConsumed}/${targets.calorieTarget} kcal (${targets.caloriesRemaining} remaining)\n`;
      contextMessage += `- Protein: ${targets.proteinConsumed}/${targets.proteinTarget}g (${targets.proteinRemaining}g remaining)\n`;
      contextMessage += `- Carbs: ${targets.carbsConsumed}/${targets.carbsTarget}g (${targets.carbsRemaining}g remaining)\n`;
      contextMessage += `- Fat: ${targets.fatConsumed}/${targets.fatTarget}g (${targets.fatRemaining}g remaining)\n`;
      contextMessage += `- Vitamin C: ${Math.round(targets.vitaminCConsumed)}/${targets.vitaminCTarget}mg (${Math.round(targets.vitaminCRemaining)}mg remaining)\n`;
      contextMessage += `- Iron: ${Math.round(targets.ironConsumed)}/${targets.ironTarget}mg (${Math.round(targets.ironRemaining)}mg remaining)\n`;
      contextMessage += `- Calcium: ${Math.round(targets.calciumConsumed)}/${targets.calciumTarget}mg (${Math.round(targets.calciumRemaining)}mg remaining)\n`;
      contextMessage += `- Vitamin D: ${Math.round(targets.vitaminDConsumed)}/${targets.vitaminDTarget}IU (${Math.round(targets.vitaminDRemaining)}IU remaining)\n`;
    }

    return contextMessage;
  }

  private calculateDailyTargets(user: User, consumed: any) {
    // Calculate BMR using Mifflin-St Jeor Equation
    const weight = Number(user.weight);
    const height = Number(user.height);
    const age = Number(user.age);
    const isMale = user.sex?.toLowerCase() === 'male';

    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += isMale ? 5 : -161;

    // Activity multipliers for TDEE
    const activityMultipliers: { [key: string]: number } = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      'very active': 1.9,
    };

    const activityMultiplier =
      activityMultipliers[user.activityLevel?.toLowerCase() || ''] || 1.2;
    const tdee = Math.round(bmr * activityMultiplier);

    // Adjust calories based on primary goal
    let calorieTarget = tdee;
    if (user.primaryGoal?.toLowerCase().includes('loss')) {
      calorieTarget = Math.round(tdee * 0.85); // 15% deficit
    } else if (user.primaryGoal?.toLowerCase().includes('gain')) {
      calorieTarget = Math.round(tdee * 1.15); // 15% surplus
    }

    // Calculate macros based on diet type
    let proteinTarget = Math.round(
      weight * (activityMultiplier > 1.55 ? 1.6 : 0.8),
    );
    let fatTarget = Math.round((calorieTarget * 0.25) / 9); // 25% of calories from fat
    let carbsTarget = Math.round(
      (calorieTarget - proteinTarget * 4 - fatTarget * 9) / 4,
    );

    if (user.dietType?.toLowerCase().includes('keto')) {
      fatTarget = Math.round((calorieTarget * 0.7) / 9);
      carbsTarget = Math.round((calorieTarget * 0.05) / 4);
      proteinTarget = Math.round(
        (calorieTarget - fatTarget * 9 - carbsTarget * 4) / 4,
      );
    } else if (user.dietType?.toLowerCase().includes('low carb')) {
      carbsTarget = Math.round((calorieTarget * 0.15) / 4);
      fatTarget = Math.round((calorieTarget * 0.45) / 9);
      proteinTarget = Math.round(
        (calorieTarget - carbsTarget * 4 - fatTarget * 9) / 4,
      );
    }

    // Micronutrient RDA (simplified based on age/sex)
    const vitaminCTarget = isMale ? 90 : 75;
    const ironTarget = isMale ? 8 : age < 50 ? 18 : 8;
    const calciumTarget = age > 50 ? 1200 : 1000;
    const vitaminDTarget = 600;
    const vitaminATarget = isMale ? 900 : 700;
    const vitaminB12Target = 2.4;
    const magnesiumTarget = isMale ? 400 : 310;
    const potassiumTarget = 3500;
    const zincTarget = isMale ? 11 : 8;

    return {
      // Calories
      calorieTarget,
      caloriesConsumed: Math.round(consumed.calories),
      caloriesRemaining: Math.max(0, calorieTarget - consumed.calories),

      // Macros
      proteinTarget,
      proteinConsumed: Math.round(consumed.protein),
      proteinRemaining: Math.max(0, proteinTarget - consumed.protein),

      carbsTarget,
      carbsConsumed: Math.round(consumed.carbs),
      carbsRemaining: Math.max(0, carbsTarget - consumed.carbs),

      fatTarget,
      fatConsumed: Math.round(consumed.fat),
      fatRemaining: Math.max(0, fatTarget - consumed.fat),

      // Micronutrients
      vitaminCTarget,
      vitaminCConsumed: consumed.vitaminC,
      vitaminCRemaining: Math.max(0, vitaminCTarget - consumed.vitaminC),

      ironTarget,
      ironConsumed: consumed.iron,
      ironRemaining: Math.max(0, ironTarget - consumed.iron),

      calciumTarget,
      calciumConsumed: consumed.calcium,
      calciumRemaining: Math.max(0, calciumTarget - consumed.calcium),

      vitaminDTarget,
      vitaminDConsumed: consumed.vitaminD,
      vitaminDRemaining: Math.max(0, vitaminDTarget - consumed.vitaminD),

      vitaminATarget,
      vitaminAConsumed: consumed.vitaminA,
      vitaminARemaining: Math.max(0, vitaminATarget - consumed.vitaminA),

      vitaminB12Target,
      vitaminB12Consumed: consumed.vitaminB12,
      vitaminB12Remaining: Math.max(0, vitaminB12Target - consumed.vitaminB12),

      magnesiumTarget,
      magnesiumConsumed: consumed.magnesium,
      magnesiumRemaining: Math.max(0, magnesiumTarget - consumed.magnesium),

      potassiumTarget,
      potassiumConsumed: consumed.potassium,
      potassiumRemaining: Math.max(0, potassiumTarget - consumed.potassium),

      zincTarget,
      zincConsumed: consumed.zinc,
      zincRemaining: Math.max(0, zincTarget - consumed.zinc),
    };
  }

  private async getUSDANutrients(
    foodName: string,
    grams: number,
  ): Promise<NutrientData | null> {
    if (!this.usdaApiKey) {
      return null;
    }

    try {
      // Improve search query for better results
      let searchQuery = foodName;
      if (foodName.toLowerCase() === 'egg') {
        searchQuery = 'egg whole raw';
      } else if (foodName.toLowerCase() === 'banana') {
        searchQuery = 'banana raw';
      } else if (foodName.toLowerCase() === 'apple') {
        searchQuery = 'apple raw';
      }

      const searchUrl = `${USDA_API_BASE_URL}/foods/search`;

      const res = await axios.get(searchUrl, {
        params: {
          api_key: this.usdaApiKey,
          query: searchQuery,
          dataType: 'Foundation,SR Legacy',
          pageSize: 1,
        },
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
        family: 4,
      });

      const data = res.data;

      if (!data.foods || data.foods.length === 0) {
        return null;
      }

      const food = data.foods[0];
      const nutrients: { [key: number]: number } = {};

      (food.foodNutrients || []).forEach((n: any) => {
        nutrients[n.nutrientId] = n.value;
      });

      const scaleFactor = grams / 100;

      return {
        calories:
          Math.round(
            (nutrients[NUTRIENT_IDS.calories] || 0) * scaleFactor * 100,
          ) / 100,
        fat:
          Math.round((nutrients[NUTRIENT_IDS.fat] || 0) * scaleFactor * 100) /
          100,
        protein:
          Math.round(
            (nutrients[NUTRIENT_IDS.protein] || 0) * scaleFactor * 100,
          ) / 100,
        carbohydrates:
          Math.round(
            (nutrients[NUTRIENT_IDS.carbohydrates] || 0) * scaleFactor * 100,
          ) / 100,
        micronutrients: {
          vitamin_c:
            Math.round(
              (nutrients[NUTRIENT_IDS.vitamin_c] || 0) * scaleFactor * 100,
            ) / 100,
          iron:
            Math.round(
              (nutrients[NUTRIENT_IDS.iron] || 0) * scaleFactor * 100,
            ) / 100,
          calcium:
            Math.round(
              (nutrients[NUTRIENT_IDS.calcium] || 0) * scaleFactor * 100,
            ) / 100,
          vitamin_d:
            Math.round(
              (nutrients[NUTRIENT_IDS.vitamin_d] || 0) * scaleFactor * 100,
            ) / 100,
          vitamin_a:
            Math.round(
              (nutrients[NUTRIENT_IDS.vitamin_a] || 0) * scaleFactor * 100,
            ) / 100,
          vitamin_b12:
            Math.round(
              (nutrients[NUTRIENT_IDS.vitamin_b12] || 0) * scaleFactor * 100,
            ) / 100,
          vitamin_b6:
            Math.round(
              (nutrients[NUTRIENT_IDS.vitamin_b6] || 0) * scaleFactor * 100,
            ) / 100,
          folate:
            Math.round(
              (nutrients[NUTRIENT_IDS.folate] || 0) * scaleFactor * 100,
            ) / 100,
          magnesium:
            Math.round(
              (nutrients[NUTRIENT_IDS.magnesium] || 0) * scaleFactor * 100,
            ) / 100,
          potassium:
            Math.round(
              (nutrients[NUTRIENT_IDS.potassium] || 0) * scaleFactor * 100,
            ) / 100,
          zinc:
            Math.round(
              (nutrients[NUTRIENT_IDS.zinc] || 0) * scaleFactor * 100,
            ) / 100,
          selenium:
            Math.round(
              (nutrients[NUTRIENT_IDS.selenium] || 0) * scaleFactor * 100,
            ) / 100,
          copper:
            Math.round(
              (nutrients[NUTRIENT_IDS.copper] || 0) * scaleFactor * 100,
            ) / 100,
          manganese:
            Math.round(
              (nutrients[NUTRIENT_IDS.manganese] || 0) * scaleFactor * 100,
            ) / 100,
          iodine:
            Math.round(
              (nutrients[NUTRIENT_IDS.iodine] || 0) * scaleFactor * 100,
            ) / 100,
        },
      };
    } catch (error) {
      return null;
    }
  }

  private getFallbackNutrients(grams: number): NutrientData {
    const scaleFactor = grams / 100;
    return {
      calories: Math.round(50 * scaleFactor * 100) / 100,
      fat: 0,
      protein: 0,
      carbohydrates: Math.round(12 * scaleFactor * 100) / 100,
      micronutrients: {
        vitamin_c: 0,
        iron: 0,
        calcium: 0,
        vitamin_d: 0,
        vitamin_a: 0,
        vitamin_b12: 0,
        vitamin_b6: 0,
        folate: 0,
        magnesium: 0,
        potassium: 0,
        zinc: 0,
        selenium: 0,
        copper: 0,
        manganese: 0,
        iodine: 0,
      },
    };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiServiceKey) {
      headers['Authorization'] = `Bearer ${this.apiServiceKey}`;
    }
    return headers;
  }

  private async forwardToApiService(endpoint: string, data: any) {
    try {
      const res = await fetch(`${this.aiServiceUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`AI service failed: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error(`Error calling AI service endpoint ${endpoint}:`, error);
      throw error;
    }
  }

  async generateNutrient(data: GenerateNutrientDto) {
    return this.forwardToApiService('/ai/generate-nutrient', data);
  }

  async chatWithAgent(
    agentName: string,
    message: string,
    userId: string,
    sessionId: string,
    context?: string,
  ) {
    return this.forwardToApiService(`/chat/agent/${agentName}`, {
      message,
      user_id: userId,
      session_id: sessionId,
      context,
    });
  }

  async nutritionLookup(foodName: string, quantity: number, unit: string) {
    return this.forwardToApiService('/tools/nutrition/lookup', {
      food_name: foodName,
      quantity,
      unit,
    });
  }

  async calculateRDA(
    userProfile: Record<string, any>,
    intake: Record<string, number>,
  ) {
    return this.forwardToApiService('/tools/nutrition/rda', {
      user_profile: userProfile,
      intake,
    });
  }

  async visionAnalyze(imageBase64: string, includeNutrition: boolean = true) {
    return this.forwardToApiService('/tools/vision/analyze', {
      image_base64: imageBase64,
      include_nutrition: includeNutrition,
    });
  }

  async ragRetrieve(query: string, topK: number = 3, filterTags?: string[]) {
    const body: any = { query, top_k: topK };
    if (filterTags) {
      body.filter_tags = filterTags;
    }
    return this.forwardToApiService('/tools/rag/retrieve', body);
  }

  async listAgents() {
    try {
      const headers: Record<string, string> = {};
      if (this.apiServiceKey) {
        headers['Authorization'] = `Bearer ${this.apiServiceKey}`;
      }

      const res = await fetch(`${this.aiServiceUrl}/agents`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        throw new Error(`AI service failed: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('Error listing agents:', error);
      throw error;
    }
  }

  async getSession(sessionId: string) {
    try {
      const headers: Record<string, string> = {};
      if (this.apiServiceKey) {
        headers['Authorization'] = `Bearer ${this.apiServiceKey}`;
      }

      const res = await fetch(`${this.aiServiceUrl}/sessions/${sessionId}`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        throw new Error(`AI service failed: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string) {
    try {
      const headers: Record<string, string> = {};
      if (this.apiServiceKey) {
        headers['Authorization'] = `Bearer ${this.apiServiceKey}`;
      }

      const res = await fetch(`${this.aiServiceUrl}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        throw new Error(`AI service failed: ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }
}
