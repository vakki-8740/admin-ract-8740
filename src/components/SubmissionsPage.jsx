import { useMemo, useRef } from 'react';
import { useApp } from '../store';
import { siteMeta, getSiteCounts, fmtRel, SKIP_CARD_FIELDS } from '../utils';
import { SiteBadge, TypeBadge, StatusBadge, FieldValue } from './common';
import { ErrorState } from './DashboardPage';

const TYPE_PILLS = [
  { type: 'login', icon: 'fa-lock', label: 'Login' },
  { type: 'deposit', icon: 'fa-dollar-sign', label: 'Deposit' },
  { type: 'withdrawal', icon: 'fa-money-bill-transfer', label: 'Withdraw' },
  { type: 'verification', icon: 'fa-envelope-circle-check', label: 'Email Verify' },
  { type: 'unblock', icon: 'fa-unlock', label: 'Unlock Withdrawal' },
  { type: 'bonus', icon: 'fa-gift', label: 'Bonus Problem' },
  { type: 'chat', icon: 'fa-comments', label: 'Live Chat' },
  { type: 'kyc', icon: 'fa-id-card', label: 'KYC Problem' },
  { type: 'bank_statement', icon: 'fa-file-invoice', label: 'Bank Statement' }
];

const STATUS_PILLS = ['Pending', 'Processing', 'Rejected', 'Failed', 'Success but not received'];

export default function SubmissionsPage() {
  const {
    page, subs, filter, setFilter, filtered, selected, toggleSelect,
    openModal, askBulkDelete, initError
  } = useApp();
  const searchRef = useRef(null);

  const siteEntries = useMemo(() => getSiteCounts(subs), [subs]);

  const anyFilter = filter.search || filter.site !== 'all' || filter.type !== 'all' ||
    filter.status !== 'all' || filter.range !== 'all';

  const setRange = range => setFilter(f => ({ ...f, range }));
  const setType = type => setFilter(f => ({ ...f, type }));
  const setStatus = status => setFilter(f => ({ ...f, status }));
  const setSite = site => setFilter(f => ({ ...f, site }));

  return (
    <div className={'page' + (page === 'submissions' ? ' active' : '')} id="page-submissions">
      <div className="page-pad">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            id="searchInput"
            ref={searchRef}
            type="text"
            placeholder="Search..."
            autoComplete="off"
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          />
          <button
            className="search-clear"
            id="searchClear"
            hidden={!filter.search}
            onClick={() => {
              setFilter(f => ({ ...f, search: '' }));
              searchRef.current?.focus();
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="pills-scroll" id="datePills">
          {[['all', 'All'], ['24h', '24h'], ['7d', '7d'], ['30d', '30d']].map(([r, l]) => (
            <button key={r} className={'pill' + (filter.range === r ? ' active' : '')} onClick={() => setRange(r)}>{l}</button>
          ))}
        </div>

        <div className="pills-scroll" id="typePills">
          <button className={'pill' + (filter.type === 'all' ? ' active' : '')} onClick={() => setType('all')}>All</button>
          {TYPE_PILLS.map(t => (
            <button key={t.type} className={'pill' + (filter.type === t.type ? ' active' : '')} onClick={() => setType(t.type)}>
              <i className={`fa-solid ${t.icon}`}></i> {t.label}
            </button>
          ))}
        </div>

        <div className="pills-scroll" id="statusPills">
          <button className={'pill' + (filter.status === 'all' ? ' active' : '')} onClick={() => setStatus('all')}>All</button>
          {STATUS_PILLS.map(s => (
            <button key={s} className={'pill' + (filter.status === s ? ' active' : '')} onClick={() => setStatus(s)}>
              {s === 'Success but not received' ? 'Success not received' : s}
            </button>
          ))}
        </div>

        <div className="pills-scroll" id="sitePills">
          <button className={'pill' + (filter.site === 'all' ? ' active' : '')} onClick={() => setSite('all')}>
            All ({subs.length})
          </button>
          {siteEntries.map(([sid, n]) => {
            const meta = siteMeta(sid);
            return (
              <button key={sid} className={'pill' + (filter.site === sid ? ' active' : '')} onClick={() => setSite(sid)}>
                <i className={`fa-solid ${meta.icon}`}></i> {meta.name} ({n})
              </button>
            );
          })}
        </div>

        <div className="list-info">
          <span className="list-count" id="listCount">
            {filtered.length} submission{filtered.length === 1 ? '' : 's'}
          </span>
          <button className="btn-negative btn-xs" id="bulkDeleteBtn" hidden={selected.size === 0} onClick={askBulkDelete}>
            <i className="fa-solid fa-trash"></i> Delete
          </button>
        </div>

        <div className="list" id="list">
          {initError && <ErrorState message={initError} />}
          {!initError && filtered.length === 0 && (
            <div className="empty">
              <div className="empty-icon">
                <i className={`fa-solid ${anyFilter ? 'fa-magnifying-glass' : 'fa-inbox'}`}></i>
              </div>
              <div className="empty-text">{anyFilter ? 'No matches' : 'No submissions'}</div>
              <div className="empty-sub">{anyFilter ? 'Clear filters' : 'Data appears here in real-time'}</div>
            </div>
          )}
          {!initError && filtered.map(s => (
            <SubmissionCard
              key={s.id}
              sub={s}
              isSelected={selected.has(s.id)}
              onToggle={() => toggleSelect(s.id)}
              onOpen={() => openModal(s)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SubmissionCard({ sub, isSelected, onToggle, onOpen }) {
  const fields = Object.keys(sub).filter(k => {
    if (SKIP_CARD_FIELDS.has(k)) return false;
    const v = sub[k];
    return !(v === null || v === undefined || v === '' || v === 'N/A');
  });

  return (
    <div className={'card' + (isSelected ? ' selected' : '')}>
      <div className="card-check">
        <label className="check-wrap" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            className="card-check-input"
            checked={isSelected}
            onChange={onToggle}
          />
          <span className="check-box"></span>
        </label>
      </div>
      <div className="card-body" onClick={onOpen}>
        <div className="card-head">
          <SiteBadge siteId={sub.site_id} />
          <TypeBadge sub={sub} />
          <span className="card-time">{fmtRel(sub.created_at)}</span>
        </div>
        <div className="card-fields">
          {fields.map(k => (
            <div key={k} className="field">
              <div className="field-label">{k.replace(/_/g, ' ')}</div>
              <div className="field-value">
                {(k === 'status' || k === 'issue_status')
                  ? <StatusBadge value={sub[k]} />
                  : <FieldValue value={sub[k]} k={k} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
