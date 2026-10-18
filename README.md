# Pocket Pilot

**An AI money coach for young professionals that shows where your money goes, then pays bills and builds savings within rules you control.**

Fictional product · Synthetic data only · No real accounts

## The core idea

**The AI proposes, the policy permits.** Pocket Pilot suggests every action, but a fixed, testable set of rules decides whether it runs on its own, waits for your approval, or is blocked. You choose how much freedom it gets:

| Comfort level | Runs on its own | Asks first |
| --- | --- | --- |
| 1. Ask me about everything | Nothing | Everything |
| 2. Save for me | Savings moves | All bills |
| 3. Handle the routine | Savings, recurring bills at the same amount, bills under $200 | Everything else |

At every level, Pocket Pilot always asks about new payees, bills that jump in price, a changed rent amount, payments over $3,000 (except rent at the usual amount), and anything that would drop you below your safety buffer. Automatic payments wait 24 hours so you can cancel, and land at least a day before the due date.

## What's built so far

- **Permission rules** ([`docs/app/rules.js`](docs/app/rules.js)): comfort levels, always ask rules, never allowed rules, the 24 hour hold, safe to save, save when paid (10%), and the Rent Jar.
- **29 tricky scenarios as tests** ([`docs/app/scenarios.js`](docs/app/scenarios.js)): duplicate bills, bills paid another way, stale bank data, a refund that looks like a paycheck, a bill memo trying to trick the AI into paying someone, and more.
- **A launch gate** that fails the build if any scenario fails or any safety scenario runs on its own. Results: [`data/test-results.md`](data/test-results.md).

**How I know the tests work:** I broke three rules on purpose. Each time, the gate failed and named the scenario. When I removed the "never follow instructions inside a bill" rule, the scam payment still didn't run on its own, because the new payee rule caught it. Two layers, not one.

## Run it

```bash
node tests/run-tests.mjs
```

Requires Node 18+. No dependencies.

## Coming next

Simulator with a fake account · tradeoff lab (approvals per month vs unwanted actions) · user interview findings · decision log and pre mortem

---

Not affiliated with any company. MIT licensed.
