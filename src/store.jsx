import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { FIREBASE_CONFIG, TELEGRAM_DEFAULTS } from './config';
import { toDate, applyFilters, exportCSV } from './utils';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const DEFAULT_FILTER = { range: 'all', site: 'all', type: 'all', status: 'all', search: '' };

function loadTelegram() {
  return {
    botToken: localStorage.getItem('tg_bot_token') || TELEGRAM_DEFAULTS.botToken,
    chatId: localStorage.getItem('tg_chat_id') || TELEGRAM_DEFAULTS.chatId,
    enabled: localStorage.getItem('tg_enabled') === 'true'
  };
}

function saveTelegram(cfg) {
  localStorage.setItem('tg_bot_token', cfg.botToken);
  localStorage.setItem('tg_chat_id', cfg.chatId);
  localStorage.setItem('tg_enabled', String(cfg.enabled));
}

function sendTelegram(token, chatId, text) {
  const url = 'https://api.telegram.org/bot' + token + '/sendMessage';
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  })
    .then(r => r.json())
    .then(d => { if (!d.ok) console.warn('Telegram send failed:', d); })
    .catch(e => console.warn('Telegram error:', e));
}

export function AppProvider({ children }) {
  const [subs, setSubs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [conn, setConn] = useState('connecting');
  const [initError, setInitError] = useState('');
  const [page, setPage] = useState(() => location.hash.slice(1) || 'dashboard');
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [selected, setSelected] = useState(() => new Set());
  const [soundOn, setSoundOn] = useState(false);
  const [soundTouched, setSoundTouched] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('admin_theme') || 'dark');
  const [tg, setTg] = useState(loadTelegram);
  const [payment, setPayment] = useState({ qr: null, upi: null });
  const [toastState, setToastState] = useState({ msg: '', type: '', show: false });
  const [modal, setModal] = useState({ sub: null, open: false });
  const [confirm, setConfirm] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [installVisible, setInstallVisible] = useState(false);

  const dbRef = useRef(null);
  const unsubRef = useRef(null);
  const unsubPayRef = useRef(null);
  const retryRef = useRef(null);
  const firstLoadRef = useRef(true);
  const prevIdsRef = useRef(new Set());
  const soundRef = useRef(false);
  const tgRef = useRef(tg);
  const audioRef = useRef(null);
  const toastTimer = useRef(null);
  const deferredPromptRef = useRef(null);

  // ----- theme -----
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('admin_theme', theme);
  }, [theme]);
  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'dim' : 'dark')), []);

  // ----- toast -----
  const toast = useCallback((msg, type = '') => {
    clearTimeout(toastTimer.current);
    setToastState({ msg, type, show: true });
    toastTimer.current = setTimeout(() => setToastState(s => ({ ...s, show: false })), 2200);
  }, []);

  const copyText = useCallback(text => {
    navigator.clipboard?.writeText(text).then(() => toast('Copied'));
  }, [toast]);

  // ----- sound -----
  const playBeep = () => {
    if (!soundRef.current) return;
    try {
      if (!audioRef.current) audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioRef.current;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; o.type = 'sine';
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start(); o.stop(ctx.currentTime + 0.4);
    } catch (e) { /* audio not available */ }
  };

  const updateSound = useCallback(v => {
    soundRef.current = v;
    setSoundOn(v);
  }, []);

  const toggleSound = useCallback(v => {
    setSoundTouched(true);
    updateSound(v);
    toast('Sound ' + (v ? 'on' : 'off'));
  }, [toast, updateSound]);

  // ----- telegram -----
  const updateTg = useCallback(next => {
    tgRef.current = next;
    saveTelegram(next);
    setTg(next);
  }, []);

  const toggleTelegram = useCallback(enabled => {
    updateTg({ ...tgRef.current, enabled });
    toast('Telegram ' + (enabled ? 'enabled' : 'disabled'));
  }, [toast, updateTg]);

  const saveTelegramSettings = useCallback((botToken, chatId) => {
    updateTg({ ...tgRef.current, botToken: botToken.trim(), chatId: chatId.trim() });
    toast('Telegram settings saved');
  }, [toast, updateTg]);

  const testTelegram = useCallback((botToken, chatId) => {
    const token = botToken.trim(), chat = chatId.trim();
    if (!token || !chat) { toast('Enter token and chat ID first', 'error'); return; }
    sendTelegram(token, chat, '<b>✅ Test Alert!</b>\nYour Telegram bot is working.\nNew submissions will be notified here.');
    toast('Test message sent!');
  }, [toast]);

  // ----- firestore listener -----
  const startListener = useCallback(() => {
    const db = dbRef.current;
    if (!db) return;
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    clearTimeout(retryRef.current);
    unsubRef.current = db.collection('submissions')
      .orderBy('created_at', 'desc')
      .onSnapshot({ includeMetadataChanges: true }, snap => {
        if (snap.metadata.fromCache && firstLoadRef.current) return;
        const newIds = new Set(snap.docs.map(d => d.id));
        const prev = prevIdsRef.current;
        if (prev.size > 0) {
          const newDocs = snap.docs.filter(d => !prev.has(d.id));
          const n = newDocs.length;
          if (n > 0) {
            playBeep();
            toast('New ' + n + ' submission' + (n > 1 ? 's' : ''), 'success');
            const first = newDocs[0].data();
            const site = first.site_id || 'Unknown';
            const type = first.type || 'N/A';
            const cfg = tgRef.current;
            if (cfg.enabled && cfg.botToken && cfg.chatId) {
              const msg = '<b>📢 New Submission!</b>\nSite: ' + site + '\nType: ' + type +
                '\nCount: ' + n + '\n<a href="https://console.firebase.google.com">Check Admin Panel</a>';
              sendTelegram(cfg.botToken, cfg.chatId, msg);
            }
          }
        }
        prevIdsRef.current = newIds;
        setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        firstLoadRef.current = false;
        setLoaded(true);
        setConn(snap.metadata.fromCache ? 'cached' : 'connected');
      }, err => {
        console.error(err);
        setConn('error');
        retryRef.current = setTimeout(() => { setConn('connecting'); startListener(); }, 5000);
      });
  }, [toast]);

  // ----- init, presence, reconnect handlers -----
  useEffect(() => {
    const presence = (online, withTime = true) => {
      const db = dbRef.current;
      if (!db) return;
      const data = withTime
        ? { online, lastSeen: firebase.firestore.FieldValue.serverTimestamp() }
        : { online };
      db.collection('admin_status').doc('admin').set(data, { merge: true }).catch(() => {});
    };

    const onHash = () => setPage(location.hash.slice(1) || 'dashboard');
    const onVisibility = () => {
      if (!dbRef.current) return;
      if (document.visibilityState === 'visible') { clearTimeout(retryRef.current); startListener(); }
      presence(document.visibilityState === 'visible');
    };
    const onFocus = () => { if (dbRef.current) { clearTimeout(retryRef.current); startListener(); } };
    const onOnline = () => {
      if (dbRef.current) { clearTimeout(retryRef.current); startListener(); toast('Back online', 'success'); }
    };
    const onOffline = () => { setConn('error'); toast('Offline', 'error'); };
    const onBeforeUnload = () => presence(false, false);
    const onBeforeInstall = e => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setInstallVisible(true);
    };
    const onAppInstalled = () => {
      setInstallVisible(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('hashchange', onHash);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    const interval = setInterval(() => {
      const db = dbRef.current;
      if (db && document.visibilityState === 'visible') {
        db.collection('submissions').limit(1).get({ source: 'server' }).catch(() => {
          setConn('error');
          clearTimeout(retryRef.current);
          startListener();
        });
      }
    }, 120000);

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    try {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      const db = firebase.firestore();
      db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
      dbRef.current = db;
      presence(true);
      startListener();
      unsubPayRef.current = db.collection('unblock_settings').doc('payment').onSnapshot(doc => {
        const d = doc.data() || {};
        setPayment({ qr: d.qr_code_url || null, upi: d.upi_id || null });
      });
    } catch (e) {
      console.error(e);
      setConn('error');
      setInitError(e.message);
    }

    return () => {
      window.removeEventListener('hashchange', onHash);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
      clearInterval(interval);
      clearTimeout(retryRef.current);
      clearTimeout(toastTimer.current);
      if (unsubRef.current) unsubRef.current();
      if (unsubPayRef.current) unsubPayRef.current();
    };
  }, [startListener, toast]);

  // ----- derived data -----
  const filtered = useMemo(() => {
    return applyFilters(subs, filter)
      .slice()
      .sort((a, b) => (toDate(b.created_at) || 0) - (toDate(a.created_at) || 0));
  }, [subs, filter]);

  // drop selections that are no longer visible
  useEffect(() => {
    setSelected(prev => {
      const ids = new Set(filtered.map(s => s.id));
      const next = new Set([...prev].filter(id => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  const navigate = useCallback(p => setPage(p), []);

  // ----- selection -----
  const toggleSelect = useCallback(id => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // ----- modal -----
  const openModal = useCallback(sub => setModal({ sub, open: true }), []);
  const closeModal = useCallback(() => setModal(m => ({ ...m, open: false })), []);

  // ----- lightbox -----
  const openLightbox = useCallback(url => setLightboxUrl(url), []);
  const closeLightbox = useCallback(() => setLightboxUrl(null), []);

  // ----- deletes -----
  const deleteOne = async id => {
    try {
      await dbRef.current.collection('submissions').doc(id).delete();
      setSubs(prev => prev.filter(s => s.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      toast('Deleted', 'success');
    } catch (e) {
      toast('Delete failed', 'error');
    }
  };

  const deleteMany = async ids => {
    try {
      const db = dbRef.current;
      const batch = db.batch();
      ids.forEach(id => batch.delete(db.collection('submissions').doc(id)));
      await batch.commit();
      setSubs(prev => prev.filter(s => !ids.includes(s.id)));
      setSelected(new Set());
      toast('Deleted ' + ids.length, 'success');
    } catch (e) {
      toast('Delete failed', 'error');
    }
  };

  const askDeleteOne = useCallback(id => {
    setConfirm({
      kind: 'single', step: 1, id,
      title: 'Delete this?',
      msg: 'Are you sure you want to delete this submission?'
    });
  }, []);

  const askBulkDelete = useCallback(() => {
    const ids = [...selected];
    if (!ids.length) return;
    setConfirm({
      kind: 'bulk', ids,
      title: 'Delete ' + ids.length + ' items?',
      msg: 'This action CANNOT be undone. All selected data will be permanently deleted.'
    });
  }, [selected]);

  const cancelConfirm = useCallback(() => setConfirm(null), []);

  const confirmOk = async () => {
    const c = confirm;
    if (!c) return;
    if (c.kind === 'single' && c.step === 1) {
      setConfirm({
        ...c, step: 2,
        title: 'Are you really sure?',
        msg: 'This action CANNOT be undone. Data will be permanently deleted.'
      });
      return;
    }
    setConfirm(null);
    if (c.kind === 'single') {
      setModal(m => ({ ...m, open: false }));
      await deleteOne(c.id);
    } else {
      await deleteMany(c.ids);
    }
  };

  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return;
      if (confirm) setConfirm(null);
      else if (modal.open) closeModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirm, modal.open, closeModal]);

  // ----- payment settings -----
  const savePaymentField = useCallback((field, value) => {
    const db = dbRef.current;
    if (!db) return Promise.reject(new Error('Not connected'));
    const data = value === null
      ? { [field]: firebase.firestore.FieldValue.delete() }
      : { [field]: value, updated_at: firebase.firestore.FieldValue.serverTimestamp() };
    return db.collection('unblock_settings').doc('payment').set(data, { merge: true });
  }, []);

  // ----- export -----
  const exportAll = useCallback(() => {
    if (!subs.length) { toast('Nothing to export'); return; }
    exportCSV(subs, 'all');
    toast('Exported ' + subs.length + ' rows');
  }, [subs, toast]);

  // ----- install -----
  const installApp = () => {
    const dp = deferredPromptRef.current;
    if (!dp) return;
    dp.prompt();
    dp.userChoice.then(() => {
      deferredPromptRef.current = null;
      setInstallVisible(false);
    });
  };
  const dismissInstall = () => setInstallVisible(false);

  const value = {
    page, navigate, theme, toggleTheme,
    subs, loaded, conn, initError, filter, setFilter, filtered,
    selected, toggleSelect,
    modal, openModal, closeModal, askDeleteOne, askBulkDelete,
    confirm, confirmOk, cancelConfirm,
    toastState, toast, copyText,
    soundOn, soundTouched, toggleSound,
    tg, toggleTelegram, saveTelegramSettings, testTelegram,
    payment, savePaymentField,
    lightboxUrl, openLightbox, closeLightbox,
    installVisible, installApp, dismissInstall,
    exportAll
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
