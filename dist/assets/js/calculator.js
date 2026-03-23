/**
 * tipright.app — Core Calculator Module
 * Zero dependencies. Pure ES6. Works offline.
 */

// ─── Config ────────────────────────────────────────────────
const TIERS = [
  { pct: 10, label: "Minimum",   note: "Basic service" },
  { pct: 15, label: "Decent",    note: "Good service"  },
  { pct: 20, label: "Standard",  note: "Most common", highlight: true },
  { pct: 22, label: "Good",      note: "Above average" },
  { pct: 25, label: "Excellent", note: "Outstanding"  },
];

// ─── Parse ─────────────────────────────────────────────────
function parseCost(raw) {
  if (!raw) return 0;
  const cleaned = String(raw).replace(/[$,\s]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) || val < 0 ? 0 : Math.min(val, 99999);
}

// ─── Calculate ─────────────────────────────────────────────
function calcTips(cost, split = 1, tax = 0, tiers = TIERS) {
  const n   = Math.max(1, Math.min(20, parseInt(split) || 1));
  const txn = Math.max(0, parseFloat(tax) || 0);
  return tiers.map(tier => {
    const tip            = cost * (tier.pct / 100);
    const total          = cost + tip;
    const grandTotal     = cost + txn + tip;
    const totalPerPerson = grandTotal / n;
    const tipPerPerson   = tip / n;
    return {
      pct:            tier.pct,
      label:          tier.label,
      note:           tier.note,
      highlight:      !!tier.highlight,
      tip:            round2(tip),
      total:          round2(total),
      grandTotal:     round2(grandTotal),
      totalPerPerson: round2(totalPerPerson),
      tipPerPerson:   round2(tipPerPerson),
    };
  });
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// ─── Format ────────────────────────────────────────────────
function fmt(n) {
  const hasDecimals = n % 1 !== 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);
}

// ─── URL State ─────────────────────────────────────────────
let _urlTimer = null;

function readURL() {
  const p = new URLSearchParams(window.location.search);
  return {
    cost:     parseFloat(p.get('c')) || '',
    split:    parseInt(p.get('s'))  || 1,
    sessions: parseInt(p.get('n'))  || 1,
    tax:      parseFloat(p.get('t')) || 0,
  };
}

function writeURL(state) {
  clearTimeout(_urlTimer);
  _urlTimer = setTimeout(() => {
    const p = new URLSearchParams();
    if (state.cost)         p.set('c', state.cost);
    if (state.split > 1)    p.set('s', state.split);
    if (state.sessions > 1) p.set('n', state.sessions);
    if (state.tax > 0)      p.set('t', state.tax);
    const qs = p.toString() ? '?' + p.toString() : '';
    history.replaceState(null, '', window.location.pathname + qs);
  }, 300);
}

// ─── Share ─────────────────────────────────────────────────
function shareResult(btnEl) {
  const url = window.location.href;
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Tip Calculator', url });
        return;
      } catch(e) { /* fallthrough */ }
    }
    await navigator.clipboard.writeText(url);
    showToast(btnEl, 'Link copied!');
  };
  share().catch(() => showToast(btnEl, 'Copy the URL above'));
}

function showToast(el, msg) {
  const orig = el.textContent;
  el.textContent = msg;
  el.classList.add('text-brand-dark');
  setTimeout(() => { el.textContent = orig; el.classList.remove('text-brand-dark'); }, 2000);
}

// ─── Render Results ────────────────────────────────────────
function renderResults(results, split, container) {
  container.innerHTML = '';
  const showSplit = split > 1;

  results.forEach(r => {
    const card = document.createElement('div');
    card.className = [
      'flex flex-col items-center justify-center rounded-xl transition-all overflow-hidden min-w-0',
      r.highlight
        ? 'border-2 border-brand bg-brand-light ring-1 ring-brand p-4 scale-[1.03]'
        : 'border border-gray-200 bg-white hover:border-brand/40 p-3',
    ].join(' ');

    const label = document.createElement('span');
    if (r.highlight) {
      label.textContent = '★ Standard';
      label.className = 'text-xs font-bold text-brand uppercase tracking-wide mb-1';
    } else {
      label.textContent = r.pct + '%';
      label.className = 'text-xs font-medium text-gray-400 mb-1';
    }

    const amount = document.createElement('span');
    amount.className = (r.highlight ? 'font-bold text-brand-dark' : 'font-bold text-gray-800') + ' whitespace-nowrap';
    const tipStr = fmt(r.tip);
    const baseSize = r.highlight ? 36 : 28;
    const fontSize = tipStr.length > 5 ? Math.max(baseSize - (tipStr.length - 5) * 3, 18) : baseSize;
    amount.style.fontSize = fontSize + 'px';
    amount.style.lineHeight = '1.1';
    amount.textContent = tipStr;

    const total = document.createElement('span');
    total.className = 'text-xs mt-1 ' + (r.highlight ? 'text-brand-dark opacity-70' : 'text-gray-400');
    total.textContent = 'Total: ' + fmt(r.grandTotal !== r.total ? r.grandTotal : r.total);

    card.appendChild(label);
    card.appendChild(amount);
    card.appendChild(total);

    if (showSplit) {
      const totalPP = document.createElement('span');
      totalPP.className = 'text-sm font-bold mt-2 ' + (r.highlight ? 'text-brand-dark' : 'text-gray-700');
      totalPP.style.fontSize = '16px';
      totalPP.textContent = fmt(r.totalPerPerson) + ' / person';

      const tipPP = document.createElement('span');
      tipPP.className = 'text-xs mt-0.5 ' + (r.highlight ? 'text-brand opacity-80' : 'text-gray-400');
      tipPP.textContent = fmt(r.tipPerPerson) + ' tip each';

      card.appendChild(totalPP);
      card.appendChild(tipPP);
    }

    container.appendChild(card);
  });
}

// ─── Export ────────────────────────────────────────────────
window.TR = {
  parseCost, calcTips, fmt, readURL, writeURL, shareResult, renderResults,
  parseTax: function(v) {
    const n = parseFloat(String(v).replace(/[$,\s]/g, ''));
    return isNaN(n) || n < 0 ? 0 : n;
  }
};
