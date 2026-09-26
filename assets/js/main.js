(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- Tema (creme / oliva) ---------- */
  var themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var current = root.dataset.theme || 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('doo-theme', next); } catch (e) {}
    });
  }

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
