// Tricky scenarios: every one must pass before anything ships.
// All data is fictional. Times are relative to NOW so the tests never go stale.
// Tags: prd (from the PRD tricky scenarios table), level (comfort levels), safety, money, rent

export const NOW = Date.UTC(2026, 9, 17, 17, 0); // Oct 17, 2026, 10am Pacific
const DAY = 24 * 60 * 60 * 1000;
const H = 60 * 60 * 1000;

// A fictional young professional: paid irregularly, rent $1,800, a few routine bills.
export function baseState(over = {}) {
  return {
    checking: 4200,
    jars: { rentJar: 0, savings: 300 },
    connected: true,
    dataAgeHours: 1,
    paused: false,
    settings: { comfortLevel: 3 },
    payees: {
      'Harbor Apartments': { trusted: true, lastAmount: 1800 },
      'Bright Mobile': { trusted: true, lastAmount: 65 },
      'City Power': { trusted: true, lastAmount: 92.4 },
      'StreamBox': { trusted: true, lastAmount: 15.99 },
      'Campus Loans': { trusted: true, lastAmount: 310 },
      'Clear Water': { trusted: true, lastAmount: 38 },
      'Shield Auto': { trusted: true, lastAmount: 128 },
      'NetSpeed Internet': { trusted: true, lastAmount: 70 },
    },
    history: [],
    bills: [],
    rent: { amount: 1800, paychecksBeforeDue: 2 },
    ...over,
  };
}

// v2 helpers
export function withStanding(state, limits) {
  const standing = {};
  for (const [payee, maxAmount] of Object.entries(limits)) standing[payee] = { maxAmount, since: NOW - 40 * DAY };
  return { ...state, standing };
}
const approvedPast = (payee, amounts) => amounts.map((amount, i) => ({ payee, amount, at: NOW - (31 + 30 * i) * DAY, via: 'pocket_pilot', approved: true }));

// One month of Maya's bills: 7 routine, 1 new payee, 1 bill that more than doubled.
export const SAMPLE_MONTH = [
  { type: 'pay_bill', payee: 'Harbor Apartments', amount: 1800, isRent: true, due: NOW + 6 * DAY, origin: 'pilot' },
  { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'pilot' },
  { type: 'pay_bill', payee: 'City Power', amount: 92.4, due: NOW + 8 * DAY, origin: 'pilot' },
  { type: 'pay_bill', payee: 'StreamBox', amount: 15.99, due: NOW + 4 * DAY, origin: 'pilot' },
  { type: 'pay_bill', payee: 'Campus Loans', amount: 310, due: NOW + 10 * DAY, origin: 'pilot' },
  { type: 'pay_bill', payee: 'Shield Auto', amount: 128, due: NOW + 12 * DAY, origin: 'pilot' },
  { type: 'pay_bill', payee: 'NetSpeed Internet', amount: 70, due: NOW + 11 * DAY, origin: 'pilot' },
  { type: 'pay_bill', payee: 'FitLife Gym', amount: 45, due: NOW + 7 * DAY, origin: 'pilot' },
  { type: 'pay_bill', payee: 'Clear Water', amount: 84, due: NOW + 9 * DAY, origin: 'pilot' },
];
// The 7 routine payees, each allowed 10% above the usual amount (rent at exactly the usual amount).
export const MAYA_STANDING = { 'Harbor Apartments': 1800, 'Bright Mobile': 72, 'City Power': 102, 'StreamBox': 17.6, 'Campus Loans': 341, 'Shield Auto': 141, 'NetSpeed Internet': 77 };

export const SCENARIOS = [
  // ---------------------------------------------------------------- From the PRD table
  {
    id: 'T1', tags: ['prd'], title: 'A payment left the bank but Pocket Pilot has old data',
    state: baseState({ dataAgeHours: 20 }),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'stale_data' },
  },
  {
    id: 'T2', tags: ['prd'], title: 'A bill would get paid twice',
    state: baseState({ history: [{ payee: 'City Power', amount: 92.4, at: NOW - 3 * DAY, via: 'pocket_pilot' }] }),
    action: { type: 'pay_bill', payee: 'City Power', amount: 92.4, due: NOW + 6 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'possible_duplicate' },
  },
  {
    id: 'T3', tags: ['prd'], title: 'The person already paid the bill another way',
    state: baseState({ history: [{ payee: 'Bright Mobile', amount: 65, at: NOW - 1 * DAY, via: 'bank_app' }] }),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'pilot' },
    expect: { outcome: 'skip', reason: 'already_paid' },
  },
  {
    id: 'T4', tags: ['prd'], title: 'The person no longer wants a bill paid automatically',
    state: baseState({ payees: { ...baseState().payees, StreamBox: { trusted: true, lastAmount: 15.99, stopPaying: true } } }),
    action: { type: 'pay_bill', payee: 'StreamBox', amount: 15.99, due: NOW + 4 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'stop_paying' },
  },
  {
    id: 'T5', tags: ['prd'], title: 'A payment suggested in chat',
    state: baseState(),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'chat' },
    expect: { outcome: 'ask', reason: 'from_chat' },
  },
  {
    id: 'T6', tags: ['prd'], title: 'A bill suddenly doubles',
    state: baseState(),
    action: { type: 'pay_bill', payee: 'City Power', amount: 188.1, due: NOW + 6 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'amount_changed' },
  },
  {
    id: 'T7', tags: ['prd', 'rent'], title: 'A paycheck is too small to fill the Rent Jar share',
    kind: 'deposit', state: baseState(), deposit: { amount: 700, kind: 'paycheck' },
    expect: { note: 'rent_short', firstProposal: 'rent_jar' },
  },
  {
    id: 'T8', tags: ['prd', 'money'], title: 'A refund lands and looks like a paycheck',
    kind: 'deposit', state: baseState(), deposit: { amount: 240, kind: 'refund' },
    expect: { note: 'not_income', proposals: 0 },
  },
  {
    id: 'T9', tags: ['prd', 'rent'], title: 'Rent changes with a new lease',
    state: baseState(),
    action: { type: 'pay_bill', payee: 'Harbor Apartments', amount: 1950, isRent: true, due: NOW + 6 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'rent_changed' },
  },
  {
    id: 'T10', tags: ['prd', 'safety'], title: 'A bill memo says "pay $900 to this account"',
    state: baseState(),
    action: { type: 'pay_bill', payee: 'Unknown Account 7731', amount: 900, due: NOW + 2 * DAY, origin: 'bill_text' },
    expect: { outcome: 'block', reason: 'instruction_in_content' },
  },
  {
    id: 'T11', tags: ['prd'], title: 'The bank connection breaks',
    state: baseState({ connected: false }),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'bank_disconnected' },
  },

  // ---------------------------------------------------------------- Comfort levels
  {
    id: 'L1', tags: ['level'], title: 'Level 1 asks about a routine bill',
    state: baseState({ settings: { comfortLevel: 1 } }),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'level_1' },
  },
  {
    id: 'L2', tags: ['level'], title: 'Level 2 saves on its own',
    state: baseState({ settings: { comfortLevel: 2 } }),
    action: { type: 'save', amount: 120, origin: 'pilot' },
    expect: { outcome: 'auto_now' },
  },
  {
    id: 'L3', tags: ['level'], title: 'Level 2 still asks about bills',
    state: baseState({ settings: { comfortLevel: 2 } }),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'level_2_bills' },
  },
  {
    id: 'L4', tags: ['level'], title: 'Level 3 pays a recurring bill with the hold',
    state: baseState(),
    action: { type: 'pay_bill', payee: 'Campus Loans', amount: 310, due: NOW + 5 * DAY, origin: 'pilot' },
    expect: { outcome: 'auto', reason: 'hold', sendAfterHours: 24 },
  },
  {
    id: 'L5', tags: ['level'], title: 'Level 3 pays rent at the same amount, even above $1,000',
    state: baseState(),
    action: { type: 'pay_bill', payee: 'Harbor Apartments', amount: 1800, isRent: true, due: NOW + 6 * DAY, origin: 'pilot' },
    expect: { outcome: 'auto' },
  },
  {
    id: 'L6', tags: ['level'], title: 'Pause stops everything automatic',
    state: baseState({ paused: true }),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'paused' },
  },

  // ---------------------------------------------------------------- Always ask
  {
    id: 'A1', tags: ['safety'], title: 'New payee',
    state: baseState(),
    action: { type: 'pay_bill', payee: 'FitLife Gym', amount: 45, due: NOW + 6 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'new_payee' },
  },
  {
    id: 'A2', tags: ['safety'], title: 'Over $3,000 and not rent',
    state: baseState({ checking: 9000, payees: { ...baseState().payees, 'Coast Auto Repair': { trusted: true, lastAmount: 3400 } } }),
    action: { type: 'pay_bill', payee: 'Coast Auto Repair', amount: 3400, due: NOW + 6 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'big_payment' },
  },
  {
    id: 'A3', tags: ['safety', 'rent'], title: 'Rent over $3,000 at the same amount runs on its own',
    state: baseState({ checking: 9000, payees: { ...baseState().payees, 'Harbor Apartments': { trusted: true, lastAmount: 3200 } } }),
    action: { type: 'pay_bill', payee: 'Harbor Apartments', amount: 3200, isRent: true, due: NOW + 6 * DAY, origin: 'pilot' },
    expect: { outcome: 'auto' },
  },
  {
    id: 'A4', tags: ['money'], title: 'A payment would drop below the $500 buffer',
    state: baseState({ checking: 520 }),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'below_buffer' },
  },
  {
    id: 'A5', tags: ['money'], title: 'Someone with less than $500 gets a smaller buffer, not a blocked account',
    state: baseState({ checking: 380, bufferBase: 250 }),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'pilot' },
    expect: { outcome: 'auto' },
  },

  // ---------------------------------------------------------------- Hold timing
  {
    id: 'H1', tags: ['safety'], title: 'Not enough time for the 24 hour hold',
    state: baseState(),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 36 * H, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'no_time_for_hold' },
  },

  // ---------------------------------------------------------------- Saving
  {
    id: 'M1', tags: ['money'], title: 'Save when paid uses 10% of the paycheck',
    kind: 'deposit', state: baseState({ rent: null }), deposit: { amount: 2100, kind: 'paycheck' },
    expect: { proposals: 1, saveAmount: 210 },
  },
  {
    id: 'M2', tags: ['money'], title: 'Saving is capped so bills and the buffer stay covered',
    state: baseState({ checking: 900, bills: [{ payee: 'Campus Loans', amount: 310, due: NOW + 5 * DAY }] }),
    action: { type: 'save', amount: 210, origin: 'pilot' },
    expect: { outcome: 'auto_now', reason: 'capped_to_safe', amount: 90 },
  },
  {
    id: 'M3', tags: ['money'], title: 'Nothing safe to save',
    state: baseState({ checking: 700, bills: [{ payee: 'Campus Loans', amount: 310, due: NOW + 5 * DAY }] }),
    action: { type: 'save', amount: 150, origin: 'pilot' },
    expect: { outcome: 'skip', reason: 'nothing_safe_to_save' },
  },
  {
    id: 'M4', tags: ['rent'], title: 'Rent Jar comes before savings',
    kind: 'deposit', state: baseState(), deposit: { amount: 2100, kind: 'paycheck' },
    expect: { firstProposal: 'rent_jar', rentShare: 900 },
  },

  // ---------------------------------------------------------------- Never allowed
  {
    id: 'N1', tags: ['safety'], title: 'Asked to invest',
    state: baseState(),
    action: { type: 'invest', amount: 500, origin: 'chat' },
    expect: { outcome: 'block', reason: 'out_of_scope' },
  },
  {
    id: 'N2', tags: ['safety'], title: 'Asked to send money to a friend',
    state: baseState(),
    action: { type: 'send_to_person', payee: 'Jordan', amount: 60, origin: 'chat' },
    expect: { outcome: 'block', reason: 'out_of_scope' },
  },

  // ---------------------------------------------------------------- Advice from statements
  {
    id: 'I1', tags: ['advice', 'safety'], title: 'An insight suggests cancelling a subscription, even at level 3',
    state: baseState(),
    action: { type: 'cancel_subscription', payee: 'TuneCloud', amount: 10.99, origin: 'insight' },
    expect: { outcome: 'ask', reason: 'cancel_always_asks' },
  },
  {
    id: 'I2', tags: ['advice', 'money'], title: 'An insight suggests saving more than is safe',
    state: baseState({ checking: 900, bills: [{ payee: 'Campus Loans', amount: 310, due: NOW + 5 * DAY }] }),
    action: { type: 'save', amount: 112, origin: 'insight' },
    expect: { outcome: 'auto_now', reason: 'capped_to_safe', amount: 90 },
  },
  {
    id: 'I3', tags: ['advice', 'safety'], title: 'An insight suggests paying a bill',
    state: baseState(),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'insight' },
    expect: { outcome: 'ask', reason: 'from_insight' },
  },
  {
    id: 'I4', tags: ['advice'], title: 'Insights show the numbers behind every claim',
    kind: 'insights',
    expect: { everyInsightHasNumbers: true, minInsights: 3 },
  },

  // ---------------------------------------------------------------- Better deals
  {
    id: 'D1', tags: ['deals', 'safety'], title: 'A deal that pays Pocket Pilot ranks below a better deal that pays nothing',
    kind: 'deals', savingsBalance: 300,
    expect: { firstDeal: 'coastline', paidDealDisclosed: 'zing' },
  },
  {
    id: 'D2', tags: ['deals'], title: 'A deal saving less than $60 a year is hidden',
    kind: 'deals', savingsBalance: 300,
    expect: { hidden: ['stream_bundle', 'harborview'] },
  },
  {
    id: 'D3', tags: ['deals'], title: 'A better savings rate only shows when the balance makes it worth it',
    kind: 'deals', savingsBalance: 3000,
    expect: { shown: ['harborview'] },
  },
  // ---------------------------------------------------------------- v2: standing permissions
  {
    id: 'S1', tags: ['v2'], title: 'A standing permission pays a routine bill, even at "Ask me about everything"',
    state: withStanding(baseState({ settings: { comfortLevel: 1 } }), { 'Bright Mobile': 72 }),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'pilot' },
    expect: { outcome: 'auto', reason: 'standing_ok', sendAfterHours: 24 },
  },
  {
    id: 'S2', tags: ['v2', 'safety'], title: 'A bill above the standing limit asks',
    state: withStanding(baseState({ settings: { comfortLevel: 1 } }), { 'Campus Loans': 341 }),
    action: { type: 'pay_bill', payee: 'Campus Loans', amount: 355, due: NOW + 10 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'over_standing_limit' },
  },
  {
    id: 'S3', tags: ['v2', 'safety'], title: 'A generous limit still asks when the bill jumps',
    state: withStanding(baseState(), { 'City Power': 500 }),
    action: { type: 'pay_bill', payee: 'City Power', amount: 188.1, due: NOW + 6 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'amount_changed' },
  },
  {
    id: 'S4', tags: ['v2', 'safety'], title: 'Standing permission waits when bank data is old',
    state: withStanding(baseState({ dataAgeHours: 20 }), { 'Bright Mobile': 72 }),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'stale_data' },
  },
  {
    id: 'S5', tags: ['v2', 'safety'], title: 'Standing permission never breaks the safety buffer',
    state: withStanding(baseState({ checking: 520 }), { 'Campus Loans': 341 }),
    action: { type: 'pay_bill', payee: 'Campus Loans', amount: 310, due: NOW + 10 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'below_buffer' },
  },
  {
    id: 'S6', tags: ['v2', 'safety'], title: 'Instructions inside a bill are still blocked',
    state: withStanding(baseState(), { 'Bright Mobile': 72 }),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'bill_text' },
    expect: { outcome: 'block', reason: 'instruction_in_content' },
  },
  {
    id: 'S7', tags: ['v2', 'safety'], title: 'A payment suggested in chat still asks',
    state: withStanding(baseState(), { 'Bright Mobile': 72 }),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'chat' },
    expect: { outcome: 'ask', reason: 'from_chat' },
  },
  {
    id: 'S8', tags: ['v2', 'safety'], title: 'Stop paying beats a standing permission',
    state: withStanding(baseState({ payees: { ...baseState().payees, StreamBox: { trusted: true, lastAmount: 15.99, stopPaying: true } } }), { StreamBox: 17.6 }),
    action: { type: 'pay_bill', payee: 'StreamBox', amount: 15.99, due: NOW + 4 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'stop_paying' },
  },
  {
    id: 'S9', tags: ['v2', 'safety'], title: 'A possible duplicate still asks',
    state: withStanding(baseState({ history: [{ payee: 'City Power', amount: 92.4, at: NOW - 3 * DAY, via: 'pocket_pilot' }] }), { 'City Power': 102 }),
    action: { type: 'pay_bill', payee: 'City Power', amount: 92.4, due: NOW + 6 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'possible_duplicate' },
  },
  {
    id: 'S10', tags: ['v2', 'safety'], title: 'A standing permission cannot sneak in a payee that is not trusted',
    state: withStanding(baseState(), { 'Account 7731': 1000 }),
    action: { type: 'pay_bill', payee: 'Account 7731', amount: 900, due: NOW + 5 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'new_payee' },
  },
  {
    id: 'S11', tags: ['v2', 'safety'], title: 'Cancelling a subscription still always asks',
    state: withStanding(baseState(), { StreamBox: 17.6 }),
    action: { type: 'cancel_subscription', payee: 'StreamBox', amount: 15.99, origin: 'insight' },
    expect: { outcome: 'ask', reason: 'cancel_always_asks' },
  },
  {
    id: 'S12', tags: ['v2', 'safety'], title: 'No time for the 24 hour hold still asks',
    state: withStanding(baseState(), { 'Bright Mobile': 72 }),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 30 * H, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'no_time_for_hold' },
  },
  {
    id: 'S13', tags: ['v2', 'safety'], title: 'The same bill twice, while the first is still on hold, asks',
    state: withStanding(baseState({ pending: [{ type: 'pay_bill', payee: 'Bright Mobile', amount: 65 }] }), { 'Bright Mobile': 72 }),
    action: { type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'pilot' },
    expect: { outcome: 'ask', reason: 'possible_duplicate' },
  },

  // ---------------------------------------------------------------- v2: trust ladder
  {
    id: 'R1', tags: ['v2'], title: 'Three approvals in a row at the same amount earns an offer',
    kind: 'trust', state: baseState({ history: approvedPast('Bright Mobile', [65, 65, 65]) }),
    expect: { suggests: ['Bright Mobile'], maxAmount: 71.5 },
  },
  {
    id: 'R2', tags: ['v2'], title: 'Two approvals is not enough',
    kind: 'trust', state: baseState({ history: approvedPast('Bright Mobile', [65, 65]) }),
    expect: { suggests: [] },
  },
  {
    id: 'R3', tags: ['v2'], title: 'A bill that changes every month is not offered',
    kind: 'trust', state: baseState({ history: approvedPast('City Power', [92.4, 110.2, 88.75]) }),
    expect: { suggests: [] },
  },
  {
    id: 'R4', tags: ['v2', 'safety'], title: 'Never offered for payments over $3,000',
    kind: 'trust', state: baseState({ history: approvedPast('Harbor Apartments', [3200, 3200, 3200]) }),
    expect: { suggests: [] },
  },
  {
    id: 'R5', tags: ['v2'], title: 'Not offered again once a payee has a standing permission',
    kind: 'trust', state: withStanding(baseState({ history: approvedPast('Bright Mobile', [65, 65, 65]) }), { 'Bright Mobile': 72 }),
    expect: { suggests: [] },
  },
  {
    id: 'R6', tags: ['v2'], title: 'Payments that ran on their own do not count as approvals',
    kind: 'trust', state: baseState({ history: approvedPast('Bright Mobile', [65, 65, 65]).map((h, i) => (i === 0 ? { ...h, approved: false } : h)) }),
    expect: { suggests: [] },
  },

  // ---------------------------------------------------------------- v2: weekly check in and approval load
  {
    id: 'C1', tags: ['v2'], title: 'Same month of bills: v1 asks 9 times, v2 asks twice',
    kind: 'checkin', state: withStanding(baseState({ settings: { comfortLevel: 1 } }), MAYA_STANDING),
    v1State: baseState({ settings: { comfortLevel: 1 } }),
    expect: { promptsV1: 9, promptsV2: 2, handled: 7, reviewEach: ['FitLife Gym', 'Clear Water'] },
  },
  {
    id: 'C2', tags: ['v2'], title: 'With no standing permissions yet, the check in still turns 9 asks into 3 taps',
    kind: 'checkin', state: baseState({ settings: { comfortLevel: 1 } }),
    v1State: baseState({ settings: { comfortLevel: 1 } }),
    expect: { promptsV1: 9, promptsV2: 3, handled: 0, routine: 7, reviewEach: ['FitLife Gym', 'Clear Water'] },
  },
  {
    id: 'C4', tags: ['v2', 'safety'], title: 'A bill that arrives twice in the same batch is never paid twice',
    kind: 'checkin', state: withStanding(baseState({ settings: { comfortLevel: 1 } }), MAYA_STANDING),
    v1State: baseState({ settings: { comfortLevel: 1 } }),
    extra: [{ type: 'pay_bill', payee: 'Bright Mobile', amount: 65, due: NOW + 5 * DAY, origin: 'pilot' }],
    expect: { promptsV1: 10, promptsV2: 3, handled: 7, reviewEach: ['FitLife Gym', 'Clear Water', 'Bright Mobile'] },
  },
  {
    id: 'C3', tags: ['v2', 'safety'], title: 'When bank data is old, nothing can be approved in one tap',
    kind: 'checkin', state: withStanding(baseState({ dataAgeHours: 20, settings: { comfortLevel: 1 } }), MAYA_STANDING),
    v1State: baseState({ dataAgeHours: 20, settings: { comfortLevel: 1 } }),
    expect: { promptsV1: 9, promptsV2: 9, handled: 0, routine: 0 },
  },
];
