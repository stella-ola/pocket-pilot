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
    },
    history: [],
    bills: [],
    rent: { amount: 1800, paychecksBeforeDue: 2 },
    ...over,
  };
}

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
];
