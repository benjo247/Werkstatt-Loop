/**
 * GET /embed.js
 *
 * Werkstätten haben zwei Einbau-Optionen:
 *
 * Option A: Modal-Button
 *   <button data-werkstattloop="ihrsslug">Termin buchen</button>
 *   <script src="https://werkstatt-loop.vercel.app/embed.js" async></script>
 *
 * Option B: Inline-Embed
 *   <div data-werkstattloop-inline="ihrsslug"></div>
 *   <script src="https://werkstatt-loop.vercel.app/embed.js" async></script>
 *
 * Beide Modi sind kombinierbar.
 */
export const dynamic = 'force-static';

const SCRIPT = `(function () {
  'use strict';

  var HOST = location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://' + (document.currentScript && new URL(document.currentScript.src).host || 'werkstatt-loop.vercel.app');

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
      '.wl-iframe{flex:1;width:100%;border:0;background:transparent;}',
      '.wl-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#64748b;font-size:14px;font-weight:500;background:#f8fafc;}',
      'body.wl-modal-open{overflow:hidden;}',
      '.wl-inline-wrapper{width:100%;position:relative;background:transparent;}',
      '.wl-inline-iframe{width:100%;border:0;display:block;background:transparent;transition:height .3s ease-out;min-height:600px;}',
      '.wl-inline-loading{padding:60px 20px;text-align:center;font-family:system-ui,sans-serif;color:#94a3b8;font-size:14px;font-weight:500;}',
    ].join('');
    document.head.appendChild(s);
  }

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
    iframe.dataset.wlMode = 'modal';
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

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay);
    });

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

  function mountInline(container) {
    if (container.dataset.wlMounted) return;
    container.dataset.wlMounted = '1';

    injectStyles();
    var slug = container.getAttribute('data-werkstattloop-inline');
    if (!slug) return;

    container.classList.add('wl-inline-wrapper');

    var loading = document.createElement('div');
    loading.className = 'wl-inline-loading';
    loading.textContent = 'Lade Buchungs-System...';

    var iframe = document.createElement('iframe');
    iframe.className = 'wl-inline-iframe';
    iframe.dataset.wlMode = 'inline';
    iframe.dataset.wlSlug = slug;
    iframe.src = HOST + '/r/' + encodeURIComponent(slug) + '?embed=1';
    iframe.setAttribute('allow', 'camera; clipboard-write');
    iframe.setAttribute('loading', 'lazy');
    iframe.style.opacity = '0';
    iframe.onload = function () {
      loading.remove();
      iframe.style.opacity = '1';
    };

    container.appendChild(loading);
    container.appendChild(iframe);
  }

  window.addEventListener('message', function (e) {
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.source !== 'werkstattloop') return;

    if (e.data.type === 'resize' && typeof e.data.height === 'number') {
      var iframes = document.querySelectorAll('.wl-inline-iframe');
      iframes.forEach(function (frame) {
        if (frame.contentWindow === e.source) {
          var h = Math.max(e.data.height, 600);
          frame.style.height = h + 'px';
        }
      });
    }

    if (e.data.type === 'booking-submitted') {
      setTimeout(function () {
        var overlay = document.querySelector('.wl-modal-overlay');
        if (overlay) closeModal(overlay);
      }, 4000);
    }
  });

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

  function mountInlineContainers() {
    var containers = document.querySelectorAll('[data-werkstattloop-inline]');
    containers.forEach(mountInline);
  }

  function init() {
    attachButtons();
    mountInlineContainers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.WerkstattLoop = {
    open: openModal,
    rescan: init,
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
