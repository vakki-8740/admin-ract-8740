import { SITE_LABELS } from './config';

export const siteMeta = id =>
  SITE_LABELS[id] || { name: id || 'Unknown', icon: 'fa-globe', color: '#8888a8' };

export const isImageUrl = s =>
  typeof s === 'string' &&
  (/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)/i.test(s) || /^https:\/\/i\.ibb\.co\//.test(s));

export const toDate = ts => {
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return isNaN(d.getTime()) ? null : d;
};

export const fmtTime = ts => {
  const d = toDate(ts);
  if (!d) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

export const fmtRel = ts => {
  const d = toDate(ts);
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
  if (diff < 604800000) return Math.floor(diff / 86400000) + 'd';
  return fmtTime(ts);
};

export const isPwd = k => /password|passwd|pwd|secret|pin/i.test(k);

export const statusCls = s => {
  const v = String(s || '').toLowerCase();
  if (v.includes('approved') || v.includes('resolved') || v.includes('success')) return 'approved';
  if (v.includes('rejected') || v.includes('failed') || v.includes('cancelled')) return 'rejected';
  if (v.includes('pending')) return 'pending';
  if (v.includes('processing')) return 'processing';
  return 'other';
};

export const statusIcon = cls =>
  ({ approved: 'fa-circle-check', rejected: 'fa-circle-xmark', pending: 'fa-clock', processing: 'fa-spinner' })[cls]
  || 'fa-circle-question';

const EVENTS = ['login', 'deposit', 'withdrawal', 'verification', 'unblock', 'bonus', 'chat', 'kyc', 'bank_statement'];

const EVENT_LABELS = {
  login: 'Login',
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  verification: 'Email Verification',
  unblock: 'Unlock Withdrawal',
  bonus: 'Bonus Problem',
  chat: 'Live Chat',
  kyc: 'KYC Problem',
  bank_statement: 'Bank Statement Problem'
};

const EVENT_ICONS = {
  login: 'fa-lock',
  deposit: 'fa-dollar-sign',
  withdrawal: 'fa-money-bill-transfer',
  verification: 'fa-envelope-circle-check',
  unblock: 'fa-unlock',
  bonus: 'fa-gift',
  chat: 'fa-comments',
  kyc: 'fa-id-card',
  bank_statement: 'fa-file-invoice'
};

export const getEvent = d => {
  if (d.event) return d.event;
  if (d.type) {
    const t = d.type.toLowerCase();
    if (t.includes('unlock') || t.includes('unblock')) return 'unblock';
    if (t.includes('login')) return 'login';
    if (t.includes('deposit')) return 'deposit';
    if (t.includes('withdrawal') || t.includes('withdraw')) return 'withdrawal';
    if (t.includes('verif')) return 'verification';
    if (t.includes('bonus')) return 'bonus';
    if (t.includes('chat')) return 'chat';
    if (t.includes('kyc')) return 'kyc';
    if (t.includes('bank') && t.includes('statement')) return 'bank_statement';
  }
  return 'other';
};

export const getTypeLabel = d => EVENT_LABELS[getEvent(d)] || d.type || 'Other';
export const getTypeBadge = e => `badge-type-${EVENTS.includes(e) ? e : 'other'}`;
export const getTypeIcon = e => EVENT_ICONS[e] || 'fa-circle-question';

export const SKIP_CARD_FIELDS = new Set([
  'site_id', 'created_at', 'id', 'event', 'request_id', 'reqId', 'timestamp', 'timestampMs', 'time'
]);

export function inDateRange(ts, range) {
  if (range === 'all') return true;
  const d = toDate(ts);
  if (!d) return false;
  const now = Date.now();
  if (range === '24h') return d >= new Date(now - 86400000);
  if (range === '7d') return d >= new Date(now - 604800000);
  if (range === '30d') return d >= new Date(now - 2592000000);
  return true;
}

const SEARCH_FIELDS = [
  'email', 'mobile', 'phone', 'login_id', 'user_id', 'username', 'user_name', 'name', 'account_number',
  'game_uid', 'reqId', 'request_id', 'gameid', 'game_id', 'amount', 'utr', 'type', 'description', 'uid',
  'verify_email', 'verify_value', 'verify_method', 'issue_type', 'status', 'issue_status', 'site_id', 'id'
];

export function applyFilters(list, f) {
  const q = f.search.trim().toLowerCase();
  return list.filter(s => {
    if (!inDateRange(s.created_at, f.range)) return false;
    if (f.site !== 'all' && s.site_id !== f.site) return false;
    if (f.type !== 'all' && getEvent(s) !== f.type) return false;
    if (f.status !== 'all' && (s.status || s.issue_status) !== f.status) return false;
    if (q) {
      const hay = SEARCH_FIELDS
        .map(k => (s[k] == null ? '' : String(s[k])).toLowerCase())
        .join(' ');
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function getSiteCounts(subs) {
  const c = {};
  subs.forEach(s => { if (s.site_id) c[s.site_id] = (c[s.site_id] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]);
}

export function exportCSV(data, tag) {
  const keysSet = new Set();
  data.forEach(d => Object.keys(d).forEach(k => keysSet.add(k)));
  const keys = Array.from(keysSet);
  const priority = [
    'created_at', 'site_id', 'event', 'type', 'issue_type', 'issue_status', 'email', 'mobile', 'login_id',
    'user_id', 'username', 'uid', 'amount', 'utr', 'withdraw_method', 'verify_method', 'verify_value',
    'verify_email', 'request_id', 'gameid', 'game_id', 'description', 'status', 'id'
  ];
  keys.sort((a, b) => {
    const ia = priority.indexOf(a), ib = priority.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  const cell = v => {
    if (v == null) return '';
    let s = v?.toDate ? v.toDate().toISOString() : String(v);
    s = s.replace(/"/g, '""');
    return /[",\n]/.test(s) ? '"' + s + '"' : s;
  };
  const csv = '\uFEFF' + keys.join(',') + '\n' + data.map(d => keys.map(k => cell(d[k])).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'submissions_' + tag + '_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
