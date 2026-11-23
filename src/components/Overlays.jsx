import { useApp } from '../store';
import { isImageUrl, isPwd } from '../utils';
import { SiteBadge, TypeBadge, StatusBadge } from './common';

const MODAL_SKIP = new Set(['site_id', 'event']);

function ModalFields({ sub }) {
  const { copyText, openLightbox } = useApp();
  const rows = [];
  Object.keys(sub).forEach(k => {
    if (MODAL_SKIP.has(k)) return;
    const v = sub[k];
    if (v === null || v === undefined || v === '' || v === 'N/A') return;

    const display = (k === 'created_at' && v?.toDate) ? v.toDate().toLocaleString() : v;
    let valueNode;
    if (k === 'status' || k === 'issue_status') {
      valueNode = <div className="modal-field-value"><StatusBadge value={v} /></div>;
    } else if (k !== 'created_at' && isImageUrl(String(v))) {
      const url = String(v);
      valueNode = (
        <div className="modal-img-wrap">
          <img
            src={url} alt={k} loading="lazy" className="js-preview-img"
            onClick={() => openLightbox(url)}
          />
          <button className="img-copy-btn js-copy-btn" onClick={() => copyText(url)}>
            <i className="fa-regular fa-copy"></i>
          </button>
        </div>
      );
    } else {
      valueNode = (
        <div className={'modal-field-value' + (isPwd(k) ? ' password' : '')}>{String(display)}</div>
      );
    }

    const copyVal = v?.toDate ? v.toDate().toISOString() : String(v);
    rows.push(
      <div key={k} className="modal-field">
        <div>
          <div className="modal-field-label">{k.replace(/_/g, ' ')}</div>
          {valueNode}
        </div>
        <button className="modal-field-copy" onClick={() => copyText(copyVal)}>Copy</button>
      </div>
    );
  });

  if (!rows.length) {
    return <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>No data</div>;
  }
  return rows;
}

export function SubmissionModal() {
  const { modal, closeModal, copyText, askDeleteOne } = useApp();
  const sub = modal.sub;

  return (
    <div
      className={'modal-bg' + (modal.open ? ' show' : '')}
      onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div className="modal" id="modal">
        <div className="modal-head">
          <div className="modal-title">
            {sub ? (<><SiteBadge siteId={sub.site_id} /> <TypeBadge sub={sub} /></>) : 'Detail'}
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="modal-body">
          {sub && <ModalFields sub={sub} />}
        </div>
        <div className="modal-foot">
          <button
            className="btn-ghost"
            onClick={() => {
              if (!sub) return;
              copyText(Object.entries(sub)
                .map(([k, v]) => `${k}: ${v?.toDate ? v.toDate().toISOString() : v}`)
                .join('\n'));
            }}
          >
            <i className="fa-solid fa-copy"></i> Copy
          </button>
          <button className="btn-negative" onClick={() => sub && askDeleteOne(sub.id)}>
            <i className="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog() {
  const { confirm, cancelConfirm, confirmOk } = useApp();
  return (
    <div
      className={'confirm-bg' + (confirm ? ' show' : '')}
      onClick={e => { if (e.target === e.currentTarget) cancelConfirm(); }}
    >
      <div className="confirm-box">
        <div className="confirm-icon"><i className="fa-solid fa-exclamation-triangle"></i></div>
        <div className="confirm-title">{confirm ? confirm.title : 'Delete?'}</div>
        <div className="confirm-msg">{confirm ? confirm.msg : 'Cannot be undone.'}</div>
        <div className="confirm-actions">
          <button className="btn-ghost" onClick={cancelConfirm}>Cancel</button>
          <button className="btn-negative" onClick={confirmOk}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export function ImageLightbox() {
  const { lightboxUrl, closeLightbox } = useApp();
  return (
    <div className={'img-lightbox' + (lightboxUrl ? ' show' : '')}>
      <div className="img-lightbox-bg" onClick={closeLightbox}></div>
      <div className="img-lightbox-content">
        {lightboxUrl && <img src={lightboxUrl} alt="Preview" />}
        <button className="img-lightbox-close" onClick={closeLightbox}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  );
}

export function Toast() {
  const { toastState } = useApp();
  const cls = 'toast' +
    (toastState.type ? ' ' + toastState.type : '') +
    (toastState.show ? ' show' : '');
  return <div className={cls}>{toastState.msg}</div>;
}

export function InstallBanner() {
  const { installVisible, installApp, dismissInstall } = useApp();
  return (
    <div className={'install-banner' + (installVisible ? ' show' : '')}>
      <div className="install-banner-inner">
        <div className="install-banner-text"><i className="fa-solid fa-download"></i> Install App</div>
        <div className="install-banner-actions">
          <button className="btn-ghost btn-xs" onClick={dismissInstall}>Later</button>
          <button className="install-btn" onClick={installApp}>Install</button>
        </div>
      </div>
    </div>
  );
}
