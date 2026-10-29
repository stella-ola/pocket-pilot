# Pocket Pilot

**An AI money coach for young professionals that shows where your money goes, then pays bills and builds savings within rules you control.**

**[Try the simulator](https://stella-ola.github.io/pocket-pilot/)** · Fictional product · Synthetic data only · No real accounts

## The core idea

**The AI proposes, the policy permits.** Pocket Pilot suggests every action, but a fixed, testable set of rules decides whether it runs on its own, waits for your approval, or is blocked. You choose how much freedom it gets:

| Comfort level | Runs on its own | Asks first |
| --- | --- | --- |
| 1. Ask me about everything | Nothing | Everything |
| 2. Save for me | Savings moves | All bills |
| 3. Handle the routine | Savings, recurring bills at the same amount, bills under $200 | Everything else |

At every level, Pocket Pilot always asks about new payees, bills that jump in price, a changed rent amount, payments over $3,000 (except rent at the usual amount), and anything that would drop you below your safety buffer. Automatic payments wait 24 hours so you can cancel, and land at least a day before the due date.

## v2: approve a rule once, not every bill

**The problem I found in v1:** if Pocket Pilot asks before every bill, you still do all the work, just in a different app. Worse, people who get a stream of approval requests start tapping "approve" without reading, so the one request that matters gets missed. Approval fatigue makes the product less safe, not more. v1's only way out was jumping to "Handle the routine" for everything, which is a big step most people won't take on day one.

**What changed:**

| v2 feature | What it does |
| --- | --- |
| **Standing permissions** | Approve one payee once, up to a limit ("pay Bright Mobile automatically, up to $71.50"). Works at any comfort level, even "Ask me about everything." |
| **Only ask when something is unusual** | Every safety rule runs before a standing permission: a bill that jumps, a possible duplicate, a payee that isn't trusted, the safety buffer, old bank data, chat suggestions, and the 24 hour hold. Cancellations and text inside a bill are handled before any of it. |
| **Trust ladder** | After you approve the same bill 3 times in a row at the same amount, Pocket Pilot offers a standing permission with 10% headroom. Never offered over $3,000, and payments that ran on their own don't count as approvals. |
| **Weekly check in** | Asks that are only waiting because of your comfort level can be approved together in one tap. Anything with a real reason (new payee, price jump, duplicate) is flagged to look at one by one. |

**The result, on the same month of 9 bills:**

| Version | Times Maya is interrupted |
| --- | --- |
| v1, ask about every bill | 9 |
| v2, weekly check in only | 3 |
| v2, plus standing permissions | 2 (a new gym and a water bill that more than doubled) |

**A bug the v2 tests caught:** if the same bill arrived twice while the first was still on hold or waiting for approval, nothing linked the two, so a one tap approval or a standing permission could pay it twice. v1 had the same gap, but v2 makes automatic payments far more common. Now waiting payments count in the duplicate check, and scenarios S13 and C4 guard it.

**How I know the v2 tests work:** I broke six v2 rules on purpose (let standing permissions skip safety checks, remove the limit, batch every ask, ignore whether past payments were approved, drop the $3,000 cap, and skip the trusted payee check). The gate failed every time and named the scenarios. When standing permissions skipped every safety check, the scam bill was still blocked and cancellations still asked, because those rules sit in an earlier layer.

**Metrics I'd watch:** bills paid on time with no effort (goal), approval requests per person per month (should fall), and how often people cancel an automatic payment during the hold (if it rises, Pocket Pilot is acting too freely).

## What's built so far

- **The PRD** ([`docs/PRD.md`](docs/PRD.md)): problem, target user, competitive analysis (Piere, Chime, Rocket Money, Cleo, Copilot Money), permission model, features, flows, the healthy money months North Star, risks, and trust and privacy design.

- **Permission rules** ([`docs/app/rules.js`](docs/app/rules.js)): comfort levels, always ask rules, never allowed rules, the 24 hour hold, safe to save, save when paid (10%), and the Rent Jar.
- **Insights and deals** ([`docs/app/insights.js`](docs/app/insights.js)): reads a statement, finds patterns with the numbers behind them, and ranks better deals by what the person saves per year. Referral fees are disclosed and never change the order. Suggestions go through the same permission rules; advice never moves money by itself.
- **59 tricky scenarios as tests** (36 from v1, 23 for v2) ([`docs/app/scenarios.js`](docs/app/scenarios.js)): duplicate bills, bills paid another way, stale bank data, a refund that looks like a paycheck, a bill memo trying to trick the AI into paying someone, an insight suggesting a cancellation, a deal that pays a referral fee, and more.
- **An interactive simulator** ([`docs/index.html`](docs/index.html)): a phone view of Maya, a fictional young professional, beside a control room. Pick a comfort level, send paychecks, bills and trouble, and see what runs, what asks and what gets blocked, with the reason for each. All 59 scenarios run live underneath.
- **A launch gate** that fails the build if any scenario fails or any safety scenario runs on its own. Results: [`data/test-results.md`](data/test-results.md).

**How I know the tests work:** I broke five rules on purpose: following instructions inside a bill, ranking deals by referral fee, letting insight payments run on their own, cancelling without asking, and skipping the new payee check. Each time, the gate failed and named the scenario. When I removed the "never follow instructions inside a bill" rule, the scam payment still didn't run on its own, because the new payee rule caught it. Two layers, not one.

## Run it

```bash
node tests/run-tests.mjs
```

Requires Node 18+. No dependencies.

## Coming next

User interview findings · decision log and pre mortem

---

Not affiliated with any company. MIT licensed.
