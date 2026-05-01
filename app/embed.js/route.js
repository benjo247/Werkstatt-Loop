/**
 * GET /embed.js
 *
 * Liefert das Embed-Loader-Script aus.
 * Werkstätten binden es ein:
 *   <button data-werkstattloop="ihrsslug">Online Termin buchen</button>
 *   <script src="https://werkstattloop.vercel.app/embed.js" async></script>
 *
 * Der Script:
 *   - findet alle <button data-werkstattloop="...">
 *   - bei Klick: öffnet Modal mit iframe zu /r/[slug]?embed=1
 *   - hört auf postMessage(s) für Höhe + Auto-Close
 *
 * In Production-Domain ändern: this.host = 'https://werkstattloop.de';
 */
export const dynamic = 'force-static';

const SCRIPT = `(function () {
  'use strict';

  var HOST = location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://' + (document.currentScript && new URL(document.currentScript.src).host || 'werkstatt-loop.vercel.app');

  // CSS einmalig injizieren
  function injectStyles() {
    if (document.getElementById('wl-embed-styles')) return;
    var s = document.createElement('style');
    s.id = 'wl-embed-styles';
    s.textContent = [
      '.wl-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.7);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:0;animation:wl-fade .2s ease-out;}',
      '@keyframes wl-fade{from{opacity:0}to{opacity:1}}',
      '.wl-modal-box{background:white;border-radius:0;width:100%;height:100%;max-width:none;max-height:none;position:relative;overflow:hidden;display:flex;flex-direction:column;}',
      '@media (min-width:768px){.wl-modal-overlay{padding:24px;}.wl-modal-box{border-radius:20px;width:100%;max-width:720px;max-height:92vh;box-shadow:0 25px 50px -12px rgba(0,0,0,.5);}}',
      '.wl-modal-close{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:999px;background:rgba(15,23,42,.9);color:white;border:0;cursor:pointer;font-size:18px;line-height:1;z-index:10;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;font-weight:700;transition:background .15s;}',
      '.wl-modal-close:hover{background:#dc2626;}',
      '.wl-iframe{flex:1;width:100%;border:0;background:#f8fafc;}',
      '.wl-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#64748b;font-size:14px;font-weight:500;background:#f8fafc;}',
      'body.wl-modal-open{overflow:hidden;}',
    ].join('');
    document.head.appendChild(s);
  }

  // Modal öffnen
  function openModal(slug) {
    injectStyles();

    var overlay = document.createElement('div');
    overlay.className = 'wl-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Online Termin buchen');

    var box = document.createElement('div');
    box.className = 'wl-modal-box';

    var loading = document.createElement('div');
    loading.className = 'wl-loading';
    loading.textContent = 'Lade Buchungs-System...';

    var close = document.createElement('button');
    close.className = 'wl-modal-close';
    close.innerHTML = '&times;';
    close.setAttribute('aria-label', 'Schließen');
    close.onclick = function () { closeModal(overlay); };

    var iframe = document.createElement('iframe');
    iframe.className = 'wl-iframe';
    iframe.src = HOST + '/r/' + encodeURIComponent(slug) + '?embed=1';
    iframe.setAttribute('allow', 'camera; clipboard-write');
    iframe.setAttribute('loading', 'eager');
    iframe.onload = function () { loading.remove(); };

    box.appendChild(close);
    box.appendChild(loading);
    box.appendChild(iframe);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    document.body.classList.add('wl-modal-open');

    // Schließen bei Klick auf Overlay (nicht auf Box)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay);
    });

    // Schließen bei ESC
    var escHandler = function (e) {
      if (e.key === 'Escape') {
        closeModal(overlay);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  function closeModal(overlay) {
    overlay.remove();
    document.body.classList.remove('wl-modal-open');
  }

  // postMessage von iframe verarbeiten
  window.addEventListener('message', function (e) {
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.source !== 'werkstattloop') return;

    if (e.data.type === 'booking-submitted') {
      // Auto-Close nach 4 Sekunden
      setTimeout(function () {
        var overlay = document.querySelector('.wl-modal-overlay');
        if (overlay) closeModal(overlay);
      }, 4000);
    }
  });

  // Buttons aktivieren
  function attachButtons() {
    var btns = document.querySelectorAll('[data-werkstattloop]');
    btns.forEach(function (btn) {
      if (btn.dataset.wlAttached) return;
      btn.dataset.wlAttached = '1';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var slug = btn.getAttribute('data-werkstattloop');
        if (!slug) return;
        openModal(slug);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachButtons);
  } else {
    attachButtons();
  }

  // Globaler Re-Scan, falls Buttons dynamisch nachgeladen werden
  window.WerkstattLoop = {
    open: openModal,
    rescan: attachButtons,
  };
})();`;

export async function GET() {
  return new Response(SCRIPT, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
