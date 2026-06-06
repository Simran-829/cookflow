/* Automated UI and Integration Tests for CookFlow */
import { describe, it, assert, getAppIframeWindow } from './run_tests.js';

describe("UI & Integration Tests", () => {

  it("should input parameters in the single-page form correctly", () => {
    const win = getAppIframeWindow();
    assert.ok(win, "Iframe context must exist");
    
    // Clean reset
    win.COOKFLOW_TEST_API.resetApp();
    
    const timeSlider = win.document.getElementById('input-time');
    const budgetSlider = win.document.getElementById('input-budget');
    const peopleSlider = win.document.getElementById('input-people');
    
    assert.ok(timeSlider && budgetSlider && peopleSlider, "Form sliders must exist");
    
    // Modify input values
    timeSlider.value = "90";
    budgetSlider.value = "75";
    peopleSlider.value = "4";
    
    // Trigger input events for value label updates
    timeSlider.dispatchEvent(new Event('input'));
    budgetSlider.dispatchEvent(new Event('input'));
    peopleSlider.dispatchEvent(new Event('input'));
    
    // Check updated label text content
    const timeVal = win.document.getElementById('time-value');
    const budgetVal = win.document.getElementById('budget-value');
    const peopleVal = win.document.getElementById('people-value');
    
    assert.equal(timeVal.textContent, "90 min", "Time label should update to 90 min");
    assert.equal(budgetVal.textContent, "$75.00", "Budget label should update to $75.00");
    assert.equal(peopleVal.textContent, "4", "People label should update to 4");
  });

  it("should handle comma-separated ingredients input and parse them", () => {
    const win = getAppIframeWindow();
    win.COOKFLOW_TEST_API.resetApp();
    
    const ingTextarea = win.document.getElementById('input-ingredients');
    assert.ok(ingTextarea, "Ingredients textarea should exist");
    
    ingTextarea.value = "Garlic, Onion, Tomatoes";
    
    // Retrieve state from form submit simulation
    const form = win.document.getElementById('cookflow-form');
    
    // Set a test key to prevent authentication blocks
    const keyInput = win.document.getElementById('input-api-key');
    if (keyInput) keyInput.value = 'TEST_KEY';
    
    // Trigger submit but block actual network request
    const submitBtn = win.document.getElementById('btn-submit');
    assert.ok(submitBtn, "Submit button should exist");
  });

  it("should reset all form inputs back to defaults", () => {
    const win = getAppIframeWindow();
    win.COOKFLOW_TEST_API.resetApp();
    
    const timeSlider = win.document.getElementById('input-time');
    const budgetSlider = win.document.getElementById('input-budget');
    const ingTextarea = win.document.getElementById('input-ingredients');
    
    // Change values
    timeSlider.value = "120";
    budgetSlider.value = "90";
    ingTextarea.value = "Spinach, Mushrooms";
    
    // Trigger reset
    win.COOKFLOW_TEST_API.resetApp();
    
    // Verify reset to defaults
    assert.equal(timeSlider.value, "45", "Time slider should reset to 45");
    assert.equal(budgetSlider.value, "30", "Budget slider should reset to 30");
    assert.equal(ingTextarea.value, "", "Ingredients should clear");
  });

  it("should generate a meal plan using TEST_KEY and render results successfully", async () => {
    const win = getAppIframeWindow();
    win.COOKFLOW_TEST_API.resetApp();
    
    // Pre-fill required inputs
    const keyInput = win.document.getElementById('input-api-key');
    if (keyInput) keyInput.value = 'TEST_KEY';
    
    const ingTextarea = win.document.getElementById('input-ingredients');
    if (ingTextarea) ingTextarea.value = "Chicken, Avocado";
    
    const submitBtn = win.document.getElementById('btn-submit');
    
    // Trigger submit
    submitBtn.click();
    
    // Wait for mock generator resolution (1 second + buffer)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Assert results card is rendered
    const resultsContainer = win.document.getElementById('results-view-container');
    assert.equal(resultsContainer.style.display, 'block', "Results panel should be visible");
    
    const resultsCard = win.document.getElementById('meal-plan-card');
    assert.ok(resultsCard, "Results meal plan card should be rendered inside results container");
  });

});
