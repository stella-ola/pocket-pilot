// Pocket Pilot: permission rules engine
// The AI proposes, the policy permits.
// Every action the coach suggests passes through decide() before any money moves.
// The same module runs in the simulator (docs/index.html) and the test runner (tests/run-tests.mjs).

export const DEFAULTS = {
  comfortLevel: 1,          // 1 Ask me about everything, 2 Save for me, 3 Handle the routine
  savePercent: 0.10,        // save when paid default
  autoPayLimit: 200,        // bills under this can run on their own at level 3
  bigPaymentLimit: 3000,    // above this always asks, except rent at the same amount
  bufferTarget: 500,        // safety buffer goal
  holdHours: 24,            // automatic payments wait this long before sending
  landBeforeDueDays: 1,     // payment must land at least this many days before the due date
  transferDays: 3,          // business days for money to move between banks
  staleDataHours: 12,       // older bank data pauses automatic actions
  duplicateWindowDays: 30,  // same payee and amount within this window is a possible duplicate
  changedAmountPct: 0.20,   // a bill this much higher than usual always asks
  billLookaheadDays: 14,    // safe to save reserves bills due in this window
};

// v2: reasons that are only about your comfort level. Asks made only for these reasons are routine,
// so the weekly check in can approve them together in one tap. Every other reason is reviewed one by one.
export const ROUTINE_ASKS = ['level_1', 'level_2_bills', 'level_3_not_routine'];

export const TRUST = {
  approvalsNeeded: 3,      // same payee, same amount, approved this many times in a row
  lookbackDays: 120,       // only recent approvals count
  headroomPct: 0.10,       // suggested limit leaves 10% room for small changes
};

export const LEVELS = {
  1: 'Ask me about everything',
  2: 'Save for me',
  3: 'Handle the routine',
};

export const OUTCOMES = {
  auto: 'Runs on its own after a 24 hour hold',
  auto_now: 'Runs on its own',
  ask: 'Waits in your approval inbox',
  skip: 'Skipped',
  block: 'Blocked',
};

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

/** The buffer is $500, or whatever the person has if they have less. Building it up is their first goal. */
export function effectiveBuffer(state, s = DEFAULTS) {
  return Math.max(0, Math.min(s.bufferTarget, state.bufferBase ?? s.bufferTarget));
}

/** Money that can be saved without putting bills or the buffer at risk. */
export function safeToSave(state, now, s = DEFAULTS) {
  const horizon = now + s.billLookaheadDays * DAY;
  const billsDue = (state.bills || [])
    .filter((b) => !b.paid && b.due <= horizon)
    .reduce((t, b) => t + b.amount, 0);
  return Math.max(0, Math.round((state.checking - billsDue - effectiveBuffer(state, s)) * 100) / 100);
}

/**
 * Decide what happens to one proposed action.
 * @param action { type: 'pay_bill' | 'save' | 'rent_jar' | 'sweep' | 'send_to_person' | 'invest',
 *                 payee?, amount, due?, isRent?, origin: 'pilot' | 'chat' | 'bill_text' }
 * @param state  { checking, bufferBase?, paused?, connected?, dataAgeHours?, payees: {name: {trusted, stopPaying, lastAmount}},
 *                 history: [{payee, amount, at, via}], bills, settings? }
 * @returns { outcome, reasons: [{code, text}], sendAt?, amount }
 */
export function decide(action, state, now, settings = {}) {
  const s = { ...DEFAULTS, ...(state.settings || {}), ...settings };
  const level = s.comfortLevel;
  const reasons = [];
  const why = (code, text) => reasons.push({ code, text });
  const result = (outcome, extra = {}) => ({ outcome, outcomeLabel: OUTCOMES[outcome], reasons, amount: action.amount, ...extra });
  const isPayment = action.type === 'pay_bill';
  const isSavingsMove = ['save', 'rent_jar', 'sweep'].includes(action.type);

  // 1. Never allowed, at any level
  if (action.origin === 'bill_text') {
    why('instruction_in_content', 'The request came from text inside a bill or message. Pocket Pilot never follows instructions found there.');
    return result('block');
  }
  if (action.type === 'invest' || action.type === 'send_to_person') {
    why('out_of_scope', action.type === 'invest' ? 'Pocket Pilot does not invest money.' : 'Pocket Pilot does not send money to other people.');
    return result('block');
  }

  // 2. Already handled: don't pay a bill that was paid another way
  if (isPayment) {
    const since = now - s.duplicateWindowDays * DAY;
    const paidElsewhere = (state.history || []).find((h) => h.payee === action.payee && h.at >= since && h.via !== 'pocket_pilot' && Math.abs(h.amount - action.amount) < 0.01);
    if (paidElsewhere) {
      why('already_paid', `You already paid ${action.payee} ${money(paidElsewhere.amount)} another way, so this payment was cancelled.`);
      return result('skip');
    }
  }

  // 3. Savings moves only use money that is safe to save
  if (isSavingsMove) {
    const safe = safeToSave(state, now, s);
    if (safe <= 0) {
      why('nothing_safe_to_save', 'After upcoming bills and your safety buffer, there is nothing safe to save right now.');
      return result('skip', { amount: 0 });
    }
    if (action.amount > safe) {
      why('capped_to_safe', `Lowered from ${money(action.amount)} to ${money(safe)} so upcoming bills and your buffer stay covered.`);
      action = { ...action, amount: safe };
    }
  }

  // 3b. Cancelling a service is never automatic: it can't always be undone
  if (action.type === 'cancel_subscription') {
    why('cancel_always_asks', `Cancelling ${action.payee} always needs your approval, because some services can't be restarted at the same price.`);
    return result('ask', { amount: action.amount });
  }

  // 4. Conditions that switch off everything automatic
  let mustAsk = false;
  if (state.paused) { why('paused', 'Automatic actions are paused.'); mustAsk = true; }
  if (state.connected === false) { why('bank_disconnected', 'Your bank connection is broken, so automatic actions are paused until it reconnects.'); mustAsk = true; }
  else if ((state.dataAgeHours ?? 0) > s.staleDataHours) { why('stale_data', `Your bank data is ${state.dataAgeHours} hours old. Pocket Pilot waits for fresh data before acting on its own.`); mustAsk = true; }
  if (action.origin === 'chat' && isPayment) { why('from_chat', 'Payments suggested in chat always need your approval.'); mustAsk = true; }
  if (action.origin === 'insight' && isPayment) { why('from_insight', 'Payments suggested by an insight always need your approval.'); mustAsk = true; }

  // 5. Always ask, at every level (payments)
  if (isPayment) {
    const payee = state.payees?.[action.payee];
    const since = now - s.duplicateWindowDays * DAY;
    const dup = (state.history || []).find((h) => h.payee === action.payee && h.via === 'pocket_pilot' && h.at >= since && Math.abs(h.amount - action.amount) < 0.01);
    if (dup) { why('possible_duplicate', `Pocket Pilot already paid ${action.payee} ${money(dup.amount)} in the last ${s.duplicateWindowDays} days. This might be a duplicate.`); mustAsk = true; }
    // v2: a payment that is still on hold or waiting for approval counts too, so one tap approvals can't pay a bill twice
    const waiting = !dup && (state.pending || []).find((p) => p.type === 'pay_bill' && p.payee === action.payee && Math.abs(p.amount - action.amount) < 0.01);
    if (waiting) { why('possible_duplicate', `A ${money(waiting.amount)} payment to ${action.payee} is already on hold or waiting for you. This might be a duplicate.`); mustAsk = true; }
    if (!payee || !payee.trusted) { why('new_payee', `${action.payee} is not on your trusted payees list yet.`); mustAsk = true; }
    if (payee?.stopPaying) { why('stop_paying', `You asked Pocket Pilot to stop paying ${action.payee} automatically.`); mustAsk = true; }
    const last = payee?.lastAmount;
    if (last && action.amount > last * (1 + s.changedAmountPct)) {
      why('amount_changed', `This bill is ${money(action.amount)}, up from ${money(last)} last time.`);
      mustAsk = true;
    }
    const sameAsLast = last && Math.abs(action.amount - last) < 0.01;
    if (action.isRent && last && !sameAsLast) {
      why('rent_changed', `Your rent changed from ${money(last)} to ${money(action.amount)}. Pocket Pilot asks before paying a new rent amount.`);
      mustAsk = true;
    }
    if (action.amount > s.bigPaymentLimit && !(action.isRent && sameAsLast)) {
      why('big_payment', `Payments over ${money(s.bigPaymentLimit)} always need your approval${action.isRent ? ' when the rent amount has changed' : ''}.`);
      mustAsk = true;
    }
  }

  // 6. Never dip below the buffer
  if (isPayment) {
    const after = state.checking - action.amount;
    if (after < effectiveBuffer(state, s)) {
      why('below_buffer', `Paying this would leave ${money(after)}, below your ${money(effectiveBuffer(state, s))} safety buffer.`);
      mustAsk = true;
    }
  }

  // 7. Standing permissions (v2): a rule you approved once for one payee, up to a limit.
  //    It replaces the comfort level for that payee only. Every check above still runs first.
  const standing = isPayment ? state.standing?.[action.payee] : null;
  if (!mustAsk && standing) {
    if (action.amount <= standing.maxAmount) {
      why('standing_ok', `You told Pocket Pilot to pay ${action.payee} automatically, up to ${money(standing.maxAmount)}.`);
    } else {
      why('over_standing_limit', `This is ${money(action.amount)}, above the ${money(standing.maxAmount)} you allowed for ${action.payee}.`);
      mustAsk = true;
    }
  }

  // 8. Comfort level
  if (!mustAsk && !standing) {
    if (level === 1) { why('level_1', 'Your comfort level is "Ask me about everything."'); mustAsk = true; }
    else if (level === 2 && isPayment) { why('level_2_bills', 'At "Save for me," bill payments need your approval.'); mustAsk = true; }
    else if (level === 3 && isPayment) {
      const payee = state.payees?.[action.payee];
      const recurringSame = payee?.lastAmount && Math.abs(action.amount - payee.lastAmount) < 0.01;
      const small = action.amount < s.autoPayLimit;
      if (!recurringSame && !small) { why('level_3_not_routine', `Not routine: it is ${money(action.amount)} and differs from last time.`); mustAsk = true; }
      else why('routine', recurringSame ? `Same payee and amount as last time (${money(action.amount)}).` : `Under your ${money(s.autoPayLimit)} automatic limit.`);
    }
  }

  if (mustAsk) return result('ask', { amount: action.amount });

  // 9. Savings moves run now (money stays in the person's own accounts)
  if (isSavingsMove) {
    why('savings_ok', 'Moving money between your own accounts, within what is safe to save.');
    return result('auto_now', { amount: action.amount });
  }

  // 10. Automatic payment: 24 hour hold, must land at least a day before the due date
  const sendAt = now + s.holdHours * HOUR;
  if (action.due && sendAt > action.due - s.landBeforeDueDays * DAY) {
    reasons.length = 0;
    why('no_time_for_hold', 'There is not enough time for the 24 hour hold before the due date, so Pocket Pilot is asking instead of acting.');
    return result('ask', { amount: action.amount });
  }
  why('hold', `Held for ${s.holdHours} hours. You can cancel it until it sends.`);
  return result('auto', { sendAt, amount: action.amount });
}

/**
 * A deposit arrives. Returns the proposals Pocket Pilot makes, in priority order:
 * Rent Jar first, then savings. Refunds and transfers are not income and never trigger saving.
 */
export function onDeposit(deposit, state, now, settings = {}) {
  const s = { ...DEFAULTS, ...(state.settings || {}), ...settings };
  const notes = [];
  if (deposit.kind !== 'paycheck') {
    notes.push({ code: 'not_income', text: `${money(deposit.amount)} looks like a ${deposit.kind}, not a paycheck, so it does not trigger saving.` });
    return { proposals: [], notes };
  }
  const proposals = [];
  const rent = state.rent;
  let rentShare = 0;
  if (rent) {
    const stillNeeded = Math.max(0, rent.amount - (state.jars?.rentJar || 0));
    const paychecksLeft = Math.max(1, rent.paychecksBeforeDue || 1);
    rentShare = Math.round((stillNeeded / paychecksLeft) * 100) / 100;
    if (rentShare > 0) {
      proposals.push({ type: 'rent_jar', amount: rentShare, origin: 'pilot' });
      if (rentShare > deposit.amount) notes.push({ code: 'rent_short', text: `This paycheck is ${money(deposit.amount)}, short of the ${money(rentShare)} rent share. Pocket Pilot will warn you before rent is due.` });
    }
  }
  const saveAmount = Math.round(deposit.amount * s.savePercent * 100) / 100;
  proposals.push({ type: 'save', amount: saveAmount, origin: 'pilot' });
  return { proposals, notes };
}

/** Money health score, 0 to 100, from the four habits behind the North Star. */
export function healthScore({ billsOnTimePct, savedThisMonth, bufferKept, cardsPaidInFull, checkedSpendingWeeks }) {
  const parts = {
    bills: Math.round((billsOnTimePct ?? 0) * 30),
    saving: savedThisMonth ? 25 : 0,
    buffer: bufferKept ? 20 : 0,
    cards: cardsPaidInFull === null || cardsPaidInFull === undefined ? 15 : cardsPaidInFull ? 15 : 0,
    awareness: Math.round(Math.min(4, checkedSpendingWeeks ?? 0) / 4 * 10),
  };
  return { score: Object.values(parts).reduce((a, b) => a + b, 0), parts };
}

// ---------------------------------------------------------------- v2: approve a rule once, not every bill

/** Grant a standing permission for one payee. The limit leaves a little room for small price changes. */
export function grantStanding(state, payee, amount, now, t = TRUST) {
  const maxAmount = Math.ceil(amount * (1 + t.headroomPct) * 100) / 100;
  return {
    ...state,
    payees: { ...state.payees, [payee]: { ...(state.payees?.[payee] || {}), trusted: true, lastAmount: amount } },
    standing: { ...(state.standing || {}), [payee]: { maxAmount, since: now } },
  };
}

/**
 * Trust ladder: after you approve the same bill a few times in a row, Pocket Pilot offers a standing permission.
 * Never offered for payments over the big payment limit, and never twice for a payee that already has one.
 * @returns [{ payee, amount, maxAmount, times, text }]
 */
export function suggestStanding(state, now, s = DEFAULTS, t = TRUST) {
  const since = now - t.lookbackDays * DAY;
  const byPayee = {};
  for (const h of state.history || []) {
    if (h.via !== 'pocket_pilot' || h.at < since) continue;
    (byPayee[h.payee] ||= []).push(h);
  }
  const out = [];
  for (const [payee, list] of Object.entries(byPayee)) {
    if (state.standing?.[payee] || state.payees?.[payee]?.stopPaying) continue;
    const recent = list.sort((a, b) => b.at - a.at).slice(0, t.approvalsNeeded);
    if (recent.length < t.approvalsNeeded) continue;
    if (!recent.every((h) => h.approved)) continue;
    const amount = recent[0].amount;
    if (!recent.every((h) => Math.abs(h.amount - amount) < 0.01)) continue;
    if (amount > s.bigPaymentLimit) continue;
    const maxAmount = Math.ceil(amount * (1 + t.headroomPct) * 100) / 100;
    out.push({ payee, amount, maxAmount, times: recent.length,
      text: `You approved ${payee} ${recent.length} times in a row at ${money(amount)}. Want Pocket Pilot to pay it automatically from now on, up to ${money(maxAmount)}? It will still ask if anything looks unusual.` });
  }
  return out;
}

/** Sort a list of pending asks for the weekly check in. */
export function splitAsks(asks) {
  const routine = [], reviewEach = [];
  for (const a of asks) {
    const codes = a.reasons.map((r) => r.code);
    (codes.length && codes.every((c) => ROUTINE_ASKS.includes(c)) ? routine : reviewEach).push(a);
  }
  return { routine, reviewEach };
}

/**
 * Weekly check in: run a batch of bills through decide() and summarise.
 * Returns what was handled for you, what can be approved together, and what needs a look one by one.
 */
export function weeklyCheckIn(actions, state, now, settings = {}) {
  // Decide one at a time, so each bill sees the ones before it as pending (catches duplicates inside the batch)
  const pending = [...(state.pending || [])];
  const decided = actions.map((a) => {
    const d = { action: a, ...decide({ ...a }, { ...state, pending }, now, settings) };
    if (d.outcome !== 'skip' && d.outcome !== 'block') pending.push(a);
    return d;
  });
  const handled = decided.filter((d) => d.outcome === 'auto' || d.outcome === 'auto_now');
  const skipped = decided.filter((d) => d.outcome === 'skip' || d.outcome === 'block');
  const { routine, reviewEach } = splitAsks(decided.filter((d) => d.outcome === 'ask'));
  // v1 asked one by one. v2 counts one tap for all routine asks, plus one per item that needs a real look.
  const promptsV2 = reviewEach.length + (routine.length ? 1 : 0);
  return { decided, handled, skipped, routine, reviewEach, promptsV2,
    summary: `${handled.length} handled for you, ${routine.length + reviewEach.length} need you` };
}

/** How many times would you be interrupted? v1 asks about every bill separately. */
export function countPrompts(actions, state, now, settings = {}) {
  const pending = [...(state.pending || [])];
  let asks = 0;
  for (const a of actions) {
    const d = decide({ ...a }, { ...state, pending }, now, settings);
    if (d.outcome === 'ask') asks++;
    if (d.outcome !== 'skip' && d.outcome !== 'block') pending.push(a);
  }
  return asks;
}
