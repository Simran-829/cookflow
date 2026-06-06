/* Micro Testing Framework for CookFlow */

// Test Registry
const suites = [];
let currentSuite = null;

export const assert = {
  equal(actual, expected, msg) {
    if (actual !== expected) {
      throw new Error(msg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },
  
  ok(value, msg) {
    if (!value) {
      throw new Error(msg || `Expected value to be truthy, got ${JSON.stringify(value)}`);
    }
  },
  
  deepEqual(actual, expected, msg) {
    const aStr = JSON.stringify(actual);
    const eStr = JSON.stringify(expected);
    if (aStr !== eStr) {
      throw new Error(msg || `Expected deep equality: ${eStr}, got ${aStr}`);
    }
  },
  
  throws(fn, expectedErrorSubstring, msg) {
    let threw = false;
    try {
      fn();
    } catch (err) {
      threw = true;
      if (expectedErrorSubstring && !err.message.includes(expectedErrorSubstring)) {
        throw new Error(msg || `Threw error "${err.message}" but expected it to contain "${expectedErrorSubstring}"`);
      }
    }
    if (!threw) {
      throw new Error(msg || `Expected function to throw an error, but it succeeded.`);
    }
  }
};

export function describe(name, fn) {
  const suite = {
    name,
    tests: [],
    passed: 0,
    failed: 0
  };
  suites.push(suite);
  currentSuite = suite;
  fn();
  currentSuite = null;
}

export function it(name, fn) {
  if (!currentSuite) {
    throw new Error("Cannot define 'it' block outside 'describe' block.");
  }
  currentSuite.tests.push({ name, fn });
}

// Wait for iframe DOM content to be fully ready for UI/A11y tests
export function getAppIframeWindow() {
  const iframe = document.getElementById('app-iframe');
  if (!iframe) throw new Error("App iframe element not found.");
  return iframe.contentWindow;
}

export function waitForIframeLoad() {
  return new Promise((resolve) => {
    const iframe = document.getElementById('app-iframe');
    // Check if loaded already
    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
      resolve(iframe.contentWindow);
      return;
    }
    iframe.addEventListener('load', () => {
      resolve(iframe.contentWindow);
    });
  });
}

// Run registry sequentially and display on dashboard
async function runAllSuites() {
  const container = document.getElementById('test-results-list');
  if (container) container.textContent = '';
  
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  const startTime = Date.now();
  
  // Wait for iframe to load before executing tests
  await waitForIframeLoad();

  // Load test suites dynamically
  await import('./security.test.js');
  await import('./api.test.js');
  await import('./ui.test.js');
  await import('./a11y.test.js');

  for (const suite of suites) {
    const suiteEl = document.createElement('div');
    suiteEl.className = 'test-suite-card';
    
    const sHeader = document.createElement('div');
    sHeader.className = 'suite-header';
    
    const sTitle = document.createElement('h2');
    sTitle.className = 'suite-title';
    sTitle.textContent = suite.name;
    sHeader.appendChild(sTitle);
    
    const sBadge = document.createElement('span');
    sBadge.className = 'suite-badge passed';
    sBadge.textContent = 'PASSED';
    sHeader.appendChild(sBadge);
    suiteEl.appendChild(sHeader);

    const caseList = document.createElement('div');
    
    for (const test of suite.tests) {
      totalTests++;
      const caseEl = document.createElement('div');
      caseEl.className = 'test-case';
      
      const textContainer = document.createElement('div');
      const caseTitle = document.createElement('div');
      caseTitle.className = 'case-name';
      caseTitle.textContent = test.name;
      textContainer.appendChild(caseTitle);
      caseEl.appendChild(textContainer);
      
      const cStatus = document.createElement('span');
      cStatus.className = 'case-status passed';
      cStatus.textContent = 'PASS';
      caseEl.appendChild(cStatus);
      
      try {
        await test.fn();
        suite.passed++;
        totalPassed++;
      } catch (err) {
        suite.failed++;
        totalFailed++;
        
        // Update statuses to fail
        sBadge.className = 'suite-badge failed';
        sBadge.textContent = 'FAILED';
        cStatus.className = 'case-status failed';
        cStatus.textContent = 'FAIL';
        
        // Output failure message
        const errorLog = document.createElement('pre');
        errorLog.className = 'error-log';
        errorLog.textContent = err.stack || err.message;
        textContainer.appendChild(errorLog);
      }
      
      caseList.appendChild(caseEl);
      updateDashboardCounts(totalTests, totalPassed, totalFailed, startTime);
    }
    
    suiteEl.appendChild(caseList);
    if (container) container.appendChild(suiteEl);
  }
}

function updateDashboardCounts(total, passed, failed, startTime) {
  const duration = Date.now() - startTime;
  
  const elTotal = document.getElementById('total-count');
  const elPassed = document.getElementById('passed-count');
  const elFailed = document.getElementById('failed-count');
  const elDuration = document.getElementById('duration-val');
  const elProgress = document.getElementById('test-progress');
  
  if (elTotal) elTotal.textContent = total;
  if (elPassed) elPassed.textContent = passed;
  if (elFailed) elFailed.textContent = failed;
  if (elDuration) elDuration.textContent = `${duration}ms`;
  
  if (elProgress) {
    const totalSuitesTestsCount = suites.reduce((acc, s) => acc + s.tests.length, 0);
    const progressPercent = totalSuitesTestsCount > 0 ? (total / totalSuitesTestsCount) * 100 : 100;
    elProgress.style.width = `${progressPercent}%`;
  }
}

// Trigger tests
runAllSuites();
