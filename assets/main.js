/* healcore — общий скрипт сайта */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  var USER = 'healcore';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- навигация ---------- */
  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.burger');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('.nav-menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- прокрутка: граница меню, прогресс, «наверх» ---------- */
  var progress = document.querySelector('.progress');
  var toTop = document.querySelector('.to-top');
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 8);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    if (toTop) toTop.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------- плавное появление ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) {
      var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(sibs, 5) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- подсветка карточек за курсором ---------- */
  document.querySelectorAll('.card, .contact-card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- печатающийся текст ---------- */
  var typed = document.querySelector('[data-typed]');
  if (typed) {
    var phrases = JSON.parse(typed.getAttribute('data-typed'));
    var out = typed.querySelector('.txt');
    if (reduce) { out.textContent = phrases[0]; }
    else {
      var pi = 0, ci = 0, del = false;
      (function tick() {
        var p = phrases[pi];
        out.textContent = p.slice(0, ci);
        if (!del && ci < p.length) { ci++; setTimeout(tick, 55); }
        else if (!del) { del = true; setTimeout(tick, 2200); }
        else if (ci > 0) { ci--; setTimeout(tick, 28); }
        else { del = false; pi = (pi + 1) % phrases.length; setTimeout(tick, 350); }
      })();
    }
  }

  /* ---------- счётчики ---------- */
  function countTo(el, to) {
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = to + suffix; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(to * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          countTo(e.target, parseInt(e.target.getAttribute('data-count'), 10));
          co.unobserve(e.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ---------- фильтр проектов ---------- */
  var filters = document.querySelectorAll('.filter');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.classList.toggle('active', b === btn); });
      document.querySelectorAll('[data-lang]').forEach(function (card) {
        var show = f === 'all' || card.getAttribute('data-lang') === f || (card.getAttribute('data-tags') || '').indexOf(f) !== -1;
        card.classList.toggle('hide', !show);
      });
    });
  });

  /* ---------- копирование ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var txt = btn.getAttribute('data-copy');
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () {
        var old = btn.textContent; btn.textContent = 'Скопировано';
        setTimeout(function () { btn.textContent = old; }, 1600);
      }).catch(function () {});
    });
  });

  /* ---------- год ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- живые данные GitHub ---------- */
  var needLive = document.querySelector('[data-live]');
  if (needLive && window.fetch) {
    var cacheKey = 'hc_repos_v1';
    var cached = null;
    try {
      cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
      if (cached && Date.now() - cached.t > 10 * 60 * 1000) cached = null;
    } catch (e) { cached = null; }

    var got = cached ? Promise.resolve(cached.d) :
      fetch('https://api.github.com/users/' + USER + '/repos?per_page=100&sort=updated')
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function (d) {
          try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
          return d;
        });

    got.then(function (repos) {
      if (!Array.isArray(repos)) return;
      var own = repos.filter(function (r) { return !r.fork; });
      var stars = 0, forks = 0;
      own.forEach(function (r) {
        stars += r.stargazers_count; forks += r.forks_count;
        document.querySelectorAll('[data-repo="' + r.name + '"]').forEach(function (scope) {
          set(scope, '[data-f="stars"]', r.stargazers_count);
          set(scope, '[data-f="forks"]', r.forks_count);
          set(scope, '[data-f="issues"]', r.open_issues_count);
          set(scope, '[data-f="updated"]', fmtDate(r.pushed_at));
          set(scope, '[data-f="created"]', fmtDate(r.created_at));
          if (r.license && r.license.spdx_id && r.license.spdx_id !== 'NOASSERTION') set(scope, '[data-f="license"]', r.license.spdx_id);
          if (r.homepage) {
            var hp = scope.querySelector('[data-f="homepage"]');
            if (hp) { hp.href = r.homepage; hp.hidden = false; }
          }
        });
      });
      setLive('repos', own.length);
      setLive('stars', stars);
      setLive('forks', forks);
    }).catch(function () { /* оставляем статичные значения */ });
  }
  function set(scope, sel, val) {
    scope.querySelectorAll(sel).forEach(function (el) { el.textContent = val; });
  }
  function setLive(key, val) {
    document.querySelectorAll('[data-live="' + key + '"]').forEach(function (el) {
      el.setAttribute('data-count', val);
      el.textContent = val;
    });
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).replace(' г.', '');
    } catch (e) { return iso.slice(0, 10); }
  }

  /* ---------- README проекта ---------- */
  var readme = document.querySelector('[data-readme]');
  if (readme && window.fetch) {
    var repo = readme.getAttribute('data-readme');
    fetch('https://api.github.com/repos/' + USER + '/' + repo + '/readme', {
      headers: { Accept: 'application/vnd.github.html+json' }
    })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function (html) {
        var tpl = document.createElement('template');
        tpl.innerHTML = html;
        // очистка: убираем скрипты, обработчики и опасные ссылки
        tpl.content.querySelectorAll('script, style, iframe, object, embed, form').forEach(function (n) { n.remove(); });
        tpl.content.querySelectorAll('*').forEach(function (n) {
          Array.prototype.slice.call(n.attributes).forEach(function (a) {
            if (/^on/i.test(a.name)) n.removeAttribute(a.name);
            if ((a.name === 'href' || a.name === 'src') && /^\s*javascript:/i.test(a.value)) n.removeAttribute(a.name);
          });
        });
        // относительные ссылки и картинки ведём на GitHub
        var base = 'https://github.com/' + USER + '/' + repo + '/blob/HEAD/';
        var raw = 'https://raw.githubusercontent.com/' + USER + '/' + repo + '/HEAD/';
        tpl.content.querySelectorAll('img[src]').forEach(function (img) {
          var s = img.getAttribute('src');
          if (!/^(https?:|data:)/.test(s)) img.setAttribute('src', raw + s.replace(/^\.?\//, ''));
          img.setAttribute('loading', 'lazy');
        });
        tpl.content.querySelectorAll('a[href]').forEach(function (a) {
          var h = a.getAttribute('href');
          if (h.charAt(0) === '#') return;
          if (!/^(https?:|mailto:)/.test(h)) a.setAttribute('href', base + h.replace(/^\.?\//, ''));
          a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener');
        });
        var article = tpl.content.querySelector('article');
        var body = readme.querySelector('.markdown');
        body.innerHTML = '';
        body.appendChild(article ? article : tpl.content);
      })
      .catch(function () {
        readme.querySelector('.markdown').innerHTML =
          '<p>README пока не опубликован или GitHub временно недоступен.</p>' +
          '<p><a href="https://github.com/' + USER + '/' + repo + '" target="_blank" rel="noopener">Открыть репозиторий на GitHub →</a></p>';
      });
  }
})();
