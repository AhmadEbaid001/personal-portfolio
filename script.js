/* Ahmed Ebaid — portfolio behaviour.
   Theme, menu, reveals, scrollspy, count-up, and the two interactive demos.
   Everything degrades to a fully readable page if this file never runs. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- theme ---------- */
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');

  function labelFor(theme) {
    return theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  }

  if (toggle) {
    toggle.setAttribute('aria-label', labelFor(root.getAttribute('data-theme')));

    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      toggle.setAttribute('aria-label', labelFor(next));
      try {
        localStorage.setItem('theme', next);
      } catch (e) { /* storage blocked: the choice just won't persist */ }
    });
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById('menuToggle');
  var mobileNav = document.getElementById('mobileNav');

  function setMenu(open) {
    if (!menuBtn || !mobileNav) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileNav.hidden = !open;
    mobileNav.setAttribute('data-open', String(open));
  }

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });

    mobileNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuBtn.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) setMenu(false);
    });
  }

  /* ---------- sticky header hairline ---------- */
  var head = document.querySelector('.site-head');
  if (head) {
    var onScroll = function () {
      head.classList.toggle('is-stuck', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- scroll reveal ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (!hasIO || reduceMotion.matches) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var siblings = Array.prototype.slice.call(entry.target.parentNode.children);
        var i = Math.min(siblings.indexOf(entry.target), 5);
        entry.target.style.transitionDelay = (i * 60) + 'ms';
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });

    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- count-up ----------
     Numbers tick to their real value once, when the stat first scrolls in. */
  function formatNumber(value, decimals) {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-to'));
    var decimals = parseInt(el.getAttribute('data-dec') || '0', 10);
    if (isNaN(target)) return;

    var duration = 900;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / duration, 1);
      // easeOutCubic — fast then settling, so the final value is legible early
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatNumber(target * eased, decimals);
      if (t < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  var counts = Array.prototype.slice.call(document.querySelectorAll('.count'));

  if (hasIO && !reduceMotion.matches) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counts.forEach(function (el) { countObserver.observe(el); });
  }
  // else: the markup already contains the final value, so nothing to do

  /* ==========================================================================
     Hero — request pipeline
     Requests stream left to right through three gates before reaching the
     origin. Each hostile class is stopped by exactly one gate; switch that gate
     off and the class walks through to the origin and counts as a breach.
     Canvas is decorative-with-a-label: the counters below it carry the same
     information as text, so nothing is lost without it.
     ========================================================================== */
  (function pipeline() {
    var wrap = document.getElementById('pipeDemo');
    var canvas = document.getElementById('pipeCanvas');
    if (!wrap || !canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var stateEl = document.getElementById('pipeState');
    var elServed = document.getElementById('cServed');
    var elBlocked = document.getElementById('cBlocked');
    var elBreached = document.getElementById('cBreached');
    var breachBox = wrap.querySelector('.is-breach');
    var attackBtn = document.getElementById('pipeAttack');
    var gateBtns = Array.prototype.slice.call(wrap.querySelectorAll('.gate'));

    // Each hostile class is answered by exactly one gate.
    var GATES = [
      { key: 'waf', label: 'WAF', stops: 'inject', at: 0.30, on: true },
      { key: 'tls', label: 'TLS', stops: 'sniff', at: 0.50, on: true },
      { key: 'authz', label: 'AUTHZ', stops: 'forged', at: 0.70, on: true }
    ];
    var HOSTILE = ['inject', 'sniff', 'forged'];

    var LANES = 3;
    var W = 640, H = 300;          // logical drawing space
    var packets = [];
    var served = 0, blocked = 0, breached = 0;
    var lastSpawn = 0, lastFrame = 0, raf = null, running = false;
    var colors = {};

    function readColors() {
      var cs = getComputedStyle(document.documentElement);
      colors.line = cs.getPropertyValue('--border-strong').trim();
      colors.faint = cs.getPropertyValue('--border').trim();
      colors.text = cs.getPropertyValue('--fg-subtle').trim();
      colors.ok = cs.getPropertyValue('--accent').trim();
      colors.bad = cs.getPropertyValue('--danger').trim();
      colors.surface = cs.getPropertyValue('--surface').trim();
      colors.strong = cs.getPropertyValue('--fg-muted').trim();
    }

    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      W = rect.width;
      H = rect.width * (30 / 64);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function laneY(i) {
      return H * (0.26 + i * 0.24);
    }

    function gateOn(key) {
      for (var i = 0; i < GATES.length; i++) {
        if (GATES[i].key === key) return GATES[i].on;
      }
      return true;
    }

    // Which x does this packet die at, if any?
    function stopX(kind) {
      for (var i = 0; i < GATES.length; i++) {
        if (GATES[i].stops === kind && GATES[i].on) return GATES[i].at;
      }
      return null;
    }

    function spawn(forceHostile) {
      if (packets.length > 60) return;
      var hostile = forceHostile || Math.random() < 0.34;
      var kind = hostile ? HOSTILE[(Math.random() * HOSTILE.length) | 0] : 'ok';
      packets.push({
        t: 0.02,
        lane: (Math.random() * LANES) | 0,
        kind: kind,
        dead: 0,
        // ~2.2–2.7s to cross: slow enough to follow, quick enough to feel live
        speed: 0.00031 + Math.random() * 0.00007
      });
    }

    function setCounts() {
      elServed.textContent = served;
      elBlocked.textContent = blocked;
      elBreached.textContent = breached;
      breachBox.classList.toggle('is-hit', breached > 0);
    }

    function announce() {
      var off = GATES.filter(function (g) { return !g.on; });
      if (!off.length) {
        stateEl.textContent = 'All gates up';
        wrap.classList.remove('is-alert');
      } else {
        stateEl.textContent = off.map(function (g) { return g.label; }).join(' + ') + ' down';
        wrap.classList.add('is-alert');
      }
    }

    function drawFrame() {
      ctx.clearRect(0, 0, W, H);

      // lanes
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.faint;
      for (var l = 0; l < LANES; l++) {
        var y = Math.round(laneY(l)) + 0.5;
        ctx.beginPath();
        ctx.moveTo(W * 0.06, y);
        ctx.lineTo(W * 0.84, y);
        ctx.stroke();
      }

      // gates
      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      for (var g = 0; g < GATES.length; g++) {
        var gx = Math.round(W * GATES[g].at) + 0.5;
        ctx.strokeStyle = GATES[g].on ? colors.strong : colors.bad;
        ctx.setLineDash(GATES[g].on ? [] : [3, 4]);
        ctx.lineWidth = GATES[g].on ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(gx, H * 0.14);
        ctx.lineTo(gx, H * 0.88);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = GATES[g].on ? colors.text : colors.bad;
        ctx.fillText(GATES[g].label, gx, H * 0.08);
      }

      // origin
      var ox = W * 0.86, ow = W * 0.1, oy = H * 0.28, oh = H * 0.44;
      ctx.lineWidth = 1;
      ctx.strokeStyle = breached > 0 ? colors.bad : colors.strong;
      ctx.fillStyle = colors.surface;
      ctx.beginPath();
      ctx.rect(Math.round(ox) + 0.5, Math.round(oy) + 0.5, Math.round(ow), Math.round(oh));
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = breached > 0 ? colors.bad : colors.text;
      ctx.fillText('ORIGIN', ox + ow / 2, oy - 6);

      // packets
      for (var p = 0; p < packets.length; p++) {
        var pk = packets[p];
        var x = W * pk.t;
        var y = laneY(pk.lane);
        var hostile = pk.kind !== 'ok';
        var alpha = pk.dead ? Math.max(0, 1 - pk.dead) : 1;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = hostile ? colors.bad : colors.ok;

        if (pk.dead) {
          // blocked: a small cross where it stopped
          ctx.strokeStyle = colors.bad;
          ctx.lineWidth = 1.4;
          var r = 4;
          ctx.beginPath();
          ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r);
          ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r);
          ctx.stroke();
        } else {
          ctx.fillRect(x - 3, y - 3, 6, 6);
          // short trail, so direction reads without motion blur
          ctx.globalAlpha = alpha * 0.28;
          ctx.fillRect(x - 13, y - 1, 9, 2);
        }
        ctx.globalAlpha = 1;
      }
    }

    function step(now) {
      if (!lastFrame) lastFrame = now;
      var dt = Math.min(now - lastFrame, 48);
      lastFrame = now;

      if (now - lastSpawn > 420) {
        spawn(false);
        lastSpawn = now;
      }

      for (var i = packets.length - 1; i >= 0; i--) {
        var pk = packets[i];

        if (pk.dead) {
          pk.dead += dt / 420;
          if (pk.dead >= 1) packets.splice(i, 1);
          continue;
        }

        pk.t += pk.speed * dt;

        var sx = stopX(pk.kind);
        if (sx !== null && pk.t >= sx) {
          pk.t = sx;
          pk.dead = 0.001;
          blocked++;
          setCounts();
          continue;
        }

        if (pk.t >= 0.86) {
          if (pk.kind === 'ok') served++;
          else breached++;
          setCounts();
          packets.splice(i, 1);
        }
      }

      drawFrame();
      raf = requestAnimationFrame(step);
    }

    function start() {
      if (running || reduceMotion.matches) return;
      running = true;
      lastFrame = 0;
      raf = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    /* --- static composition for reduced motion: one packet per lane, parked
       just before the gate that would stop it, so the idea still reads --- */
    function drawStatic() {
      packets = HOSTILE.map(function (kind, i) {
        var sx = stopX(kind);
        return { t: sx === null ? 0.8 : sx - 0.03, lane: i, kind: kind, dead: 0, speed: 0 };
      });
      packets.push({ t: 0.78, lane: 1, kind: 'ok', dead: 0, speed: 0 });
      drawFrame();
    }

    function refresh() {
      sizeCanvas();
      readColors();
      if (reduceMotion.matches) drawStatic();
      else drawFrame();
    }

    /* --- wiring --- */
    gateBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-gate');
        GATES.forEach(function (g) {
          if (g.key === key) g.on = !g.on;
        });
        btn.setAttribute('aria-pressed', String(gateOn(key)));
        announce();
        if (reduceMotion.matches) drawStatic();
      });
    });

    if (attackBtn) {
      attackBtn.addEventListener('click', function () {
        if (reduceMotion.matches) {
          // no stream to add to — resolve the burst against the gates directly
          HOSTILE.forEach(function (kind) {
            for (var n = 0; n < 3; n++) {
              if (stopX(kind) === null) breached++; else blocked++;
            }
          });
          setCounts();
          drawStatic();
          return;
        }
        for (var n = 0; n < 9; n++) {
          setTimeout(function () { spawn(true); }, n * 90);
        }
      });
    }

    // repaint on theme change — canvas colours are copied, not live
    new MutationObserver(refresh)
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refresh, 150);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (!reduceMotion.matches && onScreen) start();
    });

    // only run while it is actually on screen
    var onScreen = true;
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen && !document.hidden) start();
        else stop();
      }, { threshold: 0.05 }).observe(canvas);
    }

    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener('change', function () {
        stop();
        packets = [];
        refresh();
        if (!reduceMotion.matches) start();
      });
    }

    refresh();
    setCounts();
    if (!reduceMotion.matches) start();
  })();

  /* ==========================================================================
     Demo 1 — AURA hybrid burst
     HAProxy holds traffic on the on-premises node up to maxconn 50 and diverts
     the overflow to Azure Container Apps. The slider drives that same rule.
     ========================================================================== */
  (function burstDemo() {
    var demo = document.getElementById('burstDemo');
    var range = document.getElementById('loadRange');
    if (!demo || !range) return;

    var MAXCONN = 50;
    var out = document.getElementById('loadOut');
    var state = document.getElementById('burstState');
    var onpremLoad = document.getElementById('onpremLoad');
    var azureLoad = document.getElementById('azureLoad');
    var lastBursting = null;

    function render() {
      var total = parseInt(range.value, 10);
      var onprem = Math.min(total, MAXCONN);
      var azure = Math.max(total - MAXCONN, 0);
      var bursting = azure > 0;

      out.textContent = total;
      onpremLoad.textContent = onprem + ' / ' + MAXCONN;
      azureLoad.textContent = bursting ? azure + ' conn' : 'idle';
      demo.classList.toggle('is-bursting', bursting);

      // Only speak on the transition, not on every step of a slider drag.
      if (bursting !== lastBursting) {
        state.textContent = bursting ? 'Bursting to Azure' : 'On-premises';
        lastBursting = bursting;
      }
    }

    range.addEventListener('input', render);
    render();
  })();

  /* ==========================================================================
     Demo 2 — GEMP integrity chain
     Each record is signed and chained to its predecessor. Alter one and the
     verify walk stops there: everything after it can no longer be trusted,
     which is exactly what the platform's verification endpoint reports.
     ========================================================================== */
  (function chainDemo() {
    var demo = document.getElementById('chainDemo');
    if (!demo) return;

    var recs = Array.prototype.slice.call(demo.querySelectorAll('.rec'));
    var links = Array.prototype.slice.call(demo.querySelectorAll('.lnk'));
    var state = document.getElementById('chainState');
    var readout = document.getElementById('chainReadout');
    var resetBtn = document.getElementById('chainReset');
    var broken = 0; // 0 = intact, otherwise the 1-based index of the bad record

    function render() {
      recs.forEach(function (rec, i) {
        var n = i + 1;
        var status = 'ok';
        if (broken && n === broken) status = 'tampered';
        else if (broken && n > broken) status = 'unverified';

        if (status === 'ok') rec.removeAttribute('data-state');
        else rec.setAttribute('data-state', status);

        rec.setAttribute('aria-pressed', String(broken === n));
        rec.setAttribute('aria-label',
          'Record ' + String(n).padStart(2, '0') + ' — ' +
          (status === 'ok' ? 'verified' : status === 'tampered' ? 'altered' : 'unverifiable') +
          '. Activate to alter it.');
      });

      links.forEach(function (link, i) {
        var after = i + 1; // link sits between record i+1 and i+2
        if (broken && after === broken) link.setAttribute('data-state', 'broken');
        else if (broken && after > broken) link.setAttribute('data-state', 'unverified');
        else link.removeAttribute('data-state');
      });

      demo.classList.toggle('is-alert', broken > 0);

      if (!broken) {
        state.textContent = 'Chain intact';
        readout.innerHTML = 'walk: 01 &rarr; 02 &rarr; 03 &rarr; 04 &rarr; 05 &rarr; head&nbsp;&nbsp;ok';
      } else {
        var pad = String(broken).padStart(2, '0');
        state.textContent = 'Chain broken';
        readout.textContent = 'walk stopped at ' + pad +
          ' — hmac mismatch. ' + (5 - broken) + ' later record' +
          (5 - broken === 1 ? '' : 's') + ' cannot be trusted.';
      }
    }

    recs.forEach(function (rec) {
      rec.addEventListener('click', function () {
        var n = parseInt(rec.getAttribute('data-i'), 10);
        broken = (broken === n) ? 0 : n;
        render();
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        broken = 0;
        render();
        recs[0].focus();
      });
    }

    render();
  })();

  /* ---------- scrollspy ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.head-nav a'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && hasIO) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          var active = a.getAttribute('href') === '#' + entry.target.id;
          a.classList.toggle('is-active', active);
          if (active) {
            a.setAttribute('aria-current', 'true');
          } else {
            a.removeAttribute('aria-current');
          }
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { spy.observe(s); });
  }
})();
