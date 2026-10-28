// Pocket Pilot: insights from statements, and better deals.
// Advice suggests; the rules still decide. Nothing in this file moves money.
// An insight can carry a suggested action, which goes through decide() in rules.js like any other.

const DAY = 24 * 60 * 60 * 1000;

// A fictional month of Maya's statement. Categories are what a data aggregator would return.
export const SAMPLE_STATEMENT = {
  thisMonth: [
    ...Array.from({ length: 14 }, (_, i) => ({ merchant: ['QuickBite', 'Noodle Run', 'QuickBite', 'Taco Dash'][i % 4], amount: [24.5, 31.2, 28.9, 33.6][i % 4], category: 'Food delivery' })),
    { merchant: 'FreshMart', amount: 96.4, category: 'Groceries' },
    { merchant: 'FreshMart', amount: 81.15, category: 'Groceries' },
    { merchant: 'StreamBox', amount: 15.99, category: 'Subscriptions' },
    { merchant: 'ReelHouse', amount: 13.99, category: 'Subscriptions' },
    { merchant: 'TuneCloud', amount: 10.99, category: 'Subscriptions' },
    { merchant: 'Bright Mobile', amount: 65, category: 'Phone' },
    ...Array.from({ length: 4 }, () => ({ merchant: 'Out of network ATM', amount: 3.5, category: 'Fees' })),
  ],
  lastMonthByCategory: { 'Food delivery': 298, Groceries: 205, Subscriptions: 40.97, Phone: 65, Fees: 0 },
  savingsRate: 0.005, // what her current savings account pays per year (example)
};

export function byCategory(txns) {
  const out = {};
  for (const t of txns) out[t.category] = Math.round(((out[t.category] || 0) + t.amount) * 100) / 100;
  return out;
}

const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

/**
 * Read a statement and return insights. Each one shows its numbers and may suggest an action.
 * Suggested actions carry origin 'insight' so the rules know where they came from.
 */
export function analyzeStatement(st) {
  const now = byCategory(st.thisMonth);
  const prev = st.lastMonthByCategory;
  const insights = [];

  // 1. A category grew a lot
  for (const [cat, amt] of Object.entries(now)) {
    const before = prev[cat] || 0;
    if (before > 0 && amt > before * 1.25 && amt - before >= 50) {
      const count = st.thisMonth.filter((t) => t.category === cat).length;
      const extra = Math.round(amt - before);
      insights.push({
        id: 'spend_up_' + cat, kind: 'spending',
        title: `${cat} is up ${Math.round((amt / before - 1) * 100)}%`,
        detail: `${money(amt)} across ${count} orders this month, up from ${money(before)} last month.`,
        numbers: [`This month: ${money(amt)}`, `Last month: ${money(before)}`, `Difference: ${money(extra)}`],
        suggest: { label: `Save the ${money(extra)} difference`, action: { type: 'save', amount: extra, origin: 'insight' } },
      });
    }
  }

  // 2. Several subscriptions in one category. Bank data shows payments, not usage, so ask instead of assuming.
  const subs = st.thisMonth.filter((t) => t.category === 'Subscriptions');
  if (subs.length >= 3) {
    const total = subs.reduce((a, t) => a + t.amount, 0);
    const smallest = [...subs].sort((a, b) => a.amount - b.amount)[0];
    insights.push({
      id: 'subs_many', kind: 'subscriptions',
      title: `${subs.length} subscriptions, ${money(Math.round(total * 100) / 100)} a month`,
      detail: `${subs.map((s) => s.merchant).join(', ')}. Pocket Pilot can see what you pay, not what you use. Still using all of them?`,
      numbers: subs.map((s) => `${s.merchant}: ${money(s.amount)}`),
      suggest: { label: `Cancel ${smallest.merchant}`, action: { type: 'cancel_subscription', payee: smallest.merchant, amount: smallest.amount, origin: 'insight' } },
    });
  }

  // 3. Avoidable fees
  const fees = st.thisMonth.filter((t) => t.category === 'Fees');
  if (fees.length) {
    const total = fees.reduce((a, t) => a + t.amount, 0);
    insights.push({
      id: 'fees', kind: 'fees',
      title: `${money(total)} in ATM fees`,
      detail: `${fees.length} withdrawals at out of network ATMs. Using your bank's ATMs would save about ${money(total * 12)} a year.`,
      numbers: [`${fees.length} withdrawals × ${money(fees[0].amount)}`],
      suggest: null, // advice only; nothing to move
    });
  }
  return insights;
}

// Fictional deals. paysPocketPilot is a referral fee; it must never change the ranking.
export const DEAL_CATALOG = [
  { id: 'coastline', category: 'Phone', name: 'Coastline Mobile, Basic plan', monthly: 35, paysPocketPilot: 0, note: 'Unlimited talk and text, 10 GB data' },
  { id: 'zing', category: 'Phone', name: 'Zing Wireless, Plus plan', monthly: 55, paysPocketPilot: 40, note: 'Unlimited talk and text, 20 GB data' },
  { id: 'harborview', category: 'Savings account', name: 'Harborview Bank savings', rate: 0.04, paysPocketPilot: 25, note: 'Example rate, FDIC insured, no minimum' },
  { id: 'stream_bundle', category: 'Subscriptions', name: 'StreamBox + TuneCloud bundle', monthly: 24.99, replaces: ['StreamBox', 'TuneCloud'], paysPocketPilot: 0, note: 'Same two services, one bill' },
];

export const DEAL_RULES = { minYearlySavings: 60 };

/**
 * Find deals that save Maya real money, ranked by what she saves per year.
 * Referral fees are shown openly and never affect order. Small savings are hidden as noise.
 */
export function findDeals(st, catalog = DEAL_CATALOG, savingsBalance = 0) {
  const now = byCategory(st.thisMonth);
  const deals = [];
  for (const d of catalog) {
    let yearly = 0, compare = '';
    if (d.category === 'Phone' && now.Phone) {
      yearly = (now.Phone - d.monthly) * 12;
      compare = `${money(d.monthly)}/month vs your ${money(now.Phone)}`;
    } else if (d.category === 'Savings account') {
      yearly = savingsBalance * (d.rate - st.savingsRate);
      compare = `${(d.rate * 100).toFixed(1)}% vs your ${(st.savingsRate * 100).toFixed(1)}% on ${money(savingsBalance)}`;
    } else if (d.category === 'Subscriptions' && d.replaces) {
      const current = st.thisMonth.filter((t) => d.replaces.includes(t.merchant)).reduce((a, t) => a + t.amount, 0);
      if (current) { yearly = (current - d.monthly) * 12; compare = `${money(d.monthly)}/month vs ${money(Math.round(current * 100) / 100)} for both`; }
    }
    yearly = Math.round(yearly);
    deals.push({ ...d, yearlySavings: yearly, compare, shown: yearly >= DEAL_RULES.minYearlySavings, disclosure: d.paysPocketPilot ? 'Pocket Pilot gets a referral fee if you switch. It does not change the order.' : null });
  }
  return deals.filter((d) => d.shown).sort((a, b) => b.yearlySavings - a.yearlySavings);
}
