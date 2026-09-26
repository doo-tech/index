(function () {
  'use strict';

  /* ---------- Header: borda ao fazer scroll ---------- */
  var header = document.querySelector('.site-header');
  var onScroll = function () { header && header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menu móvel ---------- */
  var menuBtn = document.querySelector('.menu-toggle');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    if (!menuBtn || !nav) return;
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- Link ativo na navegação ---------- */
  var links = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]:not(.btn)')) : [];
  if ('IntersectionObserver' in window && links.length) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var a = byId[entry.target.id];
        if (!a) return;
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) navObserver.observe(el);
    });
  }

  /* ---------- Bolhas de sabão ----------
     Cada contentor [data-bubbles] solta bolhas a partir de data-origin ("x y" em %).
     data-size (px), data-spread e data-rise (frações do contentor) são intervalos "mín máx";
     data-fill preenche as bolhas com a cor do traço.
     As bolhas enchem, sobem com um balanço lateral, deformam-se ligeiramente
     e acabam por desvanecer ou rebentar. */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnimate = typeof Element !== 'undefined' && 'animate' in Element.prototype;

  function rand(min, max) { return min + Math.random() * (max - min); }
  function nums(value, fallback) {
    var parts = (value || '').trim().split(/\s+/).map(Number);
    return parts.length === fallback.length && parts.every(isFinite) ? parts : fallback;
  }

  function BubbleField(el) {
    this.el = el;
    this.origin = nums(el.dataset.origin, [50, 50]);
    this.size = nums(el.dataset.size, [10, 40]);
    this.spread = nums(el.dataset.spread, [-0.35, 0.4]);
    this.rise = nums(el.dataset.rise, [0.3, 0.7]);
    this.colors = (el.dataset.palette || 'blue').split(/\s+/).map(function (c) { return 'var(--doo-' + c + ')'; });
    this.fill = 'fill' in el.dataset; // bolhas cheias em vez de anéis
    this.alive = [];
    this.running = false;
    this.timer = null;
  }

  BubbleField.prototype.spawn = function (progress) {
    var box = this.el.getBoundingClientRect();
    if (!box.width || this.alive.length > 10) return;

    var d = this.size[0] + (this.size[1] - this.size[0]) * Math.pow(Math.random(), 1.8);
    var b = document.createElement('span');
    b.className = 'bubble';
    b.style.width = b.style.height = d + 'px';
    b.style.borderWidth = (d / 4) + 'px';
    b.style.setProperty('--c', this.colors[Math.floor(Math.random() * this.colors.length)]);
    if (this.fill) b.style.background = 'var(--c)';
    this.el.appendChild(b);

    var ox = box.width * (this.origin[0] + rand(-2, 2)) / 100 - d / 2;
    var oy = box.height * (this.origin[1] + rand(-2, 2)) / 100 - d / 2;
    var driftX = box.width * rand(this.spread[0], this.spread[1]);
    var rise = box.height * rand(this.rise[0], this.rise[1]);
    var sway = rand(6, 18);
    var cycles = rand(0.8, 2);
    var phase = rand(0, Math.PI * 2);
    var wobble = rand(2.5, 4.5);
    var pops = Math.random() < 0.55;
    var duration = rand(5500, 9500) + d * 60;

    var frames = [];
    var steps = 30;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var push = 1 - Math.pow(1 - t, 1.8);                       // sai do soprador e abranda
      var x = ox + driftX * push + Math.sin(t * cycles * Math.PI * 2 + phase) * sway * t;
      var y = oy - rise * (0.55 * push + 0.45 * t);               // flutua para cima
      var grow = t < 0.12 ? 0.15 + 0.95 * (t / 0.12) : 1 + 0.1 * Math.max(0, 0.2 - t); // enche
      var w = 0.045 * Math.sin(t * wobble * Math.PI * 2 + phase);
      var opacity = t < 0.06 ? t / 0.06 : 1;
      if (pops) { if (t > 0.96) { grow *= 1.3; opacity = 0; } }
      else if (t > 0.78) opacity = Math.max(0, (1 - t) / 0.22);
      frames.push({
        transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' +
          (grow * (1 + w)).toFixed(3) + ',' + (grow * (1 - w)).toFixed(3) + ')',
        opacity: opacity * 0.95
      });
    }

    var anim = b.animate(frames, { duration: duration, easing: 'linear', fill: 'both' });
    if (progress) anim.currentTime = duration * progress;
    if (!this.running) anim.pause();
    var alive = this.alive;
    alive.push(anim);
    anim.onfinish = function () {
      b.remove();
      alive.splice(alive.indexOf(anim), 1);
    };
  };

  BubbleField.prototype.schedule = function () {
    var self = this;
    this.timer = setTimeout(function () {
      if (!self.running) return;
      var burst = Math.random() < 0.3 ? Math.round(rand(2, 4)) : 1; // um sopro pode soltar várias
      for (var i = 0; i < burst; i++) setTimeout(function () { if (self.running) self.spawn(); }, i * rand(110, 240));
      self.schedule();
    }, rand(600, 1500));
  };

  BubbleField.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.alive.forEach(function (a) { a.play(); });
    this.schedule();
  };

  BubbleField.prototype.stop = function () {
    this.running = false;
    clearTimeout(this.timer);
    this.alive.forEach(function (a) { a.pause(); });
  };

  if (!reduceMotion && canAnimate) {
    document.querySelectorAll('[data-bubbles]').forEach(function (el) {
      var field = new BubbleField(el);
      el.classList.add('bubbles-live');
      field.running = true;
      for (var i = 0; i < 5; i++) field.spawn(rand(0.1, 0.8)); // a cena já começa em movimento
      field.running = false;

      var inView = !('IntersectionObserver' in window);
      var update = function () { inView && !document.hidden ? field.start() : field.stop(); };
      if (!inView) {
        new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; update(); }).observe(el);
      }
      document.addEventListener('visibilitychange', update);
      update();
    });
  }

  /* ---------- Revelar ao fazer scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- "Saber mais" pré-seleciona a frente no formulário ---------- */
  document.querySelectorAll('[data-front]').forEach(function (a) {
    a.addEventListener('click', function () {
      var box = document.querySelector('.choice input[data-key="' + a.dataset.front + '"]');
      if (box) box.checked = true;
    });
  });

  /* ---------- Formulário de contacto ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = form.querySelector('.form-status');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function check(input) {
      var ok = input.type === 'email' ? emailRe.test(input.value.trim()) : input.value.trim().length > 0;
      var err = document.getElementById(input.getAttribute('aria-describedby'));
      input.setAttribute('aria-invalid', String(!ok));
      if (err) err.classList.toggle('is-visible', !ok);
      return ok;
    }

    form.querySelectorAll('[required]').forEach(function (input) {
      input.addEventListener('blur', function () { if (input.value) check(input); });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') check(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));
      var invalid = required.filter(function (input) { return !check(input); });
      if (invalid.length) {
        status.className = 'form-status is-error';
        status.textContent = 'Reveja os campos assinalados.';
        invalid[0].focus();
        return;
      }

      var data = new FormData(form);
      var fronts = data.getAll('frente');
      var body = [
        'Nome: ' + data.get('nome'),
        'Email: ' + data.get('email'),
        data.get('empresa') ? 'Empresa: ' + data.get('empresa') : '',
        fronts.length ? 'Frentes: ' + fronts.join(', ') : '',
        '',
        data.get('mensagem')
      ].filter(function (l, i) { return l !== '' || i === 4; }).join('\n');

      var subject = 'Novo projeto' + (data.get('empresa') ? ' · ' + data.get('empresa') : '');
      window.location.href = 'mailto:' + form.dataset.mailto +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      status.className = 'form-status is-success';
      status.textContent = 'Obrigado! Abrimos o seu email para concluir o envio.';
    });
  }

  /* ---------- Ano no rodapé ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
