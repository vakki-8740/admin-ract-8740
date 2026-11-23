import { useMemo } from 'react';
import { useApp } from '../store';
import { SITE_LABELS } from '../config';
import { siteMeta, toDate, fmtRel, getTypeLabel } from '../utils';
import { SparkBars, MixRow } from './common';

export default function DashboardPage() {
  const { page, subs, loaded, initError, setFilter, navigate, openModal } = useApp();

  const kpi = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    let today = 0, week = 0;
    subs.forEach(s => {
      const d = toDate(s.created_at);
      if (!d) return;
      if (d >= startOfDay) today++;
      if (d >= startOfWeek) week++;
    });
    return { total: subs.length, today, week };
  }, [subs]);

  const siteCards = useMemo(() => {
    const counts = {};
    subs.forEach(s => { if (s.site_id) counts[s.site_id] = (counts[s.site_id] || 0) + 1; });
    Object.keys(SITE_LABELS).forEach(sid => { if (!counts[sid]) counts[sid] = 0; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const todayBy = {};
    subs.forEach(s => {
      const d = toDate(s.created_at);
      if (s.site_id && d && d >= startToday) todayBy[s.site_id] = (todayBy[s.site_id] || 0) + 1;
    });
    const max = sorted[0]?.[1] || 1;
    return sorted.map(([sid, n]) => ({
      sid, n,
      meta: siteMeta(sid),
      today: todayBy[sid] || 0,
      pct: Math.round((n / max) * 100)
    }));
  }, [subs]);

  const recent = subs.slice(0, 5);

  return (
    <div className={'page' + (page === 'dashboard' ? ' active' : '')} id="page-dashboard">
      <div className="page-pad">
        <div className="top-stats">
          <div className="stat-card stat-total">
            <div className="stat-icon"><i className="fa-solid fa-layer-group"></i></div>
            <div className="stat-info">
              <div className="stat-value" id="kpiTotal">{loaded ? kpi.total : '--'}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
          <div className="stat-card stat-today">
            <div className="stat-icon"><i className="fa-solid fa-bolt"></i></div>
            <div className="stat-info">
              <div className="stat-value" id="kpiToday">{loaded ? kpi.today : '--'}</div>
              <div className="stat-label">Today</div>
            </div>
          </div>
          <div className="stat-card stat-week">
            <div className="stat-icon"><i className="fa-solid fa-calendar-week"></i></div>
            <div className="stat-info">
              <div className="stat-value" id="kpiWeek">{loaded ? kpi.week : '--'}</div>
              <div className="stat-label">Week</div>
            </div>
          </div>
        </div>

        <div className="section-head">
          <h2>Sites</h2>
          <span className="section-badge" id="siteCount">0</span>
        </div>
        <div className="site-cards" id="siteCards">
          {siteCards.length === 0 && <div className="empty-state">No sites</div>}
          {siteCards.map(c => (
            <div
              key={c.sid}
              className="site-card"
              style={{ '--site-color': c.meta.color }}
              onClick={() => {
                setFilter(f => ({ ...f, site: c.sid }));
                navigate('submissions');
              }}
            >
              <div className="site-card-top">
                <div className="site-card-icon" style={{ background: c.meta.color + '15', color: c.meta.color }}>
                  <i className={`fa-solid ${c.meta.icon}`}></i>
                </div>
                <div className="site-card-today">{c.today} today</div>
              </div>
              <div className="site-card-name">{c.meta.name}</div>
              <div className="site-card-count">{c.n}</div>
              <div className="site-card-label">users</div>
              <div className="site-card-bar">
                <div className="site-card-bar-fill" style={{ width: c.pct + '%', background: c.meta.color }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="section-head">
          <h2>Activity</h2>
          <span className="section-badge">7 days</span>
        </div>
        <div className="dash-card">
          <SparkBars subs={subs} />
          <MixRow subs={subs} />
        </div>

        <div className="section-head">
          <h2>Recent</h2>
          <button className="link-btn" id="viewAllBtn" onClick={() => navigate('submissions')}>
            View All <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
        <div id="recentList" className="recent-list">
          {initError && <ErrorState message={initError} />}
          {!initError && recent.length === 0 && <div className="empty-state">No submissions yet</div>}
          {!initError && recent.map(s => {
            const site = siteMeta(s.site_id);
            const keyField = s.email || s.mobile || s.utr || s.amount || s.gameid || '—';
            return (
              <div key={s.id} className="recent-item" onClick={() => openModal(s)}>
                <div className="recent-icon" style={{ background: site.color + '18', color: site.color }}>
                  <i className={`fa-solid ${site.icon}`}></i>
                </div>
                <div className="recent-info">
                  <div className="recent-title">{keyField}</div>
                  <div className="recent-sub">{site.name} · {getTypeLabel(s)}</div>
                </div>
                <div className="recent-time">{fmtRel(s.created_at)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="error-state">
      <div className="empty-icon"><i className="fa-solid fa-triangle-exclamation"></i></div>
      <div className="empty-text">Connection failed</div>
      <div className="empty-sub">{message}</div>
    </div>
  );
}
