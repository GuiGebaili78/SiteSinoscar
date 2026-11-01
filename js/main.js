/* Sinoscar Autoelétrica — interações e animações */
(() => {
  const header = document.querySelector('.header');
  const progress = document.querySelector('.scroll-progress');
  const bgGear = document.querySelector('.bg-gear');
  const sectionGear = document.querySelector('.section__gear');

  document.getElementById('ano').textContent = new Date().getFullYear();

  /* Rolagem: cabeçalho, barra de progresso e engrenagens girando */
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', y > 30);
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    bgGear.style.transform = `rotate(${y * 0.15}deg)`;
    if (sectionGear) sectionGear.style.transform = `rotate(${-y * 0.1}deg)`;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* Menu mobile */
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* Revelar elementos ao rolar (com atraso escalonado por grupo) */
  document.querySelectorAll('.cards, .steps, .hero__content').forEach((group) => {
    group.querySelectorAll(':scope > .reveal').forEach((el, i) => el.style.setProperty('--d', `${i * 0.12}s`));
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      /* Terminada a entrada, tira .reveal para o hover voltar a usar a transição do próprio elemento */
      el.addEventListener('transitionend', function done(ev) {
        if (ev.target !== el) return;
        el.classList.remove('reveal');
        el.removeEventListener('transitionend', done);
      });
      el.classList.add('is-visible');
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* Contadores */
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.target;
      const start = performance.now();
      const step = (t) => {
        const p = Math.min((t - start) / 1200, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      counterIO.unobserve(el);
    });
  });
  document.querySelectorAll('.counter').forEach((el) => counterIO.observe(el));

  /* Destaque do menu conforme a seção visível */
  const links = [...document.querySelectorAll('.nav a[href^="#"]')];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${e.target.id}`));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('section[id]').forEach((s) => spy.observe(s));

  /* Efeito 3D na foto do hero */
  const tilt = document.querySelector('[data-tilt]');
  if (tilt && window.matchMedia('(hover: hover)').matches) {
    tilt.addEventListener('mousemove', (e) => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    });
    tilt.addEventListener('mouseleave', () => { tilt.style.transform = ''; });
  }

  /* Brilho que segue o mouse nos cards */
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* Carrossel das peças: esteira que anda devagar o tempo todo e espera enquanto alguém interage com ela */
  const carousel = document.querySelector('.carousel');
  const gallery = carousel.querySelector('.gallery');

  /* Cópias no fim emendam o último item no primeiro; leitores de tela e o Tab só veem os originais */
  [...gallery.children].forEach((item) => {
    const copy = item.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.tabIndex = -1;
    gallery.append(copy);
  });

  const shown = () => [...gallery.children].filter((el) => !el.classList.contains('is-hidden'));
  const jump = (left) => gallery.scrollTo({ left, behavior: 'instant' });
  const loopWidth = () => {
    const all = shown();
    return all[all.length / 2].offsetLeft - all[0].offsetLeft;
  };
  /* Ao chegar nas cópias, volta para os originais idênticos sem que se perceba */
  const wrap = () => {
    const loop = loopWidth();
    if (gallery.scrollLeft >= loop) jump(gallery.scrollLeft - loop);
  };
  const move = (dir) => {
    if (dir > 0) wrap();
    else if (gallery.scrollLeft < 1) jump(loopWidth());
    const [a, b] = shown();
    gallery.scrollBy({ left: dir * (b.offsetLeft - a.offsetLeft), behavior: 'smooth' });
  };

  let holdUntil = 0;
  const hold = () => { holdUntil = Date.now() + 5000; };
  carousel.querySelector('.carousel__btn--prev').addEventListener('click', () => { hold(); move(-1); });
  carousel.querySelector('.carousel__btn--next').addEventListener('click', () => { hold(); move(1); });
  gallery.addEventListener('touchstart', hold, { passive: true });
  gallery.addEventListener('touchend', hold, { passive: true });

  let settle;
  gallery.addEventListener('scroll', () => {
    clearTimeout(settle);
    settle = setTimeout(wrap, 150);
  }, { passive: true });

  let inView = false;
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    /* Com lazy, as fotos ainda fora do carrossel só carregariam ao entrar nele, piscando em branco */
    if (inView) gallery.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; });
  }, { rootMargin: '300px 0px' }).observe(carousel);

  /* 30px por segundo. A posição guarda a fração porque o navegador arredonda scrollLeft para pixel inteiro */
  const canHover = window.matchMedia('(hover: hover)').matches;
  let pos = 0;
  let last = performance.now();
  const drift = (now) => {
    const elapsed = Math.min(now - last, 100);
    last = now;
    const busy = Date.now() < holdUntil || (canHover && carousel.matches(':hover')) || carousel.querySelector(':focus-visible');
    if (inView && !busy) {
      wrap();
      /* Se o dedo, as setas ou o filtro mudaram a posição, continua de onde parou */
      if (Math.abs(gallery.scrollLeft - pos) > 1) pos = gallery.scrollLeft;
      pos += elapsed * 0.03;
      gallery.scrollLeft = pos;
    }
    requestAnimationFrame(drift);
  };
  requestAnimationFrame(drift);

  /* Filtro das peças (uma peça pode ter mais de uma categoria) */
  const chips = document.querySelectorAll('.chip');
  const items = document.querySelectorAll('.gallery__item');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    chips.forEach((c) => {
      c.classList.toggle('is-active', c === chip);
      c.setAttribute('aria-pressed', String(c === chip));
    });
    const f = chip.dataset.filter;
    items.forEach((it) => it.classList.toggle('is-hidden', f !== 'all' && !it.dataset.cat.split(' ').includes(f)));
    jump(0);
  }));
})();
