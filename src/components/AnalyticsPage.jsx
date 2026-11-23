import { useMemo } from 'react';
import { useApp } from '../store';
import { siteMeta, getSiteCounts } from '../utils';
import { SparkBars, MixRow } from './common';

export default function AnalyticsPage() {
  const { page, subs } = useApp();

  const siteEntries = useMemo(() => getSiteCounts(subs), [subs]);

  const topFields = useMemo(() => {
    const counts = {};
    subs.forEach(s => {
      Object.keys(s).forEach(k => {
        if (!['site_id', 'created_at', 'id', 'event'].includes(k)) counts[k] = (counts[k] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [subs]);

  const max = siteEntries.length ? siteEntries[0][1] : 1;

  return (
    <div className={'page' + (page === 'analytics' ? ' active' : '')} id="page-analytics">
      <div className="page-pad">
        <div className="section-head"><h2>By Site</h2></div>
        <div className="dash-card">
          <div className="site-bars" id="analyticsSiteBars">
            {siteEntries.length === 0 && <div className="empty-state">No data</div>}
            {siteEntries.map(([sid, n]) => {
              const meta = siteMeta(sid);
              return (
                <div key={sid} className="site-row">
                  <div className="site-name">
                    <i className={`fa-solid ${meta.icon}`} style={{ color: meta.color }}></i> {meta.name}
                  </div>
                  <div className="site-count">{n}</div>
                  <div className="site-bar-bg">
                    <div className="site-bar-fill" style={{ width: Math.round((n / max) * 100) + '%', background: meta.color }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="section-head"><h2>Activity</h2></div>
        <div className="dash-card"><SparkBars subs={subs} /></div>

        <div className="section-head"><h2>Event Mix</h2></div>
        <div className="dash-card"><MixRow subs={subs} /></div>

        <div className="section-head"><h2>Top Fields</h2></div>
        <div className="dash-card">
          <div id="topFields" className="top-fields">
            {topFields.length === 0 && <div className="empty-state">No data</div>}
            {topFields.map(([k, n]) => (
              <div key={k} className="top-field">
                <span className="top-field-name">{k.replace(/_/g, ' ')}</span>
                <span className="top-field-count">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
