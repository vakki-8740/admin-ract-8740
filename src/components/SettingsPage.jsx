import { useEffect, useState } from 'react';
import { useApp } from '../store';

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)',
  fontSize: 13, fontFamily: 'inherit', outline: 'none'
};

const iconBox = {
  background: 'rgba(175,82,222,0.1)', color: '#AF52DE', width: 32, height: 32, borderRadius: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0
};

export default function SettingsPage() {
  const {
    page, soundOn, toggleSound, tg, toggleTelegram, saveTelegramSettings, testTelegram,
    payment, savePaymentField, toast, exportAll
  } = useApp();

  const [tgToken, setTgToken] = useState(tg.botToken);
  const [tgChat, setTgChat] = useState(tg.chatId);
  const [qrInput, setQrInput] = useState('');
  const [upiInput, setUpiInput] = useState('');

  useEffect(() => { if (payment.qr) setQrInput(payment.qr); }, [payment.qr]);
  useEffect(() => { if (payment.upi) setUpiInput(payment.upi); }, [payment.upi]);

  const saveQr = () => {
    const v = qrInput.trim();
    if (!v) { toast('Enter QR image URL', 'error'); return; }
    savePaymentField('qr_code_url', v)
      .then(() => toast('QR URL saved'))
      .catch(() => toast('Save failed', 'error'));
  };

  const removeQr = () => {
    savePaymentField('qr_code_url', null)
      .then(() => { toast('QR removed'); setQrInput(''); })
      .catch(() => toast('Remove failed', 'error'));
  };

  const saveUpi = () => {
    const v = upiInput.trim();
    if (!v) { toast('Enter UPI ID', 'error'); return; }
    savePaymentField('upi_id', v)
      .then(() => toast('UPI saved'))
      .catch(() => toast('Save failed', 'error'));
  };

  const removeUpi = () => {
    savePaymentField('upi_id', null)
      .then(() => { toast('UPI removed'); setUpiInput(''); })
      .catch(() => toast('Remove failed', 'error'));
  };

  return (
    <div className={'page' + (page === 'settings' ? ' active' : '')} id="page-settings">
      <div className="page-pad">
        <div className="ios-group">
          <div className="ios-group-title">Preferences</div>
          <div className="ios-row">
            <div className="ios-row-left">
              <div className="ios-row-icon" style={{ background: 'rgba(255,255,0,0.25)', color: 'var(--accent)' }}>
                <i className="fa-solid fa-bell"></i>
              </div>
              <div><div className="ios-row-title">Sound Alerts</div><div className="ios-row-sub">New submission sound</div></div>
            </div>
            <label className="toggle">
              <input type="checkbox" id="soundToggle" checked={soundOn} onChange={e => toggleSound(e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="ios-group">
          <div className="ios-group-title">Telegram Alerts</div>
          <div className="ios-row">
            <div className="ios-row-left">
              <div className="ios-row-icon" style={{ background: 'rgba(0,184,148,0.1)', color: '#00B894' }}>
                <i className="fa-solid fa-paper-plane"></i>
              </div>
              <div><div className="ios-row-title">Telegram Bot</div><div className="ios-row-sub">Send alerts on new submissions</div></div>
            </div>
            <label className="toggle">
              <input type="checkbox" id="tgToggle" checked={tg.enabled} onChange={e => toggleTelegram(e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="ios-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, padding: '12px 16px' }}>
            <input
              type="text" id="tgBotToken" className="tg-input" placeholder="Bot Token"
              style={inputStyle} value={tgToken} onChange={e => setTgToken(e.target.value)}
            />
            <input
              type="text" id="tgChatId" className="tg-input" placeholder="Chat ID"
              style={inputStyle} value={tgChat} onChange={e => setTgChat(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost btn-xs" id="tgSaveBtn" style={{ flex: 1 }}
                onClick={() => saveTelegramSettings(tgToken, tgChat)}>
                <i className="fa-solid fa-floppy-disk"></i> Save
              </button>
              <button className="btn-ghost btn-xs" id="tgTestBtn" style={{ flex: 1 }}
                onClick={() => testTelegram(tgToken, tgChat)}>
                <i className="fa-solid fa-flask"></i> Test
              </button>
            </div>
          </div>
        </div>

        <div className="ios-group">
          <div className="ios-group-title">Unlock Withdrawal Payment</div>
          <div className="ios-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="ios-row-icon" style={iconBox}><i className="fa-solid fa-qrcode"></i></div>
              <div>
                <div className="ios-row-title" style={{ fontSize: 14, fontWeight: 600 }}>QR Image URL</div>
                <div className="ios-row-sub" style={{ fontSize: 11 }}>Paste QR image URL</div>
              </div>
            </div>
            <input
              type="text" id="qrUrlInput" placeholder="https://i.ibb.co/..."
              style={inputStyle} value={qrInput} onChange={e => setQrInput(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {payment.qr && (
                <img
                  id="qrPreview" src={payment.qr} alt=""
                  style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }}
                />
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="btn-ghost btn-xs" id="saveQrUrlBtn" onClick={saveQr}>
                  <i className="fa-solid fa-floppy-disk"></i> Save
                </button>
                <button className="btn-negative btn-xs" id="removeQrBtn" onClick={removeQr}>
                  <i className="fa-solid fa-trash"></i> Remove
                </button>
              </div>
            </div>
          </div>
          <div className="ios-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="ios-row-icon" style={iconBox}><i className="fa-solid fa-money-bill"></i></div>
              <div>
                <div className="ios-row-title" style={{ fontSize: 14, fontWeight: 600 }}>UPI ID</div>
                <div className="ios-row-sub" style={{ fontSize: 11 }}>Set payment UPI ID</div>
              </div>
            </div>
            <input
              type="text" id="upiIdInput" placeholder="example@upi"
              style={inputStyle} value={upiInput} onChange={e => setUpiInput(e.target.value)}
            />
            {payment.upi && (
              <div id="upiStatus" style={{ fontSize: 11, color: 'var(--text2)' }}>Current: {payment.upi}</div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-ghost btn-xs" id="saveUpiBtn" onClick={saveUpi}>
                <i className="fa-solid fa-floppy-disk"></i> Save
              </button>
              <button className="btn-negative btn-xs" id="removeUpiBtn" onClick={removeUpi}>
                <i className="fa-solid fa-trash"></i> Remove
              </button>
            </div>
          </div>
        </div>

        <div className="ios-group">
          <div className="ios-group-title">Data</div>
          <div className="ios-row" id="settingsExport" onClick={exportAll}>
            <div className="ios-row-left">
              <div className="ios-row-icon" style={{ background: 'rgba(52,199,89,0.1)', color: '#34C759' }}>
                <i className="fa-solid fa-download"></i>
              </div>
              <div><div className="ios-row-title">Export All Data</div><div className="ios-row-sub">Download as CSV</div></div>
            </div>
            <i className="fa-solid fa-chevron-right ios-arrow"></i>
          </div>
        </div>

        <div className="ios-group">
          <div className="ios-group-title">About</div>
          <div className="ios-row">
            <div className="ios-row-left">
              <div className="ios-row-icon" style={{ background: 'rgba(88,86,214,0.1)', color: '#5856D6' }}>
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div><div className="ios-row-title">Admin Panel</div><div className="ios-row-sub">v2.0</div></div>
            </div>
          </div>
          <div className="ios-row">
            <div className="ios-row-left">
              <div className="ios-row-icon" style={{ background: 'rgba(255,149,0,0.1)', color: '#FF9500' }}>
                <i className="fa-solid fa-database"></i>
              </div>
              <div><div className="ios-row-title">Project</div><div className="ios-row-sub">alll-projects-admin-pennal</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
