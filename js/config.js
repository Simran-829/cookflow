/* Configuration constraints and schemas for CookFlow */

export const CONSTRAINTS = {
  minCookingTime: 5,
  maxCookingTime: 480,
  minBudget: 0,
  maxBudget: 10000,
  minPeople: 1,
  maxPeople: 100
};

export const CUISINES = [
  "No Preference",
  "Italian",
  "Mexican",
  "Indian",
  "Japanese",
  "Chinese",
  "Mediterranean",
  "French",
  "Thai",
  "American"
];

export const DIETARY_PREFS = [
  "None",
  "Vegetarian",
  "Vegan",
  "Keto",
  "Paleo",
  "Pescatarian",
  "Low-Carb"
];

export const COMMON_ALLERGIES = [
  "Gluten",
  "Peanuts",
  "Tree Nuts",
  "Dairy",
  "Soy",
  "Shellfish",
  "Fish",
  "Eggs"
];

// Fallback Plan Schema to merge parsed values with, ensuring the UI never breaks
export const FALLBACK_SCHEMA = {
  breakfast: {
    name: "Classic Morning Oats",
    description: "Hearty and nutritious breakfast oatmeal topped with sliced bananas and honey.",
    prepTime: 5,
    cookTime: 10,
    ingredients: ["1 cup Rolled oats", "2 cups Milk or water", "1 Banana", "1 tbsp Honey"],
    instructions: ["Bring liquid to a boil in a small pot.", "Stir in oats and simmer for 10 minutes.", "Top with sliced banana and drizzle honey."]
  },
  lunch: {
    name: "Garden Fresh Salad",
    description: "Crisp salad greens tossed with cherry tomatoes, cucumbers, and a light vinaigrette.",
    prepTime: 10,
    cookTime: 0,
    ingredients: ["3 cups Mixed greens", "1 cup Cherry tomatoes", "1 Cucumber", "2 tbsp Olive oil vinaigrette"],
    instructions: ["Wash and slice cherry tomatoes and cucumbers.", "Toss greens, tomatoes, and cucumbers in a salad bowl.", "Drizzle with vinaigrette and serve cold."]
  },
  dinner: {
    name: "Stir-Fry Rice Bowl",
    description: "Savory vegetable stir-fry with tofu or chicken served over a warm bed of brown rice.",
    prepTime: 15,
    cookTime: 15,
    ingredients: ["1 cup Cooked rice", "1 cup Mixed vegetables (broccoli, bell peppers)", "150g Protein (tofu or chicken)", "2 tbsp Soy sauce"],
    instructions: ["Sauté protein in a skillet until fully cooked.", "Add mixed vegetables and cook until tender-crisp.", "Stir in soy sauce, then layer over warm rice."]
  },
  groceryList: [
    { name: "Rolled oats", quantity: "1 box", cost: 3.50 },
    { name: "Banana", quantity: "1 bunch", cost: 1.20 },
    { name: "Mixed salad greens", quantity: "1 bag", cost: 2.99 },
    { name: "Cherry tomatoes", quantity: "1 pint", cost: 2.50 },
    { name: "Mixed stir-fry vegetables", quantity: "1 bag", cost: 3.99 },
    { name: "Tofu or chicken", quantity: "300g", cost: 4.50 }
  ],
  substitutions: [
    { ingredient: "Soy sauce", replacement: "Coconut aminos (Gluten-free / Soy-free option)" },
    { ingredient: "Cow's milk", replacement: "Almond or oat milk (Dairy-free option)" }
  ],
  budgetAnalysis: {
    targetBudget: 25.00,
    estimatedCost: 18.68,
    status: "under-budget", // under-budget, on-budget, over-budget
    savingsTips: [
      "Buy grains and oats in bulk to save up to 40% on breakfast prep.",
      "Choose seasonal vegetables to keep grocery list expenditures low."
    ]
  },
  cookingChecklist: [
    { task: "Prep breakfast oats by boiling liquid", duration: 5, step: "breakfast" },
    { task: "Chop veggies for both salad and stir-fry at once (batch prep)", duration: 10, step: "general" },
    { task: "Sauté dinner protein and steam stir-fry veggies", duration: 15, step: "dinner" }
  ]
};

// Rich simulated database for immediate interactive Demo mode
export const MOCK_MEAL_PLANS = {
  default: FALLBACK_SCHEMA,
  
  "keto": {
    breakfast: {
      name: "Avocado & Egg Skillet",
      description: "Crispy fried eggs served alongside fresh avocado and sliced cherry tomatoes.",
      prepTime: 5,
      cookTime: 5,
      ingredients: ["2 Eggs", "1 Avocado", "1 tbsp Olive oil", "Salt and pepper"],
      instructions: ["Heat olive oil in a skillet.", "Crack eggs and cook to desired doneness.", "Serve with sliced fresh avocado, seasoned with salt and pepper."]
    },
    lunch: {
      name: "Keto Tuna Salad Wraps",
      description: "Creamy tuna salad packed inside crisp romaine lettuce leaf shells.",
      prepTime: 8,
      cookTime: 0,
      ingredients: ["1 can Tuna (drained)", "2 tbsp Mayonnaise", "1 stalk Celery (chopped)", "4 Large Romaine lettuce leaves"],
      instructions: ["Mix drained tuna, mayonnaise, and chopped celery in a small bowl.", "Spoon mixture evenly into romaine lettuce leaves.", "Wrap tightly and serve chilled."]
    },
    dinner: {
      name: "Pan-Seared Garlic Salmon",
      description: "Flaky salmon fillet seared in rich garlic butter served with steamed asparagus.",
      prepTime: 10,
      cookTime: 12,
      ingredients: ["2 Salmon fillets", "2 tbsp Butter", "2 cloves Garlic (minced)", "1 bunch Asparagus"],
      instructions: ["Heat butter and garlic in a pan on medium-high.", "Sear salmon skin-side down for 6 minutes, flip and cook 4 minutes more.", "Steam asparagus and serve alongside salmon."]
    },
    groceryList: [
      { name: "Eggs", quantity: "1 dozen", cost: 3.50 },
      { name: "Avocados", quantity: "3 count", cost: 4.50 },
      { name: "Canned tuna", quantity: "2 cans", cost: 2.80 },
      { name: "Mayonnaise", quantity: "1 jar", cost: 3.20 },
      { name: "Salmon fillets", quantity: "2 pieces", cost: 12.00 },
      { name: "Asparagus", quantity: "1 bunch", cost: 3.50 }
    ],
    substitutions: [
      { ingredient: "Butter", replacement: "Olive oil or ghee (Dairy-free option)" },
      { ingredient: "Mayonnaise", replacement: "Greek yogurt (for low-fat, non-Keto adjustments)" }
    ],
    budgetAnalysis: {
      targetBudget: 40.00,
      estimatedCost: 29.50,
      status: "under-budget",
      savingsTips: [
        "Purchase frozen salmon fillets in bulk rather than fresh slices.",
        "Buy eggs in larger cartons for improved unit-cost value."
      ]
    },
    cookingChecklist: [
      { task: "Chop garlic and snap tough ends off asparagus", duration: 5, step: "dinner" },
      { task: "Prepare tuna salad mixture and wrap in lettuce", duration: 8, step: "lunch" },
      { task: "Sauté eggs and slice avocado for breakfast", duration: 10, step: "breakfast" },
      { task: "Pan-sear salmon and steam asparagus", duration: 15, step: "dinner" }
    ]
  }
};
