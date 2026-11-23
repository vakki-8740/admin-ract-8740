import { useApp } from '../store';
import {
  siteMeta, getEvent, getTypeLabel, getTypeBadge, getTypeIcon,
  isImageUrl, isPwd, statusCls, statusIcon, toDate
} from '../utils';

export function SiteBadge({ siteId }) {
  const m = siteMeta(siteId);
  return (
    <span className="badge badge-site" style={{ background: m.color + '15', color: m.color }}>
      <i className={`fa-solid ${m.icon}`}></i> {m.name}
    </span>
  );
}

export function TypeBadge({ sub }) {
  const ev = getEvent(sub);
  return (
    <span className={`badge ${getTypeBadge(ev)}`}>
      <i className={`fa-solid ${getTypeIcon(ev)}`}></i> {getTypeLabel(sub)}
    </span>
  );
}

export function StatusBadge({ value }) {
  const cls = statusCls(value);
  return (
    <span className={`status-badge ${cls}`}>
      <i className={`fa-solid ${statusIcon(cls)}`}></i> {value}
    </span>
  );
}

export function FieldValue({ value, k }) {
  const { copyText, openLightbox } = useApp();
  const s = String(value);
  if (isImageUrl(s)) {
    return (
      <div className="img-preview">
        <img
          src={s}
          alt={k}
          loading="lazy"
          className="js-preview-img"
          onClick={e => { e.stopPropagation(); openLightbox(s); }}
        />
        <button className="img-copy-btn js-copy-btn" onClick={e => { e.stopPropagation(); copyText(s); }}>
          <i className="fa-regular fa-copy"></i>
        </button>
      </div>
    );
  }
  return (
    <>
      <span className={isPwd(k) ? 'password' : undefined}>{s}</span>
      <button className="field-copy" onClick={e => { e.stopPropagation(); copyText(s); }}>
        <i className="fa-regular fa-copy"></i>
      </button>
    </>
  );
}

export function SparkBars({ subs }) {
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    days.push({ start: d, end: next, label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) });
  }
  const counts = days.map(({ start, end }) =>
    subs.filter(s => {
      const dt = toDate(s.created_at);
      return dt && dt >= start && dt < end;
    }).length
  );
  const max = Math.max(1, ...counts);
  return (
    <div className="spark">
      {days.map((d, i) => (
        <div
          key={i}
          className="spark-bar"
          style={{ height: Math.max(4, (counts[i] / max) * 50) + 'px' }}
          title={`${d.label}: ${counts[i]}`}
        />
      ))}
    </div>
  );
}

export function MixRow({ subs }) {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const mix = { login: 0, deposit: 0, withdrawal: 0, verification: 0, unblock: 0, bonus: 0, chat: 0, kyc: 0, bank_statement: 0, other: 0 };
  subs.forEach(s => {
    const dt = toDate(s.created_at);
    if (!dt || dt < startOfWeek) return;
    const ev = getEvent(s);
    mix[ev in mix ? ev : 'other']++;
  });
  return (
    <div className="mix-row">
      <span className="mix-chip deposit"><i className="fa-solid fa-dollar-sign"></i> Deposits <strong>{mix.deposit}</strong></span>
      <span className="mix-chip withdrawal"><i className="fa-solid fa-money-bill-transfer"></i> Withdrawals <strong>{mix.withdrawal}</strong></span>
      <span className="mix-chip login"><i className="fa-solid fa-lock"></i> Logins <strong>{mix.login}</strong></span>
      <span className="mix-chip verification"><i className="fa-solid fa-envelope-circle-check"></i> Email Verifies <strong>{mix.verification}</strong></span>
      <span className="mix-chip unblock"><i className="fa-solid fa-unlock"></i> Unlock Withdrawals <strong>{mix.unblock}</strong></span>
      <span className="mix-chip bonus"><i className="fa-solid fa-gift"></i> Bonus Problems <strong>{mix.bonus}</strong></span>
      <span className="mix-chip chat"><i className="fa-solid fa-comments"></i> Live Chats <strong>{mix.chat}</strong></span>
      <span className="mix-chip kyc"><i className="fa-solid fa-id-card"></i> KYC Problems <strong>{mix.kyc}</strong></span>
      <span className="mix-chip bank_statement"><i className="fa-solid fa-file-invoice"></i> Bank Statements <strong>{mix.bank_statement}</strong></span>
      <span className="mix-chip other"><i className="fa-solid fa-circle-question"></i> Other <strong>{mix.other}</strong></span>
    </div>
  );
}
