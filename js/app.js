/* Simplified single-page controller for CookFlow */
import { generateCookingPlan } from './api.js';
import { validateInputs, RateLimiter, sanitizeForPrompt } from './security.js';
import { renderMealPlan, announceStatus } from './ui.js';

// Application State Store
const state = {
  cookingTime: 45,
  budget: 30,
  diet: 'None',
  allergies: [],
  people: 2,
  skill: 'Intermediate',
  ingredients: [],
  cuisine: 'No Preference'
};

const limiter = new RateLimiter(5, 60000);
let userApiKey = '';

// Safe Storage Helpers
const safeStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
};

function getSessionKey() {
  try {
    const urlKey = new URLSearchParams(window.location.search).get('key');
    if (urlKey) {
      sessionStorage.setItem('COOKFLOW_GEMINI_KEY', urlKey);
      return urlKey;
    }
    return sessionStorage.getItem('COOKFLOW_GEMINI_KEY') || localStorage.getItem('COOKFLOW_GEMINI_KEY') || '';
  } catch (e) {
    return '';
  }
}

function setSessionKey(key) {
  try {
    if (key) {
      sessionStorage.setItem('COOKFLOW_GEMINI_KEY', key);
    } else {
      sessionStorage.removeItem('COOKFLOW_GEMINI_KEY');
    }
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  initializeDomEvents();
  restoreSavedState();
});

function initializeDomEvents() {
  const form = document.getElementById('cookflow-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Bind range sliders label updates
  const timeSlider = document.getElementById('input-time');
  const timeVal = document.getElementById('time-value');
  if (timeSlider && timeVal) {
    timeSlider.addEventListener('input', (e) => {
      timeVal.textContent = `${e.target.value} min`;
    });
  }

  const budgetSlider = document.getElementById('input-budget');
  const budgetVal = document.getElementById('budget-value');
  if (budgetSlider && budgetVal) {
    budgetSlider.addEventListener('input', (e) => {
      budgetVal.textContent = `$${parseFloat(e.target.value || 0).toFixed(2)}`;
    });
  }

  const peopleSlider = document.getElementById('input-people');
  const peopleVal = document.getElementById('people-value');
  if (peopleSlider && peopleVal) {
    peopleSlider.addEventListener('input', (e) => {
      peopleVal.textContent = e.target.value;
    });
  }
}

/**
 * Restore API key, form parameters, and previously generated plan on refresh.
 */
function restoreSavedState() {
  // Restore API key
  userApiKey = getSessionKey();
  const keyInput = document.getElementById('input-api-key');
  if (keyInput && userApiKey) {
    keyInput.value = userApiKey;
  }

  // Restore form parameters
  const savedStateStr = safeStorage.getItem('COOKFLOW_SAVED_STATE');
  if (savedStateStr) {
    try {
      const savedState = JSON.parse(savedStateStr);
      Object.assign(state, savedState);
      
      // Update DOM values
      const timeSlider = document.getElementById('input-time');
      const timeVal = document.getElementById('time-value');
      if (timeSlider) {
        timeSlider.value = state.cookingTime;
        if (timeVal) timeVal.textContent = `${state.cookingTime} min`;
      }
      
      const budgetSlider = document.getElementById('input-budget');
      const budgetVal = document.getElementById('budget-value');
      if (budgetSlider) {
        budgetSlider.value = state.budget;
        if (budgetVal) budgetVal.textContent = `$${state.budget.toFixed(2)}`;
      }
      
      const peopleSlider = document.getElementById('input-people');
      const peopleVal = document.getElementById('people-value');
      if (peopleSlider) {
        peopleSlider.value = state.people;
        if (peopleVal) peopleVal.textContent = state.people;
      }
      
      const dietSelect = document.getElementById('select-diet');
      if (dietSelect) dietSelect.value = state.diet;
      
      const cuisineSelect = document.getElementById('select-cuisine');
      if (cuisineSelect) cuisineSelect.value = state.cuisine;
      
      const skillSelect = document.getElementById('select-skill');
      if (skillSelect) skillSelect.value = state.skill;
      
      const ingTextarea = document.getElementById('input-ingredients');
      if (ingTextarea && state.ingredients) {
        ingTextarea.value = state.ingredients.join(', ');
      }
      
      // Checkboxes
      document.querySelectorAll('.allergy-checkbox').forEach(cb => {
        cb.checked = state.allergies.includes(cb.value);
      });
    } catch (e) {
      console.warn("Failed to parse saved state:", e);
    }
  }

  // Restore generated plan
  const savedPlanStr = safeStorage.getItem('COOKFLOW_SAVED_PLAN');
  if (savedPlanStr) {
    try {
      const savedPlan = JSON.parse(savedPlanStr);
      renderMealPlan(savedPlan, 'results-view-container');
      const resultsContainer = document.getElementById('results-view-container');
      if (resultsContainer) resultsContainer.style.display = 'block';
    } catch (e) {
      console.warn("Failed to restore saved plan:", e);
    }
  }
}

/**
 * Handle form submit and API dispatching.
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  // 1. Rate limiter check
  if (!limiter.checkLimit()) {
    const waitTime = limiter.getRemainingCooldown();
    alert(`Too many requests. Please wait ${waitTime} seconds before generating again.`);
    return;
  }

  // Extract API key dynamically (falls back to local simulation if no key is supplied)
  userApiKey = getSessionKey();

  // Extract other inputs
  state.cookingTime = parseInt(document.getElementById('input-time').value, 10);
  state.budget = parseFloat(document.getElementById('input-budget').value);
  state.people = parseInt(document.getElementById('input-people').value, 10);
  state.diet = document.getElementById('select-diet').value;
  state.cuisine = document.getElementById('select-cuisine').value;
  state.skill = document.getElementById('select-skill').value;
  
  const ingText = document.getElementById('input-ingredients').value;
  state.ingredients = ingText.split(',').map(i => i.trim()).filter(Boolean);
  
  state.allergies = Array.from(document.querySelectorAll('.allergy-checkbox:checked')).map(cb => cb.value);

  // Validate parameters
  const validation = validateInputs(state);
  if (!validation.isValid) {
    alert(`Input Validation Failed:\n${Object.values(validation.errors).join('\n')}`);
    return;
  }

  // Save current values to storage
  setSessionKey(userApiKey);
  safeStorage.setItem('COOKFLOW_SAVED_STATE', JSON.stringify(state));

  showLoadingScreen();

  try {
    const plan = await generateCookingPlan(state, userApiKey);
    
    // Save generated plan to cache
    safeStorage.setItem('COOKFLOW_SAVED_PLAN', JSON.stringify(plan));
    
    renderMealPlan(plan, 'results-view-container');
    
    const resultsContainer = document.getElementById('results-view-container');
    if (resultsContainer) resultsContainer.style.display = 'block';
    
    // Scroll results into view
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    showErrorScreen(err.message);
  }
}

function showLoadingScreen() {
  const container = document.getElementById('results-view-container');
  if (!container) return;
  
  container.style.display = 'block';
  container.textContent = '';
  
  const card = document.createElement('div');
  card.className = 'card';
  
  const loader = document.createElement('div');
  loader.className = 'loader-container';
  
  const potAnim = document.createElement('div');
  potAnim.className = 'cooking-pot-animation';
  
  const lid = document.createElement('div');
  lid.className = 'pot-lid';
  const lidHandle = document.createElement('div');
  lidHandle.className = 'pot-lid-handle';
  const body = document.createElement('div');
  body.className = 'pot-body';
  const handleL = document.createElement('div');
  handleL.className = 'pot-handle-l';
  const handleR = document.createElement('div');
  handleR.className = 'pot-handle-r';
  
  const bubbles = document.createElement('div');
  bubbles.className = 'pot-bubbles';
  for (let i = 1; i <= 3; i++) {
    const b = document.createElement('div');
    b.className = `bubble-item bubble-${i}`;
    bubbles.appendChild(b);
  }
  
  potAnim.appendChild(lid);
  potAnim.appendChild(lidHandle);
  potAnim.appendChild(body);
  potAnim.appendChild(handleL);
  potAnim.appendChild(handleR);
  potAnim.appendChild(bubbles);
  
  const text = document.createElement('div');
  text.className = 'loading-text';
  text.textContent = 'CookFlow AI is generating your meal plan...';
  
  loader.appendChild(potAnim);
  loader.appendChild(text);
  card.appendChild(loader);
  container.appendChild(card);
  
  container.scrollIntoView({ behavior: 'smooth' });
  announceStatus("Please wait. CookFlow AI is cooking up your meal plan.");
}

function showErrorScreen(errorMessage) {
  const container = document.getElementById('results-view-container');
  if (!container) return;
  
  container.textContent = '';
  
  const card = document.createElement('div');
  card.className = 'card animate-fade';
  
  const heading = document.createElement('h2');
  heading.style.color = 'hsl(var(--error))';
  heading.style.marginBottom = '12px';
  heading.textContent = 'Plan Generation Failed';
  
  const desc = document.createElement('p');
  desc.style.marginBottom = '24px';
  desc.textContent = `Error: ${errorMessage}`;
  
  const btnClose = document.createElement('button');
  btnClose.className = 'btn btn-primary';
  btnClose.textContent = 'Dismiss';
  btnClose.addEventListener('click', () => {
    container.style.display = 'none';
    container.textContent = '';
  });
  
  card.appendChild(heading);
  card.appendChild(desc);
  card.appendChild(btnClose);
  container.appendChild(card);
  
  heading.setAttribute('tabindex', '-1');
  heading.focus();
  announceStatus(`Failed to generate cooking plan: ${errorMessage}`);
}

export function resetApp() {
  safeStorage.removeItem('COOKFLOW_SAVED_PLAN');
  safeStorage.removeItem('COOKFLOW_SAVED_STATE');
  
  // Reset fields to defaults
  const timeSlider = document.getElementById('input-time');
  const timeVal = document.getElementById('time-value');
  if (timeSlider) {
    timeSlider.value = 45;
    if (timeVal) timeVal.textContent = '45 min';
  }

  const budgetSlider = document.getElementById('input-budget');
  const budgetVal = document.getElementById('budget-value');
  if (budgetSlider) {
    budgetSlider.value = 30;
    if (budgetVal) budgetVal.textContent = '$30.00';
  }

  const peopleSlider = document.getElementById('input-people');
  const peopleVal = document.getElementById('people-value');
  if (peopleSlider) {
    peopleSlider.value = 2;
    if (peopleVal) peopleVal.textContent = '2';
  }

  const dietSelect = document.getElementById('select-diet');
  if (dietSelect) dietSelect.value = 'None';

  const cuisineSelect = document.getElementById('select-cuisine');
  if (cuisineSelect) cuisineSelect.value = 'No Preference';

  const skillSelect = document.getElementById('select-skill');
  if (skillSelect) skillSelect.value = 'Intermediate';

  const ingTextarea = document.getElementById('input-ingredients');
  if (ingTextarea) ingTextarea.value = '';

  document.querySelectorAll('.allergy-checkbox').forEach(cb => {
    cb.checked = false;
  });

  const resultsContainer = document.getElementById('results-view-container');
  if (resultsContainer) {
    resultsContainer.style.display = 'none';
    resultsContainer.textContent = '';
  }

  announceStatus("CookFlow app cleared and reset.");
}

// Global hook for reset accessor
window.COOKFLOW_TEST_API = {
  resetApp,
  state
};
