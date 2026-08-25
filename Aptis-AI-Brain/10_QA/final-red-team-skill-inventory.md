# WEBAptis B2 — FINAL RED-TEAM QA SKILL INVENTORY

> **Audit Standard:** Ingested & Analyzed Specialized AI QA/Testing Skills  
> **Source Repositories:**  
> 1. `https://github.com/voidmatcha/e2e-skills`  
> 2. `https://github.com/fugazi/test-automation-skills-agents`  
> 3. `https://github.com/willcoliveira/qualiow-playwright-skills`  
> **Date:** 2026-08-25  

---

## 1. SKILL INVENTORY TABLE

| Skill Name | Repository | Category | Core Purpose | Applied in Red-Team? | Justification & Role in Red-Team |
|---|---|---|---|:---:|---|
| `e2e-reviewer` | `voidmatcha/e2e-skills` | Test Code Quality | Deep AST & regex scanner for weak assertions, missing awaits, vacuous checks, silent passes, and test anti-patterns. | ✅ **YES** | Used to audit all 33 existing test suites for false positives and strengthen weak assertions. |
| `playwright-debugger` | `voidmatcha/e2e-skills` | Debugging | Root-cause analysis for flaky or failing Playwright tests, DOM snapshots, network traces. | ✅ **YES** | Used for diagnosing browser runtime errors and state transitions. |
| `playwright-test-generator` | `voidmatcha/e2e-skills` | Test Generation | Generates robust, user-centric Playwright specs with resilient role-based locators. | ✅ **YES** | Used to create new adversarial and regression test suites. |
| `qa-manual-istqb` | `fugazi/test-automation-skills-agents` | Test Strategy / ISTQB | Test planning, risk matrices, equivalence partitioning, boundary value analysis, decision tables. | ✅ **YES** | Formulates our structured multi-domain risk matrix and exploratory charters. |
| `api-testing` | `fugazi/test-automation-skills-agents` | Backend / API QA | REST contract validation, status code fuzzing (400/401/403/404/500), payload edge cases. | ✅ **YES** | Drives API Red-Team attacks against all `/api/*` routes. |
| `a11y-playwright-testing` | `fugazi/test-automation-skills-agents` | Accessibility | WCAG 2.2 AA validation, keyboard navigation (`Tab`, `Enter`, `Escape`), focus traps, color contrast. | ✅ **YES** | Audits UI accessibility and keyboard operability across core flows. |
| `playwright-regression-testing` | `fugazi/test-automation-skills-agents` | Regression QA | Deterministic test execution, quarantine management, regression prevention. | ✅ **YES** | Validates regression stability across all 33+ test suites. |
| `playwright-cli` | `qualiow-playwright-skills` | Live Forensic Browser | Browser instrumentation, network interception, snapshot diffing, DOM forensics. | ✅ **YES** | Used alongside Chrome DevTools MCP for live interactive exploratory testing. |
| `cypress-debugger` | `voidmatcha/e2e-skills` | Cypress Debugging | Cypress-specific test failure diagnosis. | ❌ *No* | Project uses Playwright & TypeScript native tests; Playwright tools selected. |
| `accessibility-selenium-testing` | `fugazi/test-automation-skills-agents` | Java/Selenium A11y | Selenium-based accessibility testing. | ❌ *No* | Project is TypeScript/Next.js; `a11y-playwright-testing` selected. |
| `webapp-selenium-testing` | `fugazi/test-automation-skills-agents` | Java/Selenium E2E | Java/Selenium test authoring. | ❌ *No* | Project uses Node.js/TypeScript Playwright stack. |
| `grill-me-qa` | `fugazi/test-automation-skills-agents` | Adversarial Interrogation | Socratic QA strategy critique. | ℹ️ *Reference* | Principles of adversarial interrogation applied to our test strategy. |

---

## 2. INTEGRATION SUMMARY

- **AST/Grep Test Quality Analysis**: `voidmatcha/e2e-skills` (`e2e-reviewer`) serves as the quality gatekeeper to ensure 0 silent-pass assertions in our test files.
- **ISTQB Methodology**: `fugazi/test-automation-skills-agents` (`qa-manual-istqb` & `api-testing`) establishes our risk-based test design.
- **Forensic Browser Execution**: Chrome DevTools MCP and `qualiow-playwright-skills` drive our live browser red-teaming.
