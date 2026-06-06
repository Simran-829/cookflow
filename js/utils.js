/* Helper utilities for CookFlow */

/**
 * Deep merge a target object with a source object.
 * Used to ensure all keys from the schema exist even if the LLM skips them.
 */
export function deepMerge(target, source) {
  if (typeof target !== 'object' || target === null) return source;
  if (typeof source !== 'object' || source === null) return target;
  
  const output = { ...target };
  
  if (Array.isArray(target) && Array.isArray(source)) {
    return source.map((item, idx) => {
      if (target[idx] !== undefined) {
        return deepMerge(target[idx], item);
      }
      return item;
    });
  }
  
  Object.keys(source).forEach(key => {
    if (source[key] !== null && typeof source[key] === 'object') {
      if (target[key] === undefined) {
        output[key] = source[key];
      } else {
        output[key] = deepMerge(target[key], source[key]);
      }
    } else {
      output[key] = source[key];
    }
  });
  
  return output;
}

/**
 * Safe currency formatter.
 */
export function formatCurrency(amount, currency = 'USD') {
  const parsed = parseFloat(amount);
  if (isNaN(parsed)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(parsed);
}

/**
 * Escape HTML special characters.
 * Acts as a redundant filter to prevent XSS.
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Copy plain text to clipboard.
 * Gracefully falls back to text area selection for older browsers.
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error("Clipboard copy failed: ", err);
    }
  }
  
  // Fallback
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    textArea.remove();
    return true;
  } catch (err) {
    console.error("Fallback clipboard copy failed: ", err);
    textArea.remove();
    return false;
  }
}
