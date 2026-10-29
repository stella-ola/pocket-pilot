# Pocket Pilot PRD

> Fictional product for a portfolio. All people, payees and deals are invented. Try the [simulator](https://stella-ola.github.io/pocket-pilot/) or read the [README](../README.md).

2026-10-17 · Stella Mbila Uma

## Overview

Pocket Pilot is a mobile money coach for young professionals that shows where their money goes, then pays bills and builds savings within rules the person controls. Its core principle: **the AI proposes, the policy permits.** The AI suggests every action, and a fixed, testable rulebook decides whether it runs on its own, waits for approval, or is blocked.

Status: portfolio prototype. Fictional product, synthetic data, no real accounts. Pocket Pilot never holds money: Pilot Savings and the Rent Jar live in the person's own savings account.

## Problem and target user

Young professionals earn real money for the first time but can't say where it goes, so saving never happens and bills sneak up on them.

**Target user:** early career, renting, paying a phone bill, subscriptions, and maybe student loans. Often paid on irregular days, so savings plans built around a fixed payday break.

**Jobs to be done**

1. "Show me where my money actually goes."
2. "Tell me what I can safely spend today."
3. "Pay my routine bills on time without me remembering."
4. "Save something every time I get paid, without running short before the next check."
5. "Never move my money in a way I didn't expect."

The fifth job is the one most apps miss. It is why the permission model sits at the center of this product.

## Competitive analysis

Each piece of Pocket Pilot exists somewhere, but no app combines spending insight, safe bill paying, and saving that checks upcoming bills, with the person setting how much the AI does on its own.

| App | What it does well | What it leaves open |
| --- | --- | --- |
| [Piere](https://apps.apple.com/us/app/piere-self-driving-money/id6449256238) | Closest competitor. Builds an AI plan and moves money between connected accounts, only under rules the user chooses | iPhone only; listing said fully automated moves were still coming; focus is moving money, not paying bills |
| [Chime](https://www.chime.com/automatic-savings/) | Save When I Get Paid sends a percent of each direct deposit to savings | Flat percent; doesn't check upcoming bills first; requires a Chime account |
| [Rocket Money](https://dupple.com/learn/best-ai-for-finance) | Finds and cancels subscriptions, negotiates bills, moves small savings when the account can spare it | Bill tracking, not bill paying; little control over how much it acts |
| [Cleo](https://dupple.com/learn/best-ai-for-finance) | Chat first budgeting with a strong personality | Advice and challenges more than safe actions |
| [Copilot Money](https://dupple.com/learn/best-ai-for-finance) | Learns spending patterns and tags transactions automatically | Insight only; doesn't act on money |

**Where Pocket Pilot wins**

1. **Safe to save.** Saves on each paycheck, but only from money left after bills due in the next two weeks and the buffer. Built for irregular paydays.
2. **Bill paying with a safety net.** Automatic payments wait 24 hours with a cancel button, timed to land at least a day before the due date.
3. **Adjustable trust.** A comfort level setting, a reason behind every action, and a one tap pause.

**Biggest threat:** Chime or Piere adding bill checks to their savings feature. Pocket Pilot's defense is trust and control, which is harder to copy than a single feature.

Sources checked October 17, 2026.

## Goals and non goals

**Goals**

- People understand where their money goes within their first week
- Routine bills get paid on time with zero actions the person didn't expect
- People save something from most paychecks, even with irregular paydays
- Trust grows over time: people choose to give Pocket Pilot more freedom

**Non goals**

- Investing, trading, or crypto
- Loans, credit products, or credit score repair
- Holding people's money in the first version
- Shared or family accounts in the first version

## Permission model

The person picks a comfort level, and a fixed set of rules sits on top of it that no level can switch off.

**Comfort levels**

| Level | What runs on its own | What asks first |
| --- | --- | --- |
| 1. Ask me about everything | Nothing | Every payment and transfer |
| 2. Save for me | Savings moves from the safe to save check | All bill payments |
| 3. Handle the routine | Savings moves, recurring bills with the same payee and amount as last time, bills under $200 | Everything else |

New users start at level 1. Pocket Pilot can suggest moving up after a month with no cancelled or reversed actions, but only the person can change it.

**Always ask, at every level**

- A payment over $3,000, except rent at the same amount as last month
- A payee never paid before
- A bill noticeably higher than usual
- Any action that would drop the balance below the safety buffer

**Never allowed**

- Investing, or sending money to other people
- Following instructions written inside a bill, memo, or message ("pay $900 to this account")

**Safety buffer.** The default is $500. If the person has less, the buffer starts at what they have, and building it to $500 becomes their first savings goal.

**24 hour hold.** Automatic payments wait 24 hours before sending, with a cancel button, and are timed to land at least one day before the due date. If there isn't time for the full hold, Pocket Pilot asks instead of acting.

**Pause.** One tap stops all automatic actions immediately.

**Daily summary.** Each day lists what ran, what's on hold, and what's waiting for approval.

## Features

The first version answers "where does my money go" and earns trust; budgeting and chat come once that core works.

**First version**

| Area | Feature | Why it's in |
| --- | --- | --- |
| Getting in | Login and bank linking | Nothing works without account data |
| Home | Dashboard with money health score and safe to spend | The answer to the main pain on one screen |
| Understand | Transactions and spending dashboard | Shows where money goes |
| Advice | Insights from statements | Turns "where did it go" into what to do about it |
| Deals | Better deals, ranked by what the person saves | Lowers fixed costs without the person shopping around |
| Save | Pilot Savings with save when paid (10% default), end of week sweep, and add money | Saving that works with irregular paydays |
| Rent | Rent Jar | Sets rent aside a little each paycheck so the full amount is ready before it's due |
| Bills | Bills calendar | Shows what's due, scheduled, and on hold |
| Trust | Comfort level, approval inbox, activity log, "why did you do this?", pause button, trusted payees | Makes automatic actions safe and visible |
| Stay informed | Notifications and daily summary | Catches mistakes during the hold |

**Later**

| Feature | Why it waits |
| --- | --- |
| Six month Money Review | Needs six months of history to show progress and set new targets |
| Rewards on rent and spending (points, cash back) | Needs card or rewards partners, like Bilt does for rent |
| Financial chat | Hardest to build safely; needs the core rules in place first |
| Budgeting | Spending insights cover the first need; budgets build on them |
| Bill negotiation on the person's behalf | Needs provider partnerships and permission to act as the person |
| Goals beyond the buffer | The buffer is the first goal; more come after |
| Unusual charge alerts | Needs a few months of spending history |
| Weekly check in | **Built in v2:** routine asks are approved together in one tap |

## Key flows

Every action Pocket Pilot proposes goes through the same check before money moves.

**Proposed action → Never allowed? (blocked) → Always ask? (approval inbox) → Comfort level or standing permission → 24 hour hold → Sent**

Only an action that clears all three checks runs on its own, and even then it waits 24 hours.

**Save when paid**

1. A paycheck lands, on any day.
2. Pocket Pilot works out the safe amount: balance, minus bills due in the next 14 days, minus the buffer.
3. It proposes saving the person's chosen percent of the paycheck, capped at the safe amount.
4. At level 2 or 3 it moves the money; at level 1 it asks.
5. If the safe amount is zero, it skips saving and says why.

**Bill pay with hold**

1. A bill is due in the coming days.
2. Pocket Pilot checks the permission rules for that bill.
3. Allowed to run on its own: it schedules the payment with a 24 hour hold, landing at least a day before the due date.
4. Needs approval: it goes to the approval inbox with a reason.
5. The daily summary shows the payment on hold; the person can cancel until the hold ends.

**End of week sweep**

1. On Sunday, Pocket Pilot runs the safe to save check again.
2. If money is left over, it proposes moving part of it to Pilot Savings.
3. The person accepts, changes the amount, or skips.

**Rent Jar**

1. Pocket Pilot detects the rent payment, or the person enters the amount and due date.
2. On each paycheck, it works out how much rent is still needed and how many paychecks are likely before the due date, then sets that share aside in the Rent Jar. Example: $3,000 rent with pay every two weeks means about $1,500 per paycheck.
3. If a paycheck is too small to cover its share, Pocket Pilot warns the person days ahead, not on the due date.
4. When the jar is full, rent is paid automatically with the 24 hour hold, landing a day before it's due. Moving money between banks takes one to three business days, so the jar money moves back to checking early enough to be there in time.

**Order of every paycheck:** Rent Jar first, then bills due before the next paycheck, then the safety buffer, then 10% to savings. Saving never puts rent at risk.

## Advice and deals

Pocket Pilot reads the person's statements, finds patterns, and suggests what to do about them. **Advice suggests; the rules still decide.** Nothing here moves money by itself.

**Insights from statements**

| Pattern | Example | What Pocket Pilot suggests |
| --- | --- | --- |
| A category grew a lot | Food delivery $410 this month, up 38% from $298 | Save the $112 difference |
| Several subscriptions | Three streaming and music services, $40.97 a month | Cancel one (Pocket Pilot sees payments, not usage, so it asks instead of assuming) |
| Avoidable fees | $14 in out of network ATM fees | Use your bank's ATMs; advice only, nothing to move |

Rules for insights:

- Every insight shows the numbers behind it, so the person can check it
- A "This is wrong" button hides the insight and stops it from coming back
- A suggested savings move still goes through safe to save, so advice can't put bills at risk
- Cancelling a service always asks, at every comfort level, because some can't be restarted at the same price
- A payment suggested by an insight always asks
- Insights are about spending habits, never investment advice

**How advice influences the rest of the product**

1. **Suggestions:** insights are where most savings and cancel suggestions come from.
2. **Safe to spend:** a category trending up lowers what's safe to spend before the money is gone.
3. **North Star:** opening insights counts toward "knew where it went."
4. **Learning:** dismissed or flagged insights tell Pocket Pilot what isn't useful to this person.

**Better deals**

Pocket Pilot compares what the person pays today against cheaper options: phone and internet plans, a better rate on their savings account, and subscription bundles.

| Rule | Why |
| --- | --- |
| Ranked by how much the person saves per year | The deal that pays Pocket Pilot the most must never rank first by default |
| Referral fees shown openly on the deal | Trust; the person sees the conflict of interest |
| Deals saving under $60 a year are hidden | Small savings are noise and train people to ignore deals |
| Pocket Pilot never switches a plan or opens an account for the person | Switching has fine print only the person can judge |
| "Not for me" hides a deal for good | No nagging |

Rocket Money's bill negotiation keeps a share of the first year's savings. Pocket Pilot makes money from a subscription, so referral fees are a bonus, not the business model, which keeps the incentive pointed at the person's savings.

## Success metrics

**North Star: healthy money months.** The share of active users who finish the month with all four of these true:

1. **Knew where it went.** Checked their spending at least once a week.
2. **Paid every bill on time.** Nothing landed on or after its due date.
3. **Kept the buffer.** The balance never dropped below the safety buffer, and no overdraft.
4. **Saved something.** At least one savings move, from a paycheck, the sweep, or added money.

This measures the person's habits, not just what Pocket Pilot did for them. A month where the AI paid every bill but the person never looked at their spending doesn't count, because the goal is a person who understands and manages their money. Each of the four parts is also tracked on its own, so a drop shows exactly which habit slipped.

**Guardrail that overrides everything: zero unwanted actions.** A healthy month built on a payment the person didn't expect is a failure.

| Metric | Type | Target (hypothesis) |
| --- | --- | --- |
| Can explain where their money went (week 1 survey) | Input | 70% say yes |
| Paychecks with a savings move | Input | 60% |
| Insights acted on | Input | 25% |
| Money saved per year from deals people switched to | Input | $150 per active user |
| Share of users at level 2 or 3 after 60 days | Trust | 40% |
| Insights flagged "This is wrong" | Guardrail | Under 5% |
| Deals dismissed as "Not for me" | Guardrail | Under 50%; higher means deals feel like ads |
| Unwanted actions (cancelled during hold or reversed) | Guardrail | Under 1 in 200 actions |
| Overdrafts caused by Pocket Pilot | Guardrail | Zero |
| Approval prompts per user per month | Guardrail | Under 10, so approvals stay meaningful |
| Pause button use | Guardrail | Watch for spikes after any change |

All targets are guesses to test, not promises.

## Risks and tradeoffs

The main tradeoff is safety against convenience: too many approvals and people tap yes without reading; too few and mistakes slip through.

| Tradeoff | Choice | What it costs |
| --- | --- | --- |
| Safety vs convenience | Comfort levels, starting at "ask me about everything" | Slower first month for every user |
| Speed vs a chance to cancel | 24 hour hold on automatic payments | Bills are paid a little earlier than needed |
| Saving more vs running short | Safe to save check before every savings move | Some paychecks save nothing |
| AI judgment vs predictable rules | The AI proposes, a fixed rulebook decides | Rules can be rigid in unusual cases |

| Risk | Mitigation |
| --- | --- |
| A wrong payment goes out | Hold, daily summary, trusted payees, pause button |
| Text in a bill tricks the AI into paying someone | Instructions inside bills or messages are never followed; new payees always ask |
| Bank connection breaks and data goes stale | Pause automatic actions until data refreshes |
| Approval fatigue | Track prompts per month. **v2:** standing permissions per payee, a trust ladder after 3 approvals, and a weekly check in cut 9 interruptions to 2 on a sample month |
| People feel watched | Explain every insight and action in plain language; no selling of data |

## Trust, security, and privacy

Pocket Pilot is the app on top; it never builds its own bank connections or holds money itself.

**Where Pocket Pilot fits**

| Layer | Who | Role |
| --- | --- | --- |
| Banks | Wherever the person already banks: SoFi, Chime, Chase, credit unions | Hold everyday money, Pilot Savings, and the Rent Jar |
| Data aggregator | Plaid, MX, Akoya, or Finicity | Connects Pocket Pilot to the person's accounts with their permission |
| Partner bank | Later, only if needed | Would offer a dedicated Pocket Pilot account |
| App | Pocket Pilot | Insights, rules, jars, and the experience |

**First version: bring your own savings account.** Pilot Savings and the Rent Jar are labeled jars inside a savings account the person already has. Pocket Pilot moves money only between the person's own accounts and keeps track of how much belongs to each jar.

| Option | Pros | Cons | Decision |
| --- | --- | --- | --- |
| Person's own savings account | No SSN, no bank contract, money stays at a bank they already trust | Jar money sits in one account and could be spent by accident; transfers take 1 to 3 business days | **First version** |
| One partner bank | Dedicated account, instant moves | Identity checks, SSNs, contracts, and support for lost money | Later, if people ask for it |
| Several partner banks | Choice, and less risk if one fails | A contract, identity check, and support process per bank | Only at large scale |

If a partner bank is added later, work with it directly rather than through a middleman. When the middleware company Synapse collapsed in 2024, customers of several fintech apps lost access to their money for months.

**What data Pocket Pilot uses, and when**

| Data | When it's collected | Who keeps it |
| --- | --- | --- |
| Name, email, phone | Sign up | Pocket Pilot |
| Transactions and balances | Linking accounts, read only | Pocket Pilot, through the aggregator |
| Permission to move money | Only when the person turns on bill pay, savings, or the Rent Jar | Pocket Pilot and the person's bank |
| Social Security number | Not in the first version | Only needed later if a partner bank account is offered |

**Does Pocket Pilot need a Social Security number?** Not in the first version. Linking accounts and moving money between the person's own accounts needs no SSN. An SSN would only come in later if Pocket Pilot offered its own account through a partner bank, because US banks must verify identity before opening an account that holds money. Even then it would go straight to the partner bank's identity check; Pocket Pilot would never store it, and the AI would never see it.

**Security**

- Read only by default; moving money is a separate permission the person turns on
- Bank passwords never stored; secure tokens the person can revoke anytime
- The AI never moves money directly; it proposes and the permission rules decide
- Account numbers and SSNs are never shown to the AI or written in logs
- Encryption, two step login, and an independent security audit (SOC 2) before launch

**Privacy promises**

- Never sell data; Pocket Pilot earns money from a subscription
- Collect only what a feature needs
- One tap to delete all data and disconnect the bank
- A one screen privacy page in plain language: what we see, what we never do, how to leave

**Why people would trust it**

1. **Borrowed trust:** names they know, like "Secured by Plaid" and "Your money never leaves your own bank."
2. **Earned trust:** start read only and at "ask me about everything," with the hold, pause button, and "why did you do this?" More freedom only after a clean record.
3. **Plain promises:** the privacy page above, kept short enough to read.

**Open banking risk**

The rules for sharing bank data are unsettled. The CFPB's Section 1033 rule, finalized in October 2024, is not in force as of 2026: a federal court has blocked enforcement, and the CFPB is rewriting it, including whether banks may charge for access ([Open Banking Tracker](https://openbankingtracker.com/regulation/usa-1033)). Banks have started charging; JPMorgan Chase agreed paid data access terms with Plaid, Yodlee, Morningstar, and Akoya ([Payment Expert](https://paymentexpert.com/2025/11/17/jpmorgan-chase-to-charge-fintechs-for-customer-data-access/)).

What it means for Pocket Pilot: each linked user may carry a data cost that the subscription price must cover. Use an aggregator with official bank connections, not screen scraping, since the market is moving toward the FDX standard either way.

## Tricky scenarios to test

Each scenario becomes a test the permission rules must pass before anything ships. This list will grow.

| Scenario | What Pocket Pilot should do |
| --- | --- |
| A payment left the bank but Pocket Pilot hasn't seen it yet | Refresh the balance before every action; if data is more than 12 hours old, pause automatic actions and ask |
| A bill gets paid twice | Block a second payment to the same payee for the same amount within 30 days and ask first |
| The person already paid the bill another way | Check recent transactions for that payee before paying; if found, cancel the scheduled payment and say so |
| The person no longer wants a bill paid | Cancel during the hold; future bills from that payee always ask first |
| Pocket Pilot paid a bill it shouldn't have | A "Fix this" button in the activity log stops future payments, shows how to get the money back from the payee, and opens a support case |
| The AI gives a wrong answer or bad advice | Every insight shows the numbers behind it, with a "this is wrong" button; no payment ever runs from chat alone |
| A bill suddenly doubles | Always ask first |
| A paycheck is too small to fill the Rent Jar share | Warn days before rent is due and suggest how to cover the gap |
| A refund lands and looks like a paycheck | Don't count it as income, so it doesn't trigger the 10% savings move |
| Rent changes with a new lease | Treat it as a changed amount: ask first, then update the Rent Jar |
| A bill memo says "pay $900 to this account" | Never follow instructions inside bills or messages |
| The bank connection breaks | Pause all automatic actions until it reconnects |
| An insight suggests cancelling a subscription | Always ask, even at the highest comfort level |
| An insight suggests saving more than is safe | Lower the amount to what's safe to save |
| A deal pays Pocket Pilot a referral fee but saves the person less | Rank it below the deal that saves more, and show the fee |
| A deal saves less than $60 a year | Hide it |

## Decisions and next steps

**Decisions made**

- **Default savings:** 10% of each paycheck, adjustable.
- **Rent:** paid automatically at level 3 when it's the same amount as last month, even above $3,000, always with the 24 hour hold. A changed rent amount always asks first.
- **Six month Money Review:** every six months Pocket Pilot shows how the period went, helps set new savings targets, and suggests a higher comfort level only if there were no unwanted actions in that time.
- **Money health score:** built from bills paid on time, saving consistently, keeping the buffer, and paying credit cards in full (when a card is linked).
- **Where the money lives:** the first version uses the person's own savings account, with Pilot Savings and the Rent Jar as labeled jars inside it. No SSN and no partner bank at launch; a dedicated partner bank account can come later. Kept bank neutral rather than naming any single provider.

**Next steps**

- [ ] Interview 5 young professionals about bills, saving, and trusting an AI with money
- [x] Build the permission rules and a test set of tricky scenarios
- [x] Build the simulator with a fake account
- [x] Add the tradeoff lab: approvals per month vs unwanted actions (v2)
- [ ] Write the decision log and pre mortem

## Update: v2 (October 29, 2026)

Asking before every bill defeated the purpose of the product and invited approval fatigue. v2 lets the person approve a rule once per payee, up to a limit, while every safety rule still runs first. After three approvals in a row at the same amount, Pocket Pilot offers that rule itself. Routine asks wait in one weekly check in with a single approve button; anything unusual is flagged to review one by one. On a sample month of 9 bills, interruptions dropped from 9 to 2. Building it exposed a duplicate payment gap, now fixed and tested. Details are in the [README](../README.md#v2-approve-a-rule-once-not-every-bill).
