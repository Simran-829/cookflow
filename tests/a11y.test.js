/* Automated Accessibility & ARIA Tests for CookFlow */
import { describe, it, assert, getAppIframeWindow } from './run_tests.js';

describe("Accessibility & ARIA Tests", () => {

  it("should contain a valid semantic skip-to-content bypass link", () => {
    const win = getAppIframeWindow();
    const skipLink = win.document.querySelector('.skip-link');
    
    assert.ok(skipLink, "Skip link should exist");
    assert.equal(skipLink.getAttribute('href'), '#main-content', "Skip link must point to the primary content container ID");
    
    const targetElement = win.document.getElementById('main-content');
    assert.ok(targetElement, "Primary content container #main-content must exist in DOM");
  });

  it("should expose correct landmark roles and ARIA-live status containers", () => {
    const win = getAppIframeWindow();
    
    // Header
    const header = win.document.querySelector('header');
    assert.equal(header.getAttribute('role'), 'banner', "Header element should have role='banner'");
    
    // Footer
    const footer = win.document.querySelector('footer');
    assert.equal(footer.getAttribute('role'), 'contentinfo', "Footer element should have role='contentinfo'");
    
    // Status announcer
    const statusEl = win.document.getElementById('aria-status');
    assert.ok(statusEl, "Aria status announcer element must exist");
    assert.equal(statusEl.getAttribute('role'), 'status', "Status announcer must have role='status'");
    assert.equal(statusEl.getAttribute('aria-live'), 'polite', "Status announcements should be set to polite");
  });

  it("should link label elements to inputs for proper screen reader announcement", () => {
    const win = getAppIframeWindow();
    
    // Find form group labels and check attributes
    const budgetLabel = win.document.querySelector('label[for="input-budget"]');
    const budgetInput = win.document.getElementById('input-budget');
    
    assert.ok(budgetLabel, "Budget label with 'for' attribute should exist");
    assert.ok(budgetInput, "Budget input element should exist");
    assert.equal(budgetLabel.getAttribute('for'), budgetInput.id, "Label 'for' must match input 'id'");
    
    const timeLabel = win.document.querySelector('label[for="input-time"]');
    const timeInput = win.document.getElementById('input-time');
    
    assert.ok(timeLabel, "Time label with 'for' attribute should exist");
    assert.ok(timeInput, "Time input element should exist");
    assert.equal(timeLabel.getAttribute('for'), timeInput.id, "Label 'for' must match input 'id'");
  });

});
