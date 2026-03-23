/**
 * tipright.app — Core Calculator Module
 * Zero dependencies. Pure ES6. Works offline.
 */

// ─── Config ────────────────────────────────────────────────
const TIERS = [
  { pct: 10, label: "Low",       note: "Basic service"  },
  { pct: 15, label: "Okay",      note: "Decent service" },
  { pct: 18, label: "Good",      note: "Good service"   },
  { pct: 20, label: "Standard",  note: "Most common",   highlight: true },
  { pct: 25, label: "Excellent", note: "Outstanding"    },
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
      label.textContent = '\u2605 Standard';
      label.className = 'text-xs font-bold text-brand uppercase tracking-wide mb-1';
    } else {
      label.textContent = r.pct + '%';
      label.className = 'text-xs font-medium text-gray-400 mb-1';
    }

    // Default: show rounded-up tip (ceil). If already whole, same value.
    const tipCeiled = Math.ceil(r.tip);
    const hasDecimals = r.tip !== tipCeiled;
    const displayTip = tipCeiled;
    const exactTotal = r.grandTotal !== r.total ? r.grandTotal : r.total;
    const diff = tipCeiled - r.tip;
    const displayTotal = hasDecimals ? round2(exactTotal + diff) : exactTotal;

    const amount = document.createElement('span');
    amount.className = (r.highlight ? 'font-bold text-brand-dark' : 'font-bold text-gray-800') + ' whitespace-nowrap';
    const tipStr = fmt(displayTip);
    const baseSize = r.highlight ? 32 : 26;
    const fontSize = tipStr.length > 4 ? Math.max(baseSize - (tipStr.length - 4) * 3, 16) : baseSize;
    amount.style.fontSize = fontSize + 'px';
    amount.style.lineHeight = '1.1';
    amount.textContent = tipStr;

    const total = document.createElement('span');
    total.className = 'text-xs mt-1 ' + (r.highlight ? 'text-brand-dark opacity-70' : 'text-gray-400');
    total.textContent = 'Total: ' + fmt(displayTotal);

    card.appendChild(label);
    card.appendChild(amount);
    card.appendChild(total);

    let totalPPEl = null;
    let tipPPEl = null;

    if (showSplit) {
      const n = Math.max(1, split);
      const ppTotal = hasDecimals ? round2(r.totalPerPerson + diff / n) : r.totalPerPerson;
      const ppTip = round2(tipCeiled / n);

      totalPPEl = document.createElement('span');
      totalPPEl.className = 'text-sm font-bold mt-2 ' + (r.highlight ? 'text-brand-dark' : 'text-gray-700');
      totalPPEl.style.fontSize = '16px';
      totalPPEl.textContent = fmt(ppTotal) + ' / person';

      tipPPEl = document.createElement('span');
      tipPPEl.className = 'text-xs mt-0.5 ' + (r.highlight ? 'text-brand opacity-80' : 'text-gray-400');
      tipPPEl.textContent = fmt(ppTip) + ' tip each';

      card.appendChild(totalPPEl);
      card.appendChild(tipPPEl);
    }

    // "See exact" toggle button — only when tip was rounded
    if (hasDecimals) {
      const exactBtn = document.createElement('button');
      exactBtn.className = [
        'mt-2 px-2.5 py-1 rounded-full text-xs font-semibold transition-all',
        r.highlight
          ? 'bg-brand/20 text-brand-dark hover:bg-brand/30'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
      ].join(' ');
      exactBtn.style.cssText = 'font-size:11px;line-height:1.4;';
      exactBtn.textContent = 'Exact: ' + fmt(r.tip);
      exactBtn.title = 'See exact tip amount';

      let showingExact = false;

      exactBtn.addEventListener('click', function() {
        showingExact = !showingExact;

        if (showingExact) {
          amount.textContent = fmt(r.tip);
          total.textContent = 'Total: ' + fmt(exactTotal);
          exactBtn.textContent = '\u2191 ' + fmt(tipCeiled);
          exactBtn.title = 'Round up to ' + fmt(tipCeiled);

          if (showSplit) {
            const n = Math.max(1, split);
            if (totalPPEl) totalPPEl.textContent = fmt(r.totalPerPerson) + ' / person';
            if (tipPPEl) tipPPEl.textContent = fmt(r.tipPerPerson) + ' tip each';
          }
        } else {
          amount.textContent = fmt(tipCeiled);
          total.textContent = 'Total: ' + fmt(displayTotal);
          exactBtn.textContent = 'Exact: ' + fmt(r.tip);
          exactBtn.title = 'See exact tip amount';

          if (showSplit) {
            const n = Math.max(1, split);
            if (totalPPEl) totalPPEl.textContent = fmt(round2(r.totalPerPerson + diff / n)) + ' / person';
            if (tipPPEl) tipPPEl.textContent = fmt(round2(tipCeiled / n)) + ' tip each';
          }
        }
      });

      card.appendChild(exactBtn);
    }

    container.appendChild(card);
  });
}

// ─── Export ────────────────────────────────────────────────
window.TR = {
  parseCost, calcTips, fmt, round2, readURL, writeURL, shareResult, renderResults,
  parseTax: function(v) {
    const n = parseFloat(String(v).replace(/[$,\s]/g, ''));
    return isNaN(n) || n < 0 ? 0 : n;
  }
};
