/* UI Renderer and Focus Manager for CookFlow */
import { formatCurrency, copyToClipboard, escapeHtml } from './utils.js';
import { createSafeElement } from './security.js';



/**
 * Handle screen reader live announcements.
 */
export function announceStatus(message) {
  const statusEl = document.getElementById('aria-status');
  if (statusEl) {
    statusEl.textContent = message;
  }
}

/**
 * Trap keyboard focus inside a modal element.
 */
export function setupFocusTrap(modalEl, closeTrigger) {
  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex="0"]';
  
  modalEl.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;
    
    const focusables = Array.from(modalEl.querySelectorAll(focusableSelectors))
                            .filter(el => el.tabIndex >= 0 && !el.disabled);
    if (focusables.length === 0) return;
    
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    
    if (e.shiftKey) { // Shift + Tab
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else { // Tab
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  });
}

/**
 * Dynamic ingredient chip rendering.
 */
export function renderChips(ingredients, containerId, onRemoveCallback) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.textContent = ''; // Clear container safely
  
  if (ingredients.length === 0) {
    const emptySpan = createSafeElement('span', 'No ingredients added yet.', 'helper-text');
    container.appendChild(emptySpan);
    return;
  }
  
  ingredients.forEach((ing, index) => {
    const chip = createSafeElement('span', '', 'chip animate-fade');
    const label = createSafeElement('span', ing);
    chip.appendChild(label);
    
    const removeBtn = createSafeElement('button', '×', 'chip-remove', {
      'type': 'button',
      'aria-label': `Remove ingredient ${ing}`
    });
    
    removeBtn.addEventListener('click', () => {
      onRemoveCallback(index);
    });
    
    chip.appendChild(removeBtn);
    container.appendChild(chip);
  });
}

/**
 * Render the meal plan layout.
 */
export function renderMealPlan(plan, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.textContent = ''; // Clear container safely
  
  const resultsCard = document.createElement('div');
  resultsCard.className = 'card animate-fade';
  resultsCard.id = 'meal-plan-card';
  
  // Header with copy action
  const titleRow = document.createElement('div');
  titleRow.className = 'card-title-row';
  
  const heading = createSafeElement('h2', 'Your CookFlow Cooking Plan', '', { 'id': 'results-heading' });
  titleRow.appendChild(heading);
  
  const copyBtn = createSafeElement('button', 'Copy Plan', 'copy-btn', {
    'type': 'button',
    'aria-label': 'Copy meal plan text to clipboard',
    'id': 'btn-copy-plan'
  });
  
  copyBtn.addEventListener('click', () => {
    triggerCopyPlan(plan, copyBtn);
  });
  
  const newBtn = createSafeElement('button', 'New Plan', 'btn btn-secondary', {
    'type': 'button',
    'aria-label': 'Clear current meal plan and start a new setup',
    'style': 'padding: 6px 12px; font-size: 0.8rem; margin-right: 8px; font-weight: 700;'
  });
  newBtn.addEventListener('click', () => {
    if (window.COOKFLOW_TEST_API) {
      window.COOKFLOW_TEST_API.resetApp();
    }
  });

  const downloadBtn = createSafeElement('button', 'Download Plan', 'copy-btn', {
    'type': 'button',
    'aria-label': 'Download meal plan text file',
    'id': 'btn-download-plan',
    'style': 'margin-left: 8px;'
  });
  
  downloadBtn.addEventListener('click', () => {
    triggerDownloadPlan(plan);
  });

  const buttonWrapper = document.createElement('div');
  buttonWrapper.style.display = 'flex';
  buttonWrapper.style.alignItems = 'center';
  buttonWrapper.appendChild(newBtn);
  buttonWrapper.appendChild(copyBtn);
  buttonWrapper.appendChild(downloadBtn);
  
  titleRow.appendChild(buttonWrapper);
  resultsCard.appendChild(titleRow);
  
  // Tabs Navigation for Breakfast, Lunch, Dinner, Grocery, Budget, Checklist
  const tabsNav = document.createElement('div');
  tabsNav.className = 'tabs-nav';
  tabsNav.setAttribute('role', 'tablist');
  tabsNav.setAttribute('aria-label', 'Meal plan categories');
  
  const categories = [
    { id: 'tab-meals', label: 'Recipes' },
    { id: 'tab-groceries', label: 'Grocery List' },
    { id: 'tab-budget', label: 'Budget Analysis' },
    { id: 'tab-checklist', label: 'Cooking Timeline' }
  ];
  
  categories.forEach((cat, index) => {
    const tab = createSafeElement('button', cat.label, `tab-btn ${index === 0 ? 'active' : ''}`, {
      'role': 'tab',
      'aria-selected': index === 0 ? 'true' : 'false',
      'aria-controls': cat.id,
      'id': `btn-${cat.id}`,
      'tabindex': index === 0 ? '0' : '-1'
    });
    
    tab.addEventListener('click', () => {
      switchTab(cat.id, categories.map(c => c.id));
    });
    
    tab.addEventListener('keydown', (e) => {
      handleTabKeyNav(e, index, categories);
    });
    
    tabsNav.appendChild(tab);
  });
  
  resultsCard.appendChild(tabsNav);
  
  // Tab panels
  resultsCard.appendChild(createMealsPanel(plan));
  resultsCard.appendChild(createGroceriesPanel(plan));
  resultsCard.appendChild(createBudgetPanel(plan));
  resultsCard.appendChild(createChecklistPanel(plan));
  
  container.appendChild(resultsCard);
  
  // Set keyboard focus to results card heading
  heading.setAttribute('tabindex', '-1');
  heading.focus();
  
  announceStatus("Cooking plan generated successfully. Results are displayed on screen.");
}

/**
 * Handle tab navigation via arrow keys.
 */
function handleTabKeyNav(e, index, categories) {
  let targetIndex = -1;
  if (e.key === 'ArrowRight') {
    targetIndex = (index + 1) % categories.length;
  } else if (e.key === 'ArrowLeft') {
    targetIndex = (index - 1 + categories.length) % categories.length;
  }
  
  if (targetIndex !== -1) {
    const targetTabId = categories[targetIndex].id;
    switchTab(targetTabId, categories.map(c => c.id));
    
    const targetBtn = document.getElementById(`btn-${targetTabId}`);
    if (targetBtn) {
      targetBtn.focus();
    }
  }
}

/**
 * Tab toggling state coordinator.
 */
function switchTab(activeId, allIds) {
  allIds.forEach(id => {
    const btn = document.getElementById(`btn-${id}`);
    const panel = document.getElementById(id);
    
    if (id === activeId) {
      if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        btn.setAttribute('tabindex', '0');
      }
      if (panel) {
        panel.classList.add('active');
        panel.style.display = 'block';
      }
    } else {
      if (btn) {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
        btn.setAttribute('tabindex', '-1');
      }
      if (panel) {
        panel.classList.remove('active');
        panel.style.display = 'none';
      }
    }
  });
}

/**
 * Render single meal recipe element.
 */
function createMealRecipe(mealName, mealData) {
  const wrapper = document.createElement('div');
  wrapper.className = 'recipe-card';
  wrapper.style.marginBottom = '24px';
  
  const header = document.createElement('div');
  header.className = 'meal-header';
  
  const title = createSafeElement('h3', mealData.name, 'meal-title');
  header.appendChild(title);
  
  const badge = createSafeElement('span', mealName, 'meal-badge');
  header.appendChild(badge);
  wrapper.appendChild(header);
  
  // Guard arrays defensively
  const ingredients = Array.isArray(mealData.ingredients) ? mealData.ingredients : [];
  const instructions = Array.isArray(mealData.instructions) ? mealData.instructions : [];
  
  // Dynamic Diet/Nutrition Badges row
  const tagsRow = document.createElement('div');
  tagsRow.className = 'meal-tags-row';
  tagsRow.style.display = 'flex';
  tagsRow.style.gap = '8px';
  tagsRow.style.flexWrap = 'wrap';
  tagsRow.style.marginBottom = '12px';
  
  const textContentLower = ingredients.join(' ').toLowerCase();
  if (textContentLower.includes('chicken') || textContentLower.includes('salmon') || textContentLower.includes('egg') || textContentLower.includes('tofu') || textContentLower.includes('tuna')) {
    const tag = createSafeElement('span', '💪 High Protein', 'tag-badge', {
      'style': 'font-size: 0.75rem; background: rgba(124,58,237,0.12); border: 1px solid rgba(124,58,237,0.3); color: hsl(var(--accent-light)); padding: 2px 8px; border-radius: 12px; font-weight: 700;'
    });
    tagsRow.appendChild(tag);
  }
  if (textContentLower.includes('spinach') || textContentLower.includes('broccoli') || textContentLower.includes('avocado') || textContentLower.includes('greens') || textContentLower.includes('asparagus') || textContentLower.includes('salad')) {
    const tag = createSafeElement('span', '🥬 Nutrient-Dense', 'tag-badge', {
      'style': 'font-size: 0.75rem; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); color: hsl(var(--primary)); padding: 2px 8px; border-radius: 12px; font-weight: 700;'
    });
    tagsRow.appendChild(tag);
  }
  if (textContentLower.includes('butter') || textContentLower.includes('olive oil') || textContentLower.includes('ghee') || textContentLower.includes('mayonnaise')) {
    const tag = createSafeElement('span', '🥑 Healthy Fats', 'tag-badge', {
      'style': 'font-size: 0.75rem; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.3); color: #93c5fd; padding: 2px 8px; border-radius: 12px; font-weight: 700;'
    });
    tagsRow.appendChild(tag);
  }
  wrapper.appendChild(tagsRow);
  
  // Time descriptions
  const timeRow = document.createElement('div');
  timeRow.className = 'meal-time-info';
  
  const prep = createSafeElement('span', `Prep: ${mealData.prepTime} min`);
  const cook = createSafeElement('span', `Cook: ${mealData.cookTime} min`);
  timeRow.appendChild(prep);
  timeRow.appendChild(cook);
  wrapper.appendChild(timeRow);
  
  const desc = createSafeElement('p', mealData.description, '', { 'style': 'margin-bottom: 16px; font-style: italic; color: hsl(var(--text-muted));' });
  wrapper.appendChild(desc);
  
  // Ingredients list
  const ingSec = document.createElement('div');
  ingSec.className = 'recipe-section';
  const ingTitle = createSafeElement('h4', 'Ingredients');
  ingSec.appendChild(ingTitle);
  
  const ingList = document.createElement('ul');
  ingList.className = 'recipe-list';
  ingredients.forEach(item => {
    ingList.appendChild(createSafeElement('li', item));
  });
  ingSec.appendChild(ingList);
  wrapper.appendChild(ingSec);
  
  // Instructions list
  const instSec = document.createElement('div');
  instSec.className = 'recipe-section';
  const instTitle = createSafeElement('h4', 'Preparation Steps');
  instSec.appendChild(instTitle);
  
  const instList = document.createElement('ol');
  instList.className = 'recipe-list';
  instructions.forEach(step => {
    instList.appendChild(createSafeElement('li', step));
  });
  instSec.appendChild(instList);
  wrapper.appendChild(instSec);
  
  // Active Cooking Stopwatch Trigger Button
  const timerBtn = createSafeElement('button', '⏱️ Start Cooking Guide & Stopwatch', 'btn btn-secondary', {
    'type': 'button',
    'style': 'padding: 8px 16px; font-size: 0.85rem; margin-top: 8px; font-weight: 700;'
  });
  timerBtn.addEventListener('click', () => {
    openCookingTimer(mealName, mealData);
  });
  wrapper.appendChild(timerBtn);
  
  return wrapper;
}

/**
 * Build Recipes tab panel.
 */
function createMealsPanel(plan) {
  const panel = document.createElement('div');
  panel.className = 'tab-content active';
  panel.id = 'tab-meals';
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', 'btn-tab-meals');
  
  panel.appendChild(createMealRecipe('Breakfast', plan.breakfast));
  
  const divider1 = document.createElement('hr');
  divider1.style.border = '0';
  divider1.style.height = '1px';
  divider1.style.background = 'rgba(255, 255, 255, 0.08)';
  divider1.style.margin = '24px 0';
  panel.appendChild(divider1);
  
  panel.appendChild(createMealRecipe('Lunch', plan.lunch));
  
  const divider2 = divider1.cloneNode(true);
  panel.appendChild(divider2);
  
  panel.appendChild(createMealRecipe('Dinner', plan.dinner));
  
  return panel;
}

/**
 * Build Groceries tab panel.
 */
function createGroceriesPanel(plan) {
  const panel = document.createElement('div');
  panel.className = 'tab-content';
  panel.id = 'tab-groceries';
  panel.style.display = 'none';
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', 'btn-tab-groceries');
  
  const heading = createSafeElement('h3', 'Shopping List', '', { 'style': 'margin-bottom: 12px; color: hsl(var(--accent-light));' });
  panel.appendChild(heading);
  
  const groceryList = Array.isArray(plan.groceryList) ? plan.groceryList : [];
  
  if (groceryList.length === 0) {
    panel.appendChild(createSafeElement('p', 'No grocery items required.'));
    return panel;
  }
  
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginBottom = '28px';
  
  // Table header
  const thead = document.createElement('thead');
  const thr = document.createElement('tr');
  thr.style.borderBottom = '2px solid rgba(255, 255, 255, 0.1)';
  
  const headers = ['Item Name', 'Quantity', 'Est. Cost'];
  headers.forEach(hText => {
    const th = createSafeElement('th', hText, '', { 'style': 'text-align: left; padding: 10px 8px; font-weight: 700;' });
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);
  
  // Table body
  const tbody = document.createElement('tbody');
  groceryList.forEach(item => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
    
    const tdName = createSafeElement('td', item.name || '', '', { 'style': 'padding: 12px 8px;' });
    const tdQty = createSafeElement('td', item.quantity || '', '', { 'style': 'padding: 12px 8px;' });
    const tdCost = createSafeElement('td', formatCurrency(item.cost), '', { 'style': 'padding: 12px 8px;' });
    
    tr.appendChild(tdName);
    tr.appendChild(tdQty);
    tr.appendChild(tdCost);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  panel.appendChild(table);
  
  // Render substitutions if they exist
  const substitutions = Array.isArray(plan.substitutions) ? plan.substitutions : [];
  if (substitutions.length > 0) {
    const subHeading = createSafeElement('h3', 'Ingredient Substitutions', '', { 'style': 'margin-bottom: 12px; color: hsl(var(--accent-light));' });
    panel.appendChild(subHeading);
    
    const subList = document.createElement('ul');
    subList.className = 'recipe-list';
    substitutions.forEach(sub => {
      const li = document.createElement('li');
      const ingSpan = createSafeElement('strong', `${sub.ingredient || ''}: `);
      const repSpan = createSafeElement('span', sub.replacement || '');
      li.appendChild(ingSpan);
      li.appendChild(repSpan);
      subList.appendChild(li);
    });
    panel.appendChild(subList);
  }
  
  return panel;
}

/**
 * Build Budget Analysis tab panel.
 */
function createBudgetPanel(plan) {
  const panel = document.createElement('div');
  panel.className = 'tab-content';
  panel.id = 'tab-budget';
  panel.style.display = 'none';
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', 'btn-tab-budget');
  
  const heading = createSafeElement('h3', 'Budget Feasibility Analysis', '', { 'style': 'margin-bottom: 16px; color: hsl(var(--accent-light));' });
  panel.appendChild(heading);
  
  const analysis = plan.budgetAnalysis;
  const status = analysis.status || 'under-budget';
  
  // Status Box
  const statusBox = document.createElement('div');
  statusBox.className = `budget-status-box ${status}`;
  
  // Score circle with premium SVG progress circle
  let ratingText = 'A';
  if (status === 'over-budget') ratingText = 'F';
  else if (status === 'on-budget') ratingText = 'B';
  
  const svgWrapper = document.createElement('div');
  svgWrapper.style.position = 'relative';
  svgWrapper.style.width = '60px';
  svgWrapper.style.height = '60px';
  svgWrapper.style.flexShrink = '0';
  
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "60");
  svg.setAttribute("height", "60");
  svg.setAttribute("viewBox", "0 0 100 100");
  
  const bgCircle = document.createElementNS(svgNS, "circle");
  bgCircle.setAttribute("cx", "50");
  bgCircle.setAttribute("cy", "50");
  bgCircle.setAttribute("r", "40");
  bgCircle.setAttribute("fill", "transparent");
  bgCircle.setAttribute("stroke", "rgba(255,255,255,0.08)");
  bgCircle.setAttribute("stroke-width", "10");
  svg.appendChild(bgCircle);
  
  const prCircle = document.createElementNS(svgNS, "circle");
  prCircle.setAttribute("cx", "50");
  prCircle.setAttribute("cy", "50");
  prCircle.setAttribute("r", "40");
  prCircle.setAttribute("fill", "transparent");
  
  let strokeColor = 'hsl(var(--primary))';
  if (status === 'over-budget') strokeColor = 'hsl(var(--error))';
  else if (status === 'on-budget') strokeColor = 'hsl(var(--accent))';
  
  prCircle.setAttribute("stroke", strokeColor);
  prCircle.setAttribute("stroke-width", "10");
  prCircle.setAttribute("stroke-linecap", "round");
  prCircle.setAttribute("stroke-dasharray", "251.3");
  
  const ratio = Math.min(1.0, analysis.estimatedCost / (analysis.targetBudget || 1));
  const offsetValue = 251.3 - (251.3 * ratio);
  prCircle.setAttribute("stroke-dashoffset", offsetValue.toString());
  prCircle.setAttribute("transform", "rotate(-90 50 50)");
  svg.appendChild(prCircle);
  svgWrapper.appendChild(svg);
  
  const scoreChar = createSafeElement('div', ratingText, '', {
    'style': `position: absolute; top: 0; left: 0; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.3rem; color: ${strokeColor};`
  });
  svgWrapper.appendChild(scoreChar);
  statusBox.appendChild(svgWrapper);
  
  const textContainer = document.createElement('div');
  let statusHeadline = 'Well Under Target Budget!';
  if (status === 'over-budget') statusHeadline = 'Exceeds Target Budget';
  else if (status === 'on-budget') statusHeadline = 'On Target Budget';
  
  const headText = createSafeElement('strong', statusHeadline, '', { 'style': 'display: block; font-size: 1.1rem; margin-bottom: 2px;' });
  
  const descText = status === 'over-budget'
    ? 'Estimated grocery costs exceed your target budget. Review thrifty tips below.'
    : 'Excellent! Your meal choices fit cleanly within your daily target budget constraints.';
    
  const descElement = createSafeElement('span', descText, '', { 'style': 'font-size: 0.9rem; opacity: 0.9;' });
  
  textContainer.appendChild(headText);
  textContainer.appendChild(descElement);
  statusBox.appendChild(textContainer);
  panel.appendChild(statusBox);
  
  // Cost breakdown
  const targetRow = document.createElement('div');
  targetRow.className = 'budget-detail-row';
  targetRow.appendChild(createSafeElement('span', 'Target Budget Allocated:'));
  targetRow.appendChild(createSafeElement('strong', formatCurrency(analysis.targetBudget)));
  panel.appendChild(targetRow);
  
  const estRow = document.createElement('div');
  estRow.className = 'budget-detail-row';
  estRow.appendChild(createSafeElement('span', 'Estimated Grocery Cost:'));
  estRow.appendChild(createSafeElement('strong', formatCurrency(analysis.estimatedCost)));
  panel.appendChild(estRow);
  
  const diff = analysis.targetBudget - analysis.estimatedCost;
  const diffRow = document.createElement('div');
  diffRow.className = 'budget-detail-row';
  diffRow.appendChild(createSafeElement('span', diff >= 0 ? 'Remaining Savings:' : 'Budget Deficit:'));
  diffRow.appendChild(createSafeElement('strong', formatCurrency(Math.abs(diff)), '', {
    'style': diff >= 0 ? 'color: hsl(var(--primary));' : 'color: hsl(var(--error));'
  }));
  panel.appendChild(diffRow);
  
  // Savings tips
  const savingsTips = Array.isArray(analysis.savingsTips) ? analysis.savingsTips : [];
  if (savingsTips.length > 0) {
    const tipHeading = createSafeElement('h4', 'Thrifty Savings Tips', '', { 'style': 'margin-top: 24px; margin-bottom: 10px; font-weight: 700;' });
    panel.appendChild(tipHeading);
    
    const tipList = document.createElement('ul');
    tipList.className = 'recipe-list';
    savingsTips.forEach(tip => {
      tipList.appendChild(createSafeElement('li', tip));
    });
    panel.appendChild(tipList);
  }
  
  return panel;
}

/**
 * Build Cooking Timeline / Checklist tab panel.
 */
function createChecklistPanel(plan) {
  const panel = document.createElement('div');
  panel.className = 'tab-content';
  panel.id = 'tab-checklist';
  panel.style.display = 'none';
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', 'btn-tab-checklist');
  
  const heading = createSafeElement('h3', 'Cooking Timeline & Task Checklist', '', { 'style': 'margin-bottom: 12px; color: hsl(var(--accent-light));' });
  panel.appendChild(heading);
  
  const desc = createSafeElement('p', 'Follow this chronological checklist to stay on schedule. Check items off as you finish them.', 'helper-text', { 'style': 'margin-bottom: 20px;' });
  panel.appendChild(desc);
  
  const cookingChecklist = Array.isArray(plan.cookingChecklist) ? plan.cookingChecklist : [];
  
  if (cookingChecklist.length === 0) {
    panel.appendChild(createSafeElement('p', 'No checklist tasks compiled.'));
    return panel;
  }
  
  const listWrapper = document.createElement('div');
  listWrapper.id = 'timeline-checklist-wrapper';
  
  cookingChecklist.forEach((item, index) => {
    const li = document.createElement('div');
    li.className = 'checklist-item animate-fade';
    li.setAttribute('role', 'checkbox');
    li.setAttribute('aria-checked', 'false');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', `${item.task || ''}, Duration ${item.duration || 0} minutes`);
    
    const checkbox = document.createElement('div');
    checkbox.className = 'checklist-checkbox';
    li.appendChild(checkbox);
    
    const textCont = document.createElement('div');
    textCont.className = 'checklist-text-container';
    
    const taskTitle = createSafeElement('div', item.task || '', 'checklist-text');
    textCont.appendChild(taskTitle);
    
    const meta = createSafeElement('div', `Duration: ${item.duration || 0}m | Step: ${item.step || ''}`, 'checklist-meta');
    textCont.appendChild(meta);
    li.appendChild(textCont);
    
    // Toggle check state triggers
    const toggleCheck = () => {
      const isChecked = li.classList.toggle('checked');
      li.setAttribute('aria-checked', isChecked ? 'true' : 'false');
      
      const statusText = isChecked ? `Checked off: ${item.task || ''}` : `Unchecked: ${item.task || ''}`;
      announceStatus(statusText);
    };
    
    li.addEventListener('click', toggleCheck);
    li.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleCheck();
      }
    });
    
    listWrapper.appendChild(li);
  });
  
  panel.appendChild(listWrapper);
  return panel;
}

/**
 * Compile the meal plan into a clean plain text representation.
 */
export function compileMealPlanText(plan) {
  const compileRecipeText = (mealName, recipe) => {
    return `${mealName}: ${recipe.name}\nDescription: ${recipe.description}\nActive Time: Prep ${recipe.prepTime}m, Cook ${recipe.cookTime}m\nIngredients:\n${recipe.ingredients.map(i => ` - ${i}`).join('\n')}\nInstructions:\n${recipe.instructions.map((ins, step) => ` ${step + 1}. ${ins}`).join('\n')}`;
  };
  
  const groceriesText = plan.groceryList.map(item => ` - ${item.name} (${item.quantity}) - ${formatCurrency(item.cost)}`).join('\n');
  const substitutionsText = plan.substitutions.map(sub => ` - Use ${sub.replacement} instead of ${sub.ingredient}`).join('\n');
  
  return `COOKFLOW AI DAILY COOKING PLAN
====================================
${compileRecipeText('BREAKFAST', plan.breakfast)}

------------------------------------
${compileRecipeText('LUNCH', plan.lunch)}

------------------------------------
${compileRecipeText('DINNER', plan.dinner)}

====================================
GROCERY SHOPPING LIST
${groceriesText}

SUBSTITUTIONS:
${substitutionsText || 'None required.'}

====================================
BUDGET ANALYSIS:
Target: ${formatCurrency(plan.budgetAnalysis.targetBudget)}
Estimated Cost: ${formatCurrency(plan.budgetAnalysis.estimatedCost)}
Status: ${plan.budgetAnalysis.status.toUpperCase()}
Savings Suggestions:\n${plan.budgetAnalysis.savingsTips.map(t => ` - ${t}`).join('\n')}
`;
}

/**
 * Handle meal plan plain-text compilation and clipboard action.
 */
async function triggerCopyPlan(plan, btnElement) {
  const text = compileMealPlanText(plan);
  const success = await copyToClipboard(text);
  if (success) {
    btnElement.textContent = 'Copied!';
    btnElement.classList.add('copied');
    announceStatus("Meal plan text copied to system clipboard.");
    
    setTimeout(() => {
      btnElement.textContent = 'Copy Plan';
      btnElement.classList.remove('copied');
    }, 2000);
  }
}

/**
 * Handle meal plan text file compilation and download trigger.
 */
function triggerDownloadPlan(plan) {
  try {
    const text = compileMealPlanText(plan);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cookflow-meal-plan.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    announceStatus("Meal plan text file downloaded successfully.");
  } catch (err) {
    console.error("Failed to download plan:", err);
    alert("Failed to download the meal plan file.");
  }
}

/**
 * Interactive cooking timer and checklist guide modal overlay.
 */
export function openCookingTimer(mealName, mealData) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'cooking-timer-title');
  overlay.style.zIndex = '200';
  
  const content = document.createElement('div');
  content.className = 'modal-content';
  content.style.maxWidth = '550px';
  content.style.position = 'relative';
  
  const header = document.createElement('div');
  header.className = 'modal-header';
  
  const title = createSafeElement('h2', `${mealName} Cooking Guide`, 'modal-title', { 'id': 'cooking-timer-title' });
  header.appendChild(title);
  
  const closeBtn = createSafeElement('button', '×', 'modal-close', {
    'type': 'button',
    'aria-label': 'Close cooking timer guide'
  });
  header.appendChild(closeBtn);
  content.appendChild(header);
  
  // Timer face
  const timerCard = document.createElement('div');
  timerCard.style.textAlign = 'center';
  timerCard.style.padding = '18px';
  timerCard.style.background = 'rgba(11, 19, 41, 0.45)';
  timerCard.style.borderRadius = 'var(--border-radius-md)';
  timerCard.style.marginBottom = '20px';
  timerCard.style.border = '1px solid rgba(255, 255, 255, 0.05)';
  
  const timeDisplay = createSafeElement('div', '00:00', '', {
    'style': 'font-size: 3rem; font-weight: 800; font-family: monospace; color: hsl(var(--primary)); letter-spacing: 2px;'
  });
  timerCard.appendChild(timeDisplay);
  
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.justifyContent = 'center';
  controls.style.gap = '12px';
  controls.style.marginTop = '12px';
  
  const playPauseBtn = createSafeElement('button', 'Play', 'btn btn-primary', { 'style': 'padding: 6px 16px; font-size: 0.9rem;' });
  const resetBtn = createSafeElement('button', 'Reset', 'btn btn-secondary', { 'style': 'padding: 6px 16px; font-size: 0.9rem;' });
  controls.appendChild(playPauseBtn);
  controls.appendChild(resetBtn);
  timerCard.appendChild(controls);
  content.appendChild(timerCard);
  
  // Guard instructions array
  const instructions = Array.isArray(mealData.instructions) ? mealData.instructions : [];
  
  // Step progress indicator
  const progressContainer = document.createElement('div');
  progressContainer.className = 'progress-container';
  progressContainer.style.marginBottom = '12px';
  
  const stepProgressBar = document.createElement('div');
  stepProgressBar.className = 'progress-bar';
  stepProgressBar.style.width = '0%';
  progressContainer.appendChild(stepProgressBar);
  content.appendChild(progressContainer);
  
  const progressLabel = createSafeElement('div', `Steps Completed: 0 of ${instructions.length}`, 'helper-text', {
    'style': 'margin-bottom: 20px; font-weight: 700; text-align: right; color: hsl(var(--primary));'
  });
  content.appendChild(progressLabel);
  
  // Steps checklist
  const stepsWrapper = document.createElement('div');
  stepsWrapper.style.maxHeight = '220px';
  stepsWrapper.style.overflowY = 'auto';
  stepsWrapper.style.marginBottom = '20px';
  
  let completed = 0;
  
  instructions.forEach((step, index) => {
    const li = document.createElement('div');
    li.className = 'checklist-item animate-fade';
    li.setAttribute('role', 'checkbox');
    li.setAttribute('aria-checked', 'false');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', `Step ${index + 1}: ${step}`);
    li.style.padding = '10px 12px';
    li.style.marginBottom = '8px';
    
    const checkbox = document.createElement('div');
    checkbox.className = 'checklist-checkbox';
    li.appendChild(checkbox);
    
    const text = createSafeElement('div', `${index + 1}. ${step}`, 'checklist-text', { 'style': 'font-size: 0.9rem;' });
    li.appendChild(text);
    
    const toggleCheck = () => {
      const isChecked = li.classList.toggle('checked');
      li.setAttribute('aria-checked', isChecked ? 'true' : 'false');
      
      completed += isChecked ? 1 : -1;
      const pct = instructions.length > 0 ? (completed / instructions.length) * 100 : 0;
      stepProgressBar.style.width = `${pct}%`;
      progressLabel.textContent = `Steps Completed: ${completed} of ${instructions.length}`;
      
      announceStatus(isChecked ? `Checked step ${index + 1}` : `Unchecked step ${index + 1}`);
    };
    
    li.addEventListener('click', toggleCheck);
    li.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleCheck();
      }
    });
    
    stepsWrapper.appendChild(li);
  });
  content.appendChild(stepsWrapper);
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  
  // Timer State Loops
  let sec = 0;
  let interval = null;
  
  const tick = () => {
    const minutesVal = Math.floor(sec / 60).toString().padStart(2, '0');
    const secondsVal = (sec % 60).toString().padStart(2, '0');
    timeDisplay.textContent = `${minutesVal}:${secondsVal}`;
  };
  
  const start = () => {
    if (interval) return;
    playPauseBtn.textContent = 'Pause';
    interval = setInterval(() => {
      sec++;
      tick();
    }, 1000);
    announceStatus("Cooking stopwatch timer started.");
  };
  
  const pause = () => {
    if (!interval) return;
    playPauseBtn.textContent = 'Play';
    clearInterval(interval);
    interval = null;
    announceStatus("Cooking stopwatch timer paused.");
  };
  
  playPauseBtn.addEventListener('click', () => {
    if (interval) pause();
    else start();
  });
  
  resetBtn.addEventListener('click', () => {
    pause();
    sec = 0;
    tick();
    announceStatus("Stopwatch reset to zero.");
  });
  
  const dismiss = () => {
    pause();
    overlay.remove();
    announceStatus("Closed cooking guide.");
  };
  
  closeBtn.addEventListener('click', dismiss);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss();
  });
  
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dismiss();
  });
  
  setupFocusTrap(overlay, closeBtn);
  closeBtn.focus();
}
