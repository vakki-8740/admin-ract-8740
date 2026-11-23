import { useApp } from '../store';
import { PAGE_TITLES } from '../config';

export function Topbar() {
  const { page, conn, soundOn, soundTouched, toggleSound, theme, toggleTheme } = useApp();
  const dotClass = 'conn-dot' +
    (conn === 'connected' ? ' connected' : '') +
    (conn === 'error' ? ' error' : '') +
    (conn === 'cached' ? ' cached' : '');

  let soundIcon = 'fa-solid fa-bell-slash';
  if (soundTouched) soundIcon = soundOn ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="conn-mini"><span className={dotClass} id="connDot"></span></div>
        <div className="topbar-title" id="topbarTitle">{PAGE_TITLES[page] || page}</div>
      </div>
      <div className="topbar-right">
        <button
          className="topbar-btn"
          title="Theme"
          onClick={toggleTheme}
        >
          <i className={theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-cloud-moon'}></i>
        </button>
        <button className="topbar-btn" id="soundBtn" onClick={() => toggleSound(!soundOn)}>
          <i id="soundIcon" className={soundIcon}></i>
        </button>
      </div>
    </header>
  );
}

const TABS = [
  { page: 'dashboard', icon: 'fa-border-all', label: 'Home' },
  { page: 'submissions', icon: 'fa-inbox', label: 'Inbox' },
  { page: 'analytics', icon: 'fa-chart-bar', label: 'Stats' },
  { page: 'settings', icon: 'fa-gear', label: 'Settings' }
];

export function BottomNav() {
  const { page, navigate } = useApp();
  return (
    <nav className="bottom-nav">
      {TABS.map(t => (
        <button
          key={t.page}
          data-page={t.page}
          className={'nav-tab' + (page === t.page ? ' active' : '')}
          onClick={() => navigate(t.page)}
        >
          <i className={`fa-solid ${t.icon}`}></i>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
