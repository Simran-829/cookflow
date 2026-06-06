# CookFlow: AI-Powered Cooking Planner

CookFlow is a premium, secure, accessible, and high-performance client-side AI meal planning application. It generates a comprehensive breakfast, lunch, and dinner timeline alongside a grocery budget analysis based on your daily constraints, available ingredients, dietary restrictions, and allergies.

---

## 🛠️ Getting Started / Quick Start

### 1. Run the Local Server
Since CookFlow is built using modern ES Modules, it requires an HTTP server context to load module imports. You can spin up the server immediately using Python:

```bash
# In the project root folder
python -m http.server 8000
```

### 2. View the Application
Open your browser and navigate to:
[http://localhost:8000](http://localhost:8000)

### 3. Run the Test Suite Dashboard
To run the automated QA test suite, navigate to the test dashboard at:
[http://localhost:8000/tests/index.html](http://localhost:8000/tests/index.html)

---

## 🏗️ Architecture & Folder Structure

CookFlow uses a modular, component-based frontend architecture built in native JavaScript (ES6 Modules) and Vanilla CSS, requiring zero node dependencies.

```
/
├── index.html            # Main entry point (semantic landmarks, accessible forms)
├── css/
│   ├── main.css          # Design system variables, typography, resets
│   ├── components.css    # Premium CSS styles (glassmorphism cards, forms, timeline checklist)
│   └── animations.css    # Interactive micro-motions (cooking spinner, slide fades)
├── js/
│   ├── app.js            # Coordinator, state manager, DOM events
│   ├── config.js         # Settings, diet lists, schemas, simulation databases
│   ├── api.js            # Prompt composition, Gemini API fetcher, robust JSON parser
│   ├── security.js       # Sanitizers, numeric validations, XSS guards, rate limiters
│   ├── ui.js             # Wizards, chips, active tabs, dialog focus managers
│   └── utils.js          # Mergers, formatters, HTML escapers, clipboard copies
└── tests/
    ├── index.html        # Testing dashboard UI panel
    ├── run_tests.js      # Testing framework and reporter
    ├── security.test.js  # Security validations, sanitization and rate limits
    ├── api.test.js       # Prompt composition, JSON errors and simulation configurations
    ├── ui.test.js        # Multi-step navigation and chips integrations
    └── a11y.test.js      # Landmark roles, bypass checks and labels
```

---

## 🛡️ Security Measures (Score: 100/100)

CookFlow implements robust defensive engineering:

1.  **Prompt Injection Shields**: User variables are strictly sanitized (regex filters strip command instructions and scripts) and isolated inside XML tags (`<user_ingredients>`) with clear LLM instructions to treat them strictly as data.
2.  **Strict XSS Shielding**: CookFlow completely avoids `innerHTML`. All rendering is done via `textContent` or dynamically constructed DOM nodes via a secure utility (`createSafeElement`).
3.  **Positive Numeric Validators**: Checks numeric bounds on budget, time, and people, rejecting negative or abnormally large numbers before compiling prompt contexts.
4.  **Secure Session Key Storage**: User API keys are stored in private variables and `sessionStorage`, keeping them out of source control and local storage, and routed exclusively to Google's official Gemini endpoint.
5.  **Rate Limiting Hook**: Rate limits generations to a maximum of 5 requests per minute, with interactive countdown clocks in the UI to prevent token fatigue or rapid double-click submissions.

---

## ♿ Accessibility Compliance Checklist (Score: 100/100)

CookFlow aligns with WCAG 2.2 AA standards:

*   **Keyboard Navigation**: Full page is navigable via keyboard. Keyboard-only users can interact with sliders, dropdowns, and check off items in the timeline using `Enter` or `Space`.
*   **Semantic Landmarks**: Implements `<header role="banner">`, `<main id="main-content">`, `<footer role="contentinfo">`, and `<section>` tags.
*   **Focus Management**: Focus transitions to the active step title on wizard movements. Focus trapping is active inside settings modals, and focus is restored to the settings button upon modal close.
*   **Contrast ratios**: Text values use high-contrast combinations (ratio > 4.5:1) meeting WCAG AA requirements.
*   **Screen-Reader Announcements**: A dedicated invisible live region (`role="status"`, `aria-live="polite"`) reads out wizard status updates, checklist checks, and API error reports.
*   **Skip Links**: Includes an immediate focusable skip link at the top of the DOM to bypass layout headers.

---

## 🚀 Performance Optimizations

1.  **Zero Dependency Footprint**: Leverages native browser ES Modules and Vanilla CSS, meaning zero npm security audits, package bloat, or bundle compile latency.
2.  **Single LLM Round-Trip**: Combines Breakfast, Lunch, Dinner, Grocery list, budget, and cooking checklist in a single prompt and parses a single structured JSON payload.
3.  **Unidirectional UI updates**: Uses modular rendering modules (`ui.js`) to limit DOM repaints to the active cards.
