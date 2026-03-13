/**
 * NexusWait Embeddable Widget v1.0.0
 * https://nexuswait.io
 *
 * A self-contained JavaScript widget for embedding waitlist signup forms.
 * Zero dependencies. Works in all modern browsers.
 *
 * Usage:
 *   <script src="https://nexuswait.io/embed.js"></script>
 *   <div data-nexuswait-id="PROJECT_ID"></div>
 *
 * Configuration (via data attributes):
 *   data-nexuswait-id          — Project ID (required)
 *   data-nexuswait-name        — Show name field ("true"/"false", default "false")
 *   data-nexuswait-button-text — Button label (default "Join Waitlist")
 *   data-nexuswait-theme       — "dark" (default) or "light"
 *   data-nexuswait-accent      — Accent color hex (default "#00e8ff")
 *   data-nexuswait-show-count  — Show subscriber count ("true"/"false", default "false")
 *   data-nexuswait-api         — API base URL override (default "https://nexuswait.io/v1")
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  var VERSION = '1.0.0';
  var DEFAULT_API = 'https://nexuswait.io/v1';
  var STYLE_ID = 'nw-widget-styles';

  // ---------------------------------------------------------------------------
  // CSS — scoped under .nw-widget to avoid host-page conflicts
  // ---------------------------------------------------------------------------

  var CSS = [
    /* Reset & container */
    '.nw-widget{--nw-bg:#0c0c1a;--nw-bg-input:#12122a;--nw-border:#1e1e3a;--nw-text:#e0e0f0;--nw-text-muted:#7a7a9a;--nw-accent:#00e8ff;--nw-accent-hover:#00cfea;--nw-radius:10px;--nw-font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-family:var(--nw-font);box-sizing:border-box;width:100%;max-width:440px}',
    '.nw-widget *,.nw-widget *::before,.nw-widget *::after{box-sizing:border-box;margin:0;padding:0}',

    /* Light theme overrides */
    '.nw-widget.nw-light{--nw-bg:#ffffff;--nw-bg-input:#f4f4f8;--nw-border:#d8d8e4;--nw-text:#1a1a2e;--nw-text-muted:#6e6e8a}',

    /* Inner wrapper */
    '.nw-inner{background:var(--nw-bg);border:1px solid var(--nw-border);border-radius:var(--nw-radius);padding:24px;transition:opacity .3s ease}',

    /* Subscriber count */
    '.nw-count{font-size:13px;color:var(--nw-text-muted);text-align:center;margin-bottom:16px;letter-spacing:.3px}',
    '.nw-count-num{color:var(--nw-accent);font-weight:700}',

    /* Form layout */
    '.nw-form{display:flex;flex-direction:column;gap:10px}',

    /* Inputs */
    '.nw-input{width:100%;padding:11px 14px;font-size:14px;font-family:var(--nw-font);color:var(--nw-text);background:var(--nw-bg-input);border:1px solid var(--nw-border);border-radius:8px;outline:none;transition:border-color .2s ease,box-shadow .2s ease}',
    '.nw-input::placeholder{color:var(--nw-text-muted)}',
    '.nw-input:focus{border-color:var(--nw-accent);box-shadow:0 0 0 3px rgba(0,232,255,.12)}',

    /* Honeypot — invisible to humans, bots will fill it */
    '.nw-hp{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;padding:0!important;margin:-1px!important}',

    /* Submit button */
    '.nw-btn{width:100%;padding:12px 14px;font-size:14px;font-weight:600;font-family:var(--nw-font);color:#fff;border:none;border-radius:8px;cursor:pointer;transition:opacity .2s ease,transform .1s ease;letter-spacing:.3px}',
    '.nw-btn:hover{opacity:.88}',
    '.nw-btn:active{transform:scale(.985)}',
    '.nw-btn:disabled{cursor:not-allowed;opacity:.55}',

    /* Spinner inside button */
    '.nw-spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:nw-spin .6s linear infinite;vertical-align:middle;margin-right:6px}',
    '@keyframes nw-spin{to{transform:rotate(360deg)}}',

    /* Success state */
    '.nw-success{text-align:center;padding:8px 0}',
    '.nw-success-icon{font-size:36px;margin-bottom:10px}',
    '.nw-success-title{font-size:18px;font-weight:700;color:var(--nw-text);margin-bottom:6px}',
    '.nw-success-sub{font-size:13px;color:var(--nw-text-muted);line-height:1.5}',
    '.nw-ref-box{margin-top:14px;padding:10px 14px;background:var(--nw-bg-input);border:1px solid var(--nw-border);border-radius:8px;display:flex;align-items:center;gap:8px}',
    '.nw-ref-link{flex:1;font-size:12px;font-family:monospace;color:var(--nw-accent);word-break:break-all;user-select:all}',
    '.nw-ref-copy{padding:6px 12px;font-size:11px;font-weight:600;font-family:var(--nw-font);color:var(--nw-accent);background:transparent;border:1px solid var(--nw-accent);border-radius:6px;cursor:pointer;transition:background .2s,color .2s;white-space:nowrap}',
    '.nw-ref-copy:hover{background:var(--nw-accent);color:#fff}',

    /* Error state */
    '.nw-error{font-size:12px;color:#ff4d6a;margin-top:4px;line-height:1.4}',

    /* Branding */
    '.nw-brand{text-align:center;margin-top:14px;font-size:10px;color:var(--nw-text-muted);letter-spacing:.3px}',
    '.nw-brand a{color:var(--nw-text-muted);text-decoration:none;transition:color .2s}',
    '.nw-brand a:hover{color:var(--nw-accent)}',
  ].join('\n');

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Inject the stylesheet once */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  /** Simple email validation */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /** Format number with commas */
  function formatNumber(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /** Resolve API base — remove trailing slash */
  function resolveApi(override) {
    var base = override || DEFAULT_API;
    return base.replace(/\/+$/, '');
  }

  // ---------------------------------------------------------------------------
  // Widget Class
  // ---------------------------------------------------------------------------

  function Widget(container, config) {
    this.container = container;
    this.config = config;
    this.state = 'idle'; // idle | loading | success | error
    this.errorMsg = '';
    this.subscriber = null;
    this.count = null;
    this.render();
    if (this.config.showCount) this.fetchCount();
  }

  Widget.prototype.fetchCount = function () {
    var self = this;
    var url = this.config.apiBase + '/projects/' + this.config.projectId + '/subscribers/count';
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (typeof data.count === 'number') {
          self.count = data.count;
          self.render();
        }
      })
      .catch(function () {
        // Silently ignore count fetch errors
      });
  };

  Widget.prototype.submit = function (email, name) {
    if (this.state === 'loading') return; // prevent double submit
    if (!email || !isValidEmail(email)) {
      this.state = 'error';
      this.errorMsg = 'Please enter a valid email address.';
      this.render();
      return;
    }

    // Check honeypot
    var hpField = this.container.querySelector('.nw-hp-field');
    if (hpField && hpField.value) {
      // Silently pretend success for bots
      this.state = 'success';
      this.subscriber = { referralCode: '' };
      this.render();
      return;
    }

    this.state = 'loading';
    this.errorMsg = '';
    this.render();

    var self = this;
    var url = this.config.apiBase + '/projects/' + this.config.projectId + '/subscribers';
    var body = { email: email, source: 'embed_widget' };
    if (name) body.name = name;

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (r) {
        if (!r.ok) return r.json().then(function (err) { throw err; });
        return r.json();
      })
      .then(function (data) {
        self.state = 'success';
        self.subscriber = data;
        self.render();
      })
      .catch(function (err) {
        self.state = 'error';
        // Handle NestJS validation / known error shapes
        if (err && err.message) {
          if (Array.isArray(err.message)) {
            self.errorMsg = err.message.join('. ');
          } else {
            self.errorMsg = String(err.message);
          }
        } else {
          self.errorMsg = 'Something went wrong. Please try again.';
        }
        self.render();
      });
  };

  Widget.prototype.render = function () {
    var cfg = this.config;
    var accent = cfg.accent;
    var accentBg = 'linear-gradient(135deg, ' + accent + ', ' + shiftColor(accent, -30) + ')';

    // Build HTML based on current state
    var html = '';

    // Outer wrapper
    html += '<div class="nw-inner">';

    if (this.state === 'success') {
      // ----- Success state -----
      var refCode = (this.subscriber && this.subscriber.referralCode) || '';
      var refUrl = window.location.origin + window.location.pathname + '?ref=' + refCode;

      html += '<div class="nw-success">';
      html += '<div class="nw-success-icon">&#10003;</div>';
      html += '<div class="nw-success-title">You\'re on the list!</div>';
      html += '<div class="nw-success-sub">Share your link to move up the waitlist.</div>';
      if (refCode) {
        html += '<div class="nw-ref-box">';
        html += '<span class="nw-ref-link">' + escapeHtml(refUrl) + '</span>';
        html += '<button type="button" class="nw-ref-copy" data-nw-copy="' + escapeAttr(refUrl) + '">Copy</button>';
        html += '</div>';
      }
      html += '</div>';
    } else {
      // ----- Form state (idle / loading / error) -----
      if (this.config.showCount && this.count !== null) {
        html += '<div class="nw-count"><span class="nw-count-num">' + formatNumber(this.count) + '</span> people on the waitlist</div>';
      }

      html += '<form class="nw-form" novalidate>';
      if (cfg.showName) {
        html += '<input class="nw-input" type="text" name="name" placeholder="Your name" autocomplete="name">';
      }
      html += '<input class="nw-input nw-email" type="email" name="email" placeholder="you@email.com" required autocomplete="email">';

      // Honeypot — screen readers & users won't see it, bots will
      html += '<label class="nw-hp" aria-hidden="true">Leave blank<input class="nw-hp-field" type="text" name="_hp" tabindex="-1" autocomplete="off"></label>';

      var disabled = this.state === 'loading' ? ' disabled' : '';
      var btnContent = this.state === 'loading'
        ? '<span class="nw-spinner"></span>Joining...'
        : escapeHtml(cfg.buttonText);

      html += '<button type="submit" class="nw-btn" style="background:' + accentBg + '"' + disabled + '>' + btnContent + '</button>';

      if (this.state === 'error' && this.errorMsg) {
        html += '<div class="nw-error">' + escapeHtml(this.errorMsg) + '</div>';
      }

      html += '</form>';
    }

    // Branding footer
    html += '<div class="nw-brand">Powered by <a href="https://nexuswait.io" target="_blank" rel="noopener noreferrer">NexusWait</a></div>';
    html += '</div>';

    this.container.innerHTML = html;

    // Apply theme class
    this.container.className = 'nw-widget' + (cfg.theme === 'light' ? ' nw-light' : '');

    // Bind events
    this.bindEvents();
  };

  Widget.prototype.bindEvents = function () {
    var self = this;

    // Form submit
    var form = this.container.querySelector('.nw-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = form.querySelector('.nw-email').value.trim();
        var nameField = form.querySelector('input[name="name"]');
        var name = nameField ? nameField.value.trim() : '';
        self.submit(email, name);
      });
    }

    // Copy referral link button
    var copyBtn = this.container.querySelector('.nw-ref-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var url = copyBtn.getAttribute('data-nw-copy');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            copyBtn.textContent = 'Copied!';
            setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000);
          });
        } else {
          // Fallback for older browsers
          var ta = document.createElement('textarea');
          ta.value = url;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); copyBtn.textContent = 'Copied!'; }
          catch (_) { /* ignore */ }
          document.body.removeChild(ta);
          setTimeout(function () { copyBtn.textContent = 'Copy'; }, 2000);
        }
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Color Helpers
  // ---------------------------------------------------------------------------

  /** Parse hex color to RGB */
  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  /** Shift a hex color darker/lighter by amount (-255 to 255) */
  function shiftColor(hex, amount) {
    var c = hexToRgb(hex);
    var r = Math.max(0, Math.min(255, c.r + amount));
    var g = Math.max(0, Math.min(255, c.g + amount));
    var b = Math.max(0, Math.min(255, c.b + amount));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ---------------------------------------------------------------------------
  // XSS Helpers
  // ---------------------------------------------------------------------------

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---------------------------------------------------------------------------
  // Config parser — reads data attributes from a container element
  // ---------------------------------------------------------------------------

  function parseConfig(el) {
    return {
      projectId: el.getAttribute('data-nexuswait-id') || '',
      showName: el.getAttribute('data-nexuswait-name') === 'true',
      buttonText: el.getAttribute('data-nexuswait-button-text') || 'Join Waitlist',
      theme: el.getAttribute('data-nexuswait-theme') === 'light' ? 'light' : 'dark',
      accent: el.getAttribute('data-nexuswait-accent') || '#00e8ff',
      showCount: el.getAttribute('data-nexuswait-show-count') === 'true',
      apiBase: resolveApi(el.getAttribute('data-nexuswait-api')),
    };
  }

  // ---------------------------------------------------------------------------
  // Auto-init: scan for data-nexuswait-id elements
  // ---------------------------------------------------------------------------

  function autoInit() {
    injectStyles();
    var elements = document.querySelectorAll('[data-nexuswait-id]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      // Skip already-initialized elements
      if (el.getAttribute('data-nw-init')) continue;
      var cfg = parseConfig(el);
      if (!cfg.projectId) {
        console.warn('[NexusWait] Missing project ID on element:', el);
        continue;
      }
      el.setAttribute('data-nw-init', '1');
      new Widget(el, cfg);
    }
  }

  // ---------------------------------------------------------------------------
  // Public API: NexusWait.init()
  // ---------------------------------------------------------------------------

  function manualInit(options) {
    if (!options || !options.projectId) {
      console.error('[NexusWait] init() requires at least { projectId }');
      return null;
    }
    injectStyles();

    var el;
    if (typeof options.el === 'string') {
      el = document.querySelector(options.el);
    } else if (options.el instanceof HTMLElement) {
      el = options.el;
    }

    if (!el) {
      console.error('[NexusWait] Target element not found:', options.el || '(none provided)');
      return null;
    }

    var cfg = {
      projectId: options.projectId,
      showName: !!options.showName,
      buttonText: options.buttonText || 'Join Waitlist',
      theme: options.theme === 'light' ? 'light' : 'dark',
      accent: options.accent || '#00e8ff',
      showCount: !!options.showCount,
      apiBase: resolveApi(options.apiBase),
    };

    el.setAttribute('data-nw-init', '1');
    return new Widget(el, cfg);
  }

  // ---------------------------------------------------------------------------
  // Expose global & run auto-init
  // ---------------------------------------------------------------------------

  window.NexusWait = {
    version: VERSION,
    init: manualInit,
  };

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    // DOM already loaded (script loaded async/defer or at bottom of body)
    autoInit();
  }
})();
