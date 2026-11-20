/* Lithika Jadav Malothu — doodle portfolio interactions */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- swap text with a soft fade ---------- */
  function swap(el, html) {
    if (!el) return;
    if (reduce) { el.innerHTML = html; return; }
    el.classList.add('out');
    setTimeout(function () { el.innerHTML = html; el.classList.remove('out'); }, 200);
  }
  function bump(el) {
    if (!el) return;
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }

  /* ---------- draw-on doodles: normalise path lengths ---------- */
  $$('svg.draw').forEach(function (svg) {
    $$('path, circle, line, polyline, rect', svg).forEach(function (p) { p.setAttribute('pathLength', '1'); });
  });

  /* ---------- scroll reveal ---------- */
  var revealables = $$('[data-reveal], svg.draw');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var el = e.target;
          el.classList.add('in');
          countUp(el);
          if (el.hasAttribute('data-reveal')) {
            var i = parseFloat(getComputedStyle(el).getPropertyValue('--i')) || 0;
            setTimeout(function () { el.removeAttribute('data-reveal'); }, 1200 + i * 90);
          }
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- count-up numbers ---------- */
  function countUp(scope) {
    $$('[data-count]', scope).concat(scope.hasAttribute && scope.hasAttribute('data-count') ? [scope] : []).forEach(function (el) {
      if (el.dataset.counted || el.closest('.proj:not(.open)')) return;
      el.dataset.counted = '1';
      var text = el.textContent;
      var m = text.match(/[\d,]*\.?\d+/);
      if (!m || reduce) return;
      var raw = m[0], target = parseFloat(raw.replace(/,/g, ''));
      var decimals = (raw.split('.')[1] || '').length;
      var commas = raw.indexOf(',') > -1;
      var pre = text.slice(0, m.index), post = text.slice(m.index + raw.length);
      var start = null, dur = 1300;
      function fmt(v) {
        var s = v.toFixed(decimals);
        if (commas) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        return pre + s + post;
      }
      function tick(t) {
        if (!start) start = t;
        var k = Math.min(1, (t - start) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(target * e);
        if (k < 1) requestAnimationFrame(tick); else el.textContent = text;
      }
      el.textContent = fmt(0);
      requestAnimationFrame(tick);
    });
  }

  /* ---------- scroll "charge" bar ---------- */
  var bar = $('.charge-bar');
  if (bar) {
    var ticking = false;
    var update = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
      ticking = false;
    };
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- page-leave fallback when cross-document view transitions are unsupported ---------- */
  var hasVT = window.CSS && CSS.supports && CSS.supports('view-transition-name: none') && ('onpagereveal' in window);
  if (!hasVT && !reduce) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname || url.hash && url.pathname === location.pathname) return;
      e.preventDefault();
      document.body.classList.add('is-leaving');
      setTimeout(function () { location.href = url.href; }, 260);
    });
    addEventListener('pageshow', function () { document.body.classList.remove('is-leaving'); });
  }

  /* ================= HOME ================= */

  /* donut "O" that loads data */
  var donut = $('#donut');
  if (donut) {
    var level = 1;
    var msgs = ['no data yet', 'loading data…', 'cleaning it up', 'training the model', 'model ready!'];
    var hint = $('#donut-msg');
    var setDonut = function () {
      donut.style.setProperty('--pct', (level * 25) + '%');
      if (hint) hint.textContent = (level * 25) + '%, ' + msgs[level];
    };
    donut.addEventListener('click', function () { level = (level + 1) % 5; setDonut(); bump(donut); });
    setDonut();
  }

  /* pointer parallax on the polaroid */
  var hero = $('.hero');
  var pol = $('.polaroid');
  if (hero && pol && !reduce && matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      pol.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5).toFixed(3));
      pol.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5).toFixed(3));
    });
    hero.addEventListener('pointerleave', function () { pol.style.setProperty('--mx', 0); pol.style.setProperty('--my', 0); });
  }

  /* tool chips */
  var toolNote = $('#tool-note');
  $$('.tool').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') === 'true';
      $$('.tool').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', on ? 'false' : 'true');
      swap(toolNote, on ? 'tap a tool to see what I use it for ↑' : btn.dataset.note);
    });
  });

  /* ================= WORK ================= */
  $$('.proj-head').forEach(function (head) {
    head.addEventListener('click', function () {
      var card = head.closest('.proj');
      var open = !card.classList.contains('open');
      card.classList.toggle('open', open);
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) setTimeout(function () { countUp(card); }, 250);
    });
  });

  var verdict = $('#verdict');
  $$('.row-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.row-btn').forEach(function (b) { b.classList.remove('right', 'wrong'); b.setAttribute('aria-pressed', 'false'); });
      void btn.offsetWidth;
      btn.classList.add(btn.dataset.ok === 'true' ? 'wrong' : 'right');
      btn.setAttribute('aria-pressed', 'true');
      swap(verdict, btn.dataset.why);
    });
  });

  /* ================= ABOUT ================= */
  var topicText = $('#topic-text');
  $$('.topic').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.topic').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      swap(topicText, btn.dataset.text);
    });
  });

  var stepTitle = $('#step-title'), stepText = $('#step-text');
  $$('.step').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.step').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      swap(stepTitle, btn.dataset.title);
      swap(stepText, btn.dataset.text);
    });
  });

  var countEl = $('#done-count');
  var todos = $$('.todo');
  todos.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (countEl) {
        countEl.textContent = todos.filter(function (t) { return t.getAttribute('aria-pressed') === 'true'; }).length;
        bump(countEl.parentNode);
      }
    });
  });
})();
