/* Automated API & Parsing Tests for CookFlow */
import { describe, it, assert } from './run_tests.js';
import { buildPrompt, cleanAndParseJson, generateCookingPlan } from '../js/api.js';

describe("API & Parsing Tests", () => {

  it("should construct prompt containing constraints and wrap inputs in XML tags", () => {
    const inputs = {
      cookingTime: 30,
      budget: 20,
      diet: 'Vegan',
      allergies: ['Peanuts'],
      people: 2,
      skill: 'Beginner',
      ingredients: ['Avocado'],
      cuisine: 'Mexican'
    };
    
    const prompt = buildPrompt(inputs);
    
    assert.ok(prompt.includes("<cooking_time_minutes>30</cooking_time_minutes>"), "Should contain time within XML tags");
    assert.ok(prompt.includes("<daily_budget_dollars>20</daily_budget_dollars>"), "Should contain budget within XML tags");
    assert.ok(prompt.includes("<dietary_preference>Vegan</dietary_preference>"), "Should contain diet within XML tags");
    assert.ok(prompt.includes("<allergies_to_exclude>Peanuts</allergies_to_exclude>"), "Should contain allergy within XML tags");
  });

  it("should parse clean JSON correctly and merge with fallback schema", () => {
    const validJsonString = `
    {
      "breakfast": {
        "name": "Keto Scramble",
        "description": "Scrambled eggs",
        "prepTime": 5,
        "cookTime": 5,
        "ingredients": ["Eggs"],
        "instructions": ["Cook eggs"]
      }
    }
    `;
    
    const result = cleanAndParseJson(validJsonString);
    
    assert.equal(result.breakfast.name, "Keto Scramble", "Parsed breakfast name should match input");
    assert.ok(result.lunch, "Should merge and fallback lunch from default schema");
    assert.ok(result.groceryList.length > 0, "Should merge and fallback grocery list");
  });

  it("should handle broken/truncated JSON output and return default schema", () => {
    // Truncated invalid JSON structure
    const brokenJson = `{ "breakfast": { "name": "Broken oats", "description" `;
    const result = cleanAndParseJson(brokenJson);
    
    assert.ok(result.breakfast, "Should gracefully resolve to fallback structure");
    assert.equal(result.breakfast.name, "Classic Morning Oats", "Should fall back to default breakfast item");
  });

  it("should customize mock plans according to selected diet and allergies", async () => {
    // Test that simulation engine customizes allergies and budget
    const inputs = {
      cookingTime: 60,
      budget: 15,
      diet: 'None',
      allergies: ['milk'], // triggers substitution of cow's milk
      people: 3,
      ingredients: [],
      cuisine: 'No Preference',
      skill: 'Intermediate'
    };
    
    const plan = await generateCookingPlan(inputs, 'TEST_KEY'); // Use TEST_KEY for simulation
    
    assert.equal(plan.budgetAnalysis.targetBudget, 15, "Should reflect budget constraint");
    // Verify that cow's milk ingredient in mock oats got substituted
    const hasAllergySub = plan.substitutions.some(s => s.ingredient.toLowerCase().includes('milk') || s.replacement.toLowerCase().includes('milk-free'));
    assert.ok(hasAllergySub, "Should record allergy substitutions");
  });

});
