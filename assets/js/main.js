/* ==========================================================
   爱弥斯 应援站 · main.js
   ========================================================== */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const D = window.DATA, T = window.I18N;
  const LANGS = ['zh', 'ja', 'en'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem('ams.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('ams.' + k, JSON.stringify(v)); } catch {} }
  };

  /* ---------- 语言 ---------- */
  let lang = store.get('lang', null) || (/^ja/i.test(navigator.language) ? 'ja' : /^zh/i.test(navigator.language) ? 'zh' : 'en');
  const li = () => LANGS.indexOf(lang);
  const L = arr => Array.isArray(arr) ? (arr[li()] ?? arr[2]) : arr;
  const t = key => T[key] ? L(T[key]) : key;
  const listeners = [];
  const onLang = fn => { listeners.push(fn); fn(); };

  /* 语音语言独立于界面语言（语音档案、多语言版本歌曲都跟随它） */
  let vlang = store.get('vlang', null) || lang;
  const vli = () => LANGS.indexOf(vlang);
  const vlisteners = [];
  const onVlang = fn => vlisteners.push(fn);
  function applyVlang(next) {
    vlang = next; store.set('vlang', vlang);
    $$('[data-setvlang]').forEach(b => b.classList.toggle('on', b.dataset.setvlang === vlang));
    vlisteners.forEach(fn => fn());
  }
  $$('[data-setvlang]').forEach(b => b.addEventListener('click', () => applyVlang(b.dataset.setvlang)));

  function applyLang(next) {
    lang = next; store.set('lang', lang);
    document.documentElement.lang = { zh: 'zh-CN', ja: 'ja', en: 'en' }[lang];
    document.documentElement.dataset.lang = lang;
    $$('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
    $$('.sec-no').forEach((el, i) => { el.textContent = `${String(i + 1).padStart(2, '0')} / ${el.textContent}`; });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $$('[data-glitch]').forEach(el => { el.dataset.text = el.textContent; });
    $$('[data-setlang]').forEach(b => b.classList.toggle('on', b.dataset.setlang === lang));
    document.title = { zh: '爱弥斯 应援站 | Aemeath Unofficial Fan Site', ja: 'エイメス 応援サイト | Aemeath Unofficial Fan Site', en: 'Aemeath Unofficial Fan Site | 爱弥斯 · エイメス' }[lang];
    listeners.forEach(fn => fn());
  }
  $$('[data-setlang]').forEach(b => b.addEventListener('click', () => applyLang(b.dataset.setlang)));

  /* ---------- 小工具 ---------- */
  const toastEl = $('#toast'); let toastTimer;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600); }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Date().toLocaleDateString('sv-SE');
  const thumb = id => `assets/img/yt/${id}.webp`;
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  /* 按英文曲名找到飞行雪绒的官方曲目（演唱版优先） */
  const trackKeyByTitle = title => {
    for (const r of window.ITUNES || []) for (const x of r.tracks) if (x.t[2] === title) return `${r.id}-${x.no}`;
    return null;
  };
  const vById = id => D.videos.find(v => v.id === id);
  /* 不能嵌入 YouTube 的托管环境（如 claude.ai artifact）：视频改为外链 */
  const NO_EMBED = !!window.AMS_NO_EMBED;
  const ytUrl = id => `https://www.youtube.com/watch?v=${id}`;
  const act = (id, cls, inner, extra = '') => NO_EMBED
    ? `<a class="${cls}" href="${ytUrl(id)}" target="_blank" rel="noopener" ${extra}>${inner}</a>`
    : `<button class="${cls}" data-play="${id}" ${extra}>${inner}</button>`;
  if (NO_EMBED) {
    document.documentElement.classList.add('no-embed');
    $$('[data-play]').forEach(el => {
      const id = el.dataset.play;
      const a = document.createElement('a');
      a.className = el.className; a.innerHTML = el.innerHTML; a.href = ytUrl(id); a.target = '_blank'; a.rel = 'noopener';
      el.replaceWith(a);
    });
  }

  /* ---------- 加载 ---------- */
  (function loader() {
    const el = $('#loader'), bar = $('#loaderBar'), pct = $('#loaderPct');
    if (!el) return;
    let seen = false; try { seen = !!sessionStorage.getItem('ams.seen'); } catch {}
    const dur = seen ? 500 : 2000;
    const start = performance.now(); let done = false;
    const finish = () => { if (done) return; done = true; el.classList.add('done'); try { sessionStorage.setItem('ams.seen', 1); } catch {} document.body.classList.add('ready'); };
    (function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      bar.style.width = (p * 100) + '%'; pct.textContent = Math.round(p * 100);
      p < 1 ? requestAnimationFrame(tick) : setTimeout(finish, 250);
    })(start);
    $('#loaderSkip').addEventListener('click', finish);
  })();

  /* ---------- 星空 + 落雪 ---------- */
  (function sky() {
    const c = $('#sky'), x = c.getContext('2d');
    let W, H, dpr, stars = [], snow = [], shoots = [], mx = 0, my = 0, accent = '#ff9ad5';
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
      c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(W * H / 5200);
      stars = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + .2, p: Math.random() * 6.28, s: Math.random() * .02 + .005, z: Math.random() * .8 + .2 }));
      snow = Array.from({ length: Math.round(n / 4) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .6, v: Math.random() * .4 + .15, w: Math.random() * 6.28 }));
    }
    size(); addEventListener('resize', size);
    addEventListener('pointermove', e => { mx = e.clientX / W - .5; my = e.clientY / H - .5; });
    setInterval(() => { accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || accent; }, 800);
    function frame() {
      x.clearRect(0, 0, W, H);
      const sy = scrollY * .03;
      for (const s of stars) {
        s.p += s.s; const a = .35 + Math.sin(s.p) * .35;
        const px = (s.x - mx * 30 * s.z + W) % W, py = ((s.y - sy * s.z - my * 20 * s.z) % H + H) % H;
        x.globalAlpha = a; x.fillStyle = s.r > 1.2 ? accent : '#dfe6ff';
        x.beginPath(); x.arc(px, py, s.r, 0, 6.283); x.fill();
      }
      x.fillStyle = '#ffffff';
      for (const f of snow) {
        f.y += f.v; f.w += .01; f.x += Math.sin(f.w) * .3;
        if (f.y > H) { f.y = -5; f.x = Math.random() * W; }
        x.globalAlpha = .45; x.beginPath(); x.arc(f.x, f.y, f.r, 0, 6.283); x.fill();
      }
      if (Math.random() < .004) shoots.push({ x: Math.random() * W * .8 + W * .2, y: Math.random() * H * .4, l: 0 });
      for (const s of shoots) {
        s.l += 14; const g = x.createLinearGradient(s.x - s.l, s.y + s.l * .45, s.x, s.y);
        g.addColorStop(0, 'transparent'); g.addColorStop(1, accent);
        x.globalAlpha = Math.max(0, 1 - s.l / 500); x.strokeStyle = g; x.lineWidth = 1.5;
        x.beginPath(); x.moveTo(s.x - s.l, s.y + s.l * .45); x.lineTo(s.x - s.l + 120, s.y + s.l * .45 - 54); x.stroke();
      }
      shoots = shoots.filter(s => s.l < 500);
      x.globalAlpha = 1;
      if (!reduce) requestAnimationFrame(frame);
    }
    frame();
  })();

  /* ---------- 光标 ---------- */
  (function cursor() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || reduce) return;
    document.body.classList.add('has-cursor');
    const cur = $('#cursor'); let last = 0;
    addEventListener('pointermove', e => {
      cur.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      const now = performance.now();
      if (now - last > 40) {
        last = now; const d = document.createElement('i'); d.className = 'trail';
        d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px';
        document.body.appendChild(d); setTimeout(() => d.remove(), 700);
      }
    });
    document.addEventListener('pointerover', e => cur.classList.toggle('big', !!e.target.closest('a, button, .masonry figure, .unmask')));
  })();

  /* ---------- 顶栏 / 进度 / 导航高亮 ---------- */
  const topbar = $('.topbar'), prog = $('#progress');
  addEventListener('scroll', () => {
    topbar.classList.toggle('scrolled', scrollY > 40);
    prog.style.width = (scrollY / (document.documentElement.scrollHeight - innerHeight) * 100) + '%';
  }, { passive: true });
  $('#burger').addEventListener('click', () => $('#nav').classList.toggle('open'));
  $$('#nav a').forEach(a => a.addEventListener('click', () => $('#nav').classList.remove('open')));
  const navIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) $$('#nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section').forEach(s => navIO.observe(s));

  /* ---------- 滚动显现 ---------- */
  const revealIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }), { threshold: .12 });
  const observeReveal = root => $$('.reveal:not(.in)', root).forEach(el => revealIO.observe(el));

  /* ---------- 故障闪烁 ---------- */
  if (!reduce) setInterval(() => {
    const els = $$('[data-glitch]'); const el = els[Math.floor(Math.random() * els.length)];
    if (!el) return; el.classList.add('glitching'); setTimeout(() => el.classList.remove('glitching'), 160 + Math.random() * 200);
  }, 2200);

  /* ---------- 首屏 ---------- */
  (function hero() {
    const days = Math.floor((Date.now() - new Date(D.releaseDate + 'T00:00:00+08:00')) / 864e5);
    $('#daysSince').textContent = Math.max(0, days);
    const vl = $('#voiceLine'); let vi = 0;
    const showVoice = () => { vl.style.opacity = 0; setTimeout(() => { vl.textContent = L(D.voiceLines[vi % D.voiceLines.length]); vl.style.opacity = 1; }, 300); };
    onLang(showVoice); setInterval(() => { vi++; showVoice(); }, 4200);
    const sprite = $('#heroSprite'), vis = $('#heroVisual');
    if (!reduce) {
      addEventListener('pointermove', e => {
        const dx = e.clientX / innerWidth - .5, dy = e.clientY / innerHeight - .5;
        vis.style.transform = `translate(${dx * -18}px, ${dy * -12}px)`;
      });
      setInterval(() => { sprite.classList.add('flicker'); setTimeout(() => sprite.classList.remove('flicker'), 400); }, 5200);
    }
    const mq = $('#marquee'); const items = D.marquee.map(s => `<span>${esc(s)}</span>`).join('');
    mq.innerHTML = items + items;
  })();

  /* ---------- 视频卡片 & 弹窗 ---------- */
  function vcard(v, extra = '') {
    return act(v.id, 'vcard', `<div class="vthumb"><img src="${thumb(v.id)}" alt="" loading="lazy"></div>
      <div class="vmeta"><p>${esc(L(v.t))}</p><small>${v.date || ''}${extra}</small></div>`, `data-title="${esc(L(v.t))}"`);
  }
  const vmodal = $('#vmodal'), vframe = $('#vframe');
  /* YouTube 的「请登录以确认你不是机器人」是对观看者网络（常见于 VPN / 代理）的风控：
     用 youtube.com（而非 nocookie）嵌入，浏览器里已登录的 YouTube 账号才能通过验证；
     有官方 B 站同款时可一键换源，国内无需代理 */
  function openVideo(id, title) {
    music.pause(); voice.stop();
    const v = vById(id) || { id };
    let src = v.bili ? store.get('vsrc', lang === 'zh' ? 'bili' : 'yt') : 'yt';
    const show = which => {
      src = which;
      const url = which === 'bili'
        ? `https://player.bilibili.com/player.html?bvid=${v.bili}&autoplay=1&high_quality=1&danmaku=0`
        : `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1&origin=${encodeURIComponent(location.origin)}`;
      vframe.innerHTML = `<iframe src="${url}" title="${esc(title || '')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen${which === 'bili' ? ' sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"' : ''}></iframe>`;
      const zh = v.t ? v.t[0] : title;
      $('#vcap').innerHTML = (v.bili ? `<span class="vsrc"><button data-vs="yt" class="${which === 'yt' ? 'on' : ''}">YouTube</button><button data-vs="bili" class="${which === 'bili' ? 'on' : ''}">${t('v.bili')}</button></span>` : '') +
        `<span class="vcap-t">${esc(title || '')}</span> · <a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">YouTube ↗</a> · ` +
        (v.bili ? `<a href="https://www.bilibili.com/video/${v.bili}" target="_blank" rel="noopener">${t('v.bili')} ↗</a>`
          : `<a href="https://search.bilibili.com/all?keyword=${encodeURIComponent('鸣潮 ' + zh)}" target="_blank" rel="noopener">${t('v.biliSearch')} ↗</a>`) +
        (which === 'yt' ? `<small class="vhelp">${t(v.bili ? 'v.help' : 'v.helpNoBili')}</small>` : '');
    };
    $('#vcap').onclick = e => { const b = e.target.closest('[data-vs]'); if (b) { store.set('vsrc', b.dataset.vs); show(b.dataset.vs); } };
    show(src);
    openModal(vmodal);
  }
  function openModal(m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeModal(m) {
    m.classList.remove('open'); document.body.style.overflow = '';
    if (m === vmodal) vframe.innerHTML = '';
    if (m.id === 'blocks') blocks.stop();
  }
  $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(m); }));
  addEventListener('keydown', e => {
    if (e.key === 'Escape') $$('.modal.open').forEach(closeModal);
    if ($('#lightbox').classList.contains('open')) { if (e.key === 'ArrowRight') lb.step(1); if (e.key === 'ArrowLeft') lb.step(-1); }
  });
  document.addEventListener('click', e => {
    const p = e.target.closest('[data-play]');
    if (p) { const v = vById(p.dataset.play); openVideo(p.dataset.play, p.dataset.title || (v ? L(v.t) : '')); }
  });

  /* ---------- 学籍档案解码 ---------- */
  (function record() {
    const body = $('#recBody'); let decoded = false, running = false;
    const glyphs = '▇▂▋▌▏▉█▓▒░01#$%&@ΣΔΩ≠∞';
    function scrambleIn() {
      if (running) return; running = true; decoded = true;
      const html = t('rec.body'); const tmp = document.createElement('div'); tmp.innerHTML = html;
      const plain = tmp.textContent; const len = plain.length; let i = 0;
      const step = Math.max(2, Math.round(len / 70));
      (function run() {
        i += step;
        if (i >= len || reduce) { body.innerHTML = html; running = false; return; }
        let out = plain.slice(0, i);
        for (let k = 0; k < Math.min(24, len - i); k++) out += glyphs[Math.floor(Math.random() * glyphs.length)];
        body.textContent = out; requestAnimationFrame(run);
      })();
    }
    function corrupt() { body.textContent = '▇▂▇▋▌▏▉█ DATA ERROR ▇▉▇▂▇ ' + '▒░'.repeat(30); decoded = false; }
    corrupt();
    $('#recBtn').addEventListener('click', scrambleIn);
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !decoded) setTimeout(scrambleIn, 400); }), { threshold: .6 }).observe(body);
    onLang(() => { if (decoded && !running) body.innerHTML = t('rec.body'); });
  })();

  /* ---------- 四重身份：调频器 / 主题 ---------- */
  (function identities() {
    const tabs = $$('#tuner button'), needle = $('#tunerNeedle');
    const setTab = id => { tabs.forEach((b, i) => { const on = b.dataset.id === id; b.classList.toggle('on', on); if (on) needle.style.left = (i * 25) + '%'; }); };
    tabs.forEach(b => b.addEventListener('click', () => $('#ident-' + b.dataset.id).scrollIntoView({ behavior: 'smooth' })));
    const visible = new Map();
    const io = new IntersectionObserver(es => {
      es.forEach(e => visible.set(e.target, e.intersectionRatio));
      let best = null, br = 0; visible.forEach((r, el) => { if (r > br) { br = r; best = el; } });
      if (best && br > .15) { document.body.dataset.mode = best.dataset.mode; setTab(best.dataset.mode); }
      else document.body.dataset.mode = 'hero';
    }, { threshold: [0, .15, .3, .5, .7] });
    $$('.ident').forEach(el => io.observe(el));
    setTab('ghost');
    onLang(() => $$('[data-vids]').forEach(row => { row.innerHTML = D.identityVideos[row.dataset.vids].map(id => vcard(vById(id))).join(''); }));
  })();

  /* 01 幽灵之镜 */
  (function mirror() {
    const m = $('#mirror'); let r = 0, target = 0, raf;
    const animate = () => { r += (target - r) * .15; m.style.setProperty('--r', r.toFixed(1) + 'px'); if (Math.abs(target - r) > .5) raf = requestAnimationFrame(animate); };
    const go = v => { target = v; cancelAnimationFrame(raf); animate(); };
    const move = e => { const b = m.getBoundingClientRect(); m.style.setProperty('--mx', (e.clientX - b.left) + 'px'); m.style.setProperty('--my', (e.clientY - b.top) + 'px'); };
    m.addEventListener('pointerenter', e => { move(e); go(m.clientWidth * .32); });
    m.addEventListener('pointermove', move);
    m.addEventListener('pointerdown', e => { move(e); go(m.clientWidth * .32); });
    m.addEventListener('pointerleave', () => go(0));
    if (!reduce) setInterval(() => {
      if (target > 0) return;
      m.style.setProperty('--mx', (20 + Math.random() * 60) + '%'); m.style.setProperty('--my', (15 + Math.random() * 50) + '%');
      go(60); setTimeout(() => { if (target === 60) go(0); }, 260);
    }, 3800);
  })();

  /* 02 隧者同步 */
  (function exo() {
    const hud = $('#hud'), fill = $('#hudFill'), val = $('#syncVal'), btn = $('#syncBtn'), log = $('#hudLog');
    const C = 2 * Math.PI * 88;
    const ticks = $('.hud-ticks'); let tk = '';
    for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, r1 = 96, r2 = i % 5 ? 100 : 106; tk += `<line x1="${100 + Math.cos(a) * r1}" y1="${100 + Math.sin(a) * r1}" x2="${100 + Math.cos(a) * r2}" y2="${100 + Math.sin(a) * r2}"/>`; }
    ticks.innerHTML = tk;
    const msgs = { 10: 'LINK › AUGMENTED RESONANCE', 30: 'REACTOR DRIVE › ONLINE', 55: 'ARMAMENT › MANIFESTING', 80: 'WARNING › CRITICALITY RISING', 95: 'OVERCLOCK › AUTHORIZED' };
    let sync = 0, holding = false, synced = false, logged = new Set();
    const render = () => { fill.style.strokeDashoffset = C * (1 - sync / 100); val.textContent = Math.floor(sync); };
    function loop() {
      if (synced) return;
      sync = holding ? Math.min(100, sync + .9) : Math.max(0, sync - 1.6);
      for (const k in msgs) if (sync >= +k && !logged.has(k)) { logged.add(k); const li = document.createElement('li'); li.textContent = '> ' + msgs[k]; log.appendChild(li); }
      if (!holding && sync === 0) { logged.clear(); log.innerHTML = ''; }
      render();
      if (sync >= 100) return overclock();
      if (holding || sync > 0) requestAnimationFrame(loop);
    }
    function overclock() {
      synced = true; hud.classList.add('synced'); btn.classList.remove('holding');
      const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 900);
      if (!reduce) { document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 500); }
      toast(t('exo.q'));
    }
    const start = e => { e.preventDefault(); if (synced) { synced = false; sync = 0; logged.clear(); log.innerHTML = ''; hud.classList.remove('synced'); render(); return; } holding = true; btn.classList.add('holding'); loop(); };
    const stop = () => { holding = false; btn.classList.remove('holding'); };
    btn.addEventListener('pointerdown', start); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, stop));
    btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !holding) start(e); });
    btn.addEventListener('keyup', stop);
    render();
  })();

  /* 03 飞行雪绒 */
  (function singer() {
    onLang(() => {
      $('#songs').innerHTML = D.songs.map(s => {
        const key = trackKeyByTitle(s.t);
        const action = key ? `<button data-track="${key}">▶ ${t('singer.play')}</button>`
          : `<span class="badge ${s.unfinished ? 'unf' : ''}">${s.unfinished ? t('singer.unfinished') : t('singer.ingame')}</span>`;
        return `<li><span class="st"><b>${esc(s.t)}</b><small>${esc(L(s.note))}${s.len ? ' · ' + s.len : ''}</small></span>${action}</li>`;
      }).join('');
    });
    const n = store.get('visits', 0) + 1; store.set('visits', n);
    $('#visitors').textContent = String(9072 * 37 + n).padStart(7, '0');
    $('.unmask').addEventListener('click', e => e.currentTarget.classList.toggle('on'));
  })();

  /* 04 救世主 */
  (function savior() {
    const sp = $('#spoiler');
    if (store.get('spoiler', false)) sp.classList.add('open');
    $('#spoilerBtn').addEventListener('click', () => { sp.classList.add('open'); store.set('spoiler', true); });
    const nodes = $('#loopNodes'), center = $('#loopCenter p'), plane = $('#loopPlane');
    const N = D.loop.length; let cur = 0, auto = true;
    function pos(i) { const a = -Math.PI / 2 + i / N * Math.PI * 2; return [50 + Math.cos(a) * 37.5, 50 + Math.sin(a) * 37.5]; }
    function select(i) {
      cur = i; $$('.loop-node', nodes).forEach((b, k) => b.classList.toggle('on', k === i));
      center.style.opacity = 0; setTimeout(() => { center.innerHTML = `<b style="font-size:1rem;display:block;color:var(--gold)">${esc(L(D.loop[i].k))}</b>${esc(L(D.loop[i].d))}`; center.style.opacity = 1; }, 200);
    }
    onLang(() => {
      nodes.innerHTML = D.loop.map((n, i) => { const [x, y] = pos(i); return `<button class="loop-node" style="left:${x}%;top:${y}%" data-i="${i}">${String(i + 1).padStart(2, '0')}<span>${esc(L(n.k))}</span></button>`; }).join('');
      select(cur);
    });
    nodes.addEventListener('click', e => { const b = e.target.closest('.loop-node'); if (b) { auto = false; select(+b.dataset.i); } });
    setInterval(() => { if (auto && document.body.dataset.mode === 'savior') select((cur + 1) % N); }, 4200);
    let ang = 0;
    (function fly() {
      ang += .006; const x = 200 + Math.cos(ang) * 150, y = 200 + Math.sin(ang) * 150;
      plane.setAttribute('transform', `translate(${x} ${y}) rotate(${ang * 57.3 + 90})`);
      if (!reduce) requestAnimationFrame(fly);
    })();
  })();

  /* ---------- 年表 ---------- */
  (function chronicle() {
    const ol = $('#timeline');
    onLang(() => {
      $$('.tl-item', ol).forEach(n => n.remove());
      ol.insertAdjacentHTML('beforeend', D.chronicle.map(c => `<li class="tl-item reveal"><span class="tl-era">${esc(L(c.era))}</span><h3>${esc(L(c.t))}</h3><p>${esc(L(c.d))}</p></li>`).join(''));
      observeReveal(ol);
    });
    const fill = $('#tlFill');
    addEventListener('scroll', () => {
      const b = ol.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * .6 - b.top) / b.height));
      fill.style.height = (p * 100) + '%';
    }, { passive: true });
  })();

  /* ---------- 故事 ---------- */
  onLang(() => {
    $('#storyGrid').innerHTML = D.stories.map((s, i) => `<button class="story reveal">
      <div class="front" data-n="0${i + 1}"><i class="sbg" style="background-image:url('assets/img/official/${['showcase2', 'showcase1', 'showcase4', 'splash', 'showcase3'][i]}.webp')"></i><h3>${esc(L(s.t))}</h3><q>${esc(L(s.q))}</q><small>↻ ${t('stories.flip')}</small></div>
      <div class="back"><h3>${esc(L(s.t))}</h3><p>${esc(L(s.s))}</p></div></button>`).join('');
    $('#itemGrid').innerHTML = D.items.map(it => `<article class="item reveal"><span class="ic">${it.icon}</span><h4>${esc(L(it.t))}</h4><p>${esc(L(it.d))}</p></article>`).join('');
    observeReveal($('#stories'));
  });
  $('#storyGrid').addEventListener('click', e => { const s = e.target.closest('.story'); if (s) s.classList.toggle('flip'); });

  /* ---------- 细节考据 ---------- */
  onLang(() => {
    const VT = f => { const v = (window.VOICE || []).find(x => x.f === f); return v ? L(v.t) : f; };
    $('#detGrid').innerHTML = D.details.map(d => `<article class="det reveal"><p class="det-k pix">${esc(L(d.k))}</p><h3>${esc(L(d.t))}</h3><p>${esc(L(d.d))}</p>
      ${d.v.length ? `<div class="det-v">${d.v.map(f => `<button class="voice-chip" data-voice="${f}">◉ ${esc(VT(f))}</button>`).join('')}</div>` : ''}</article>`).join('');
    observeReveal($('#details'));
  });

  /* ---------- 影像馆 ---------- */
  (function videos() {
    let filter = 'all';
    const grid = $('#vgrid');
    function renderGrid() {
      const list = D.videos.filter(v => filter === 'all' || v.cat === filter).sort((a, b) => b.date.localeCompare(a.date));
      grid.innerHTML = list.map((v, i) => vcard(v).replace('class="vcard"', `class="vcard" style="animation-delay:${Math.min(i, 12) * 40}ms"`)).join('');
    }
    onLang(() => {
      const f = vById('6lpiSBvawB0');
      $('#feature').innerHTML = vcard(f) + `<div class="feature-info"><p class="tag">✦ ${t('video.feature')} · ${f.date}</p><h3>${esc(L(f.t))}</h3><p class="dim">${t('hero.lead')}</p>${act(f.id, 'btn btn-primary', '▶ ' + t('hero.cta2'))}</div>`;
      $$('#vfilters button').forEach(b => {
        const n = b.dataset.f === 'all' ? D.videos.length : D.videos.filter(v => v.cat === b.dataset.f).length;
        b.innerHTML = `${t(b.dataset.i18n)}<sup>${n}</sup>`;
      });
      renderGrid();
    });
    $('#vfilters').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      filter = b.dataset.f; $$('#vfilters button').forEach(x => x.classList.toggle('on', x === b)); renderGrid();
    });
  })();

  /* ---------- 画廊 + 灯箱 ---------- */
  const lb = (function gallery() {
    let items = [], idx = 0, xLoaded = false;
    const img = $('#lbImg'), cap = $('#lbCap');
    function show(i) { idx = (i + items.length) % items.length; const it = items[idx]; img.src = it.src; cap.innerHTML = it.cap; }
    function fig(src, title, credit) { return `<figure class="reveal" data-src="${src}" data-cap="${esc(title)} · ${esc(credit)}"><img src="${src}" alt="${esc(title)}" loading="lazy"><figcaption>${esc(title)}</figcaption></figure>`; }
    onLang(() => {
      $('#masonry').innerHTML = D.gallery.map(g => fig('assets/img/official/' + g.f, L(g.t), '© Kuro Games')).join('');
      $('#fanGrid').innerHTML = D.fanworks.map(f => `<div class="fanwork reveal">${vcard({ id: f.id, t: [f.t, f.t, f.t], date: '' }, `<span class="vby">${esc(L(f.kind))}</span>`)}
        <p class="small" style="margin:6px 4px 0">${t('gal.by')} <a href="${f.url}" target="_blank" rel="noopener">${esc(f.by)} ↗</a></p></div>`).join('');
      const local = window.FANART || [];
      $('#fanLocal').innerHTML = local.length
        ? `<div class="masonry">${local.map(f => fig('assets/img/fanart/' + f.file, f.title, `${t('gal.by')} ${f.artist}`).replace('</figcaption>', ` · <a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.artist)} ↗</a></figcaption>`)).join('')}</div>`
        : `<p>${t('gal.localEmpty')}</p>`;
      $('#fanLinks').innerHTML = D.fanartLinks.map(l => `<a href="${l.u}" target="_blank" rel="noopener">${esc(l.n)} ↗</a>`).join('');
      /* pixiv：官方分享卡片（图内含作品名、作者与链接），本站不转存原图 */
      $('#pixGrid').innerHTML = (window.PIXIV || []).map(p => {
        const art = `https://www.pixiv.net/artworks/${p.id}`, user = `https://www.pixiv.net/users/${p.uid}`;
        const cap = `「${esc(p.title)}」 ${t('gal.by')} <a href="${user}" target="_blank" rel="noopener">${esc(p.user)}</a>${p.tw ? ` · <a href="${esc(p.tw)}" target="_blank" rel="noopener">X</a>` : ''} · <a href="${art}" target="_blank" rel="noopener">${t('gal.open')} ↗</a>`;
        const meta = `<figcaption><b>${esc(p.title)}</b><span>${esc(p.user)}</span><em class="mono">♥ ${p.bm.toLocaleString()}</em></figcaption>`;
        return NO_EMBED
          ? `<a class="pix-card pix-text reveal" href="${art}" target="_blank" rel="noopener"><span class="pix-ph pix">pixiv</span>${meta}</a>`
          : `<figure class="pix-card reveal" data-src="https://embed.pixiv.net/decorate.php?illust_id=${p.id}&mode=sns-automator" data-cap="${esc(cap)}"><img src="https://embed.pixiv.net/decorate.php?illust_id=${p.id}&mode=sns-automator" alt="${esc(p.title)} — ${esc(p.user)}" loading="lazy" referrerpolicy="no-referrer">${meta}</figure>`;
      }).join('');
      /* X：官方嵌入（blockquote 在脚本加载前就是一张可读的链接卡片） */
      $('#xGrid').innerHTML = D.xposts.map(x => `<blockquote class="twitter-tweet x-card reveal" data-dnt="true" data-theme="dark" data-lang="${lang}"><p>${esc(L(x.n))}</p>— ${esc(x.by)} <a href="${x.u}" target="_blank" rel="noopener">${x.u.replace('https://', '')} ↗</a></blockquote>`).join('');
      observeReveal($('#gallery'));
      loadX();
    });
    /* X 的 widgets.js 只在画廊接近视口时加载一次 */
    function loadX() {
      if (NO_EMBED) return;
      if (xLoaded) { window.twttr?.widgets?.load($('#xGrid')); return; }
      new IntersectionObserver((es, io) => {
        if (!es.some(e => e.isIntersecting)) return; io.disconnect(); xLoaded = true;
        const s = document.createElement('script'); s.src = 'https://platform.twitter.com/widgets.js'; s.async = true; document.body.appendChild(s);
      }, { rootMargin: '600px' }).observe($('#xGrid'));
    }
    $('#gallery').addEventListener('click', e => {
      const f = e.target.closest('figure[data-src]'); if (!f || e.target.closest('a')) return;
      items = $$('figure[data-src]', f.parentElement).map(x => ({ src: x.dataset.src, cap: x.dataset.cap }));
      show(items.findIndex(x => x.src === f.dataset.src)); openModal($('#lightbox'));
    });
    $('#lbPrev').addEventListener('click', () => show(idx - 1));
    $('#lbNext').addEventListener('click', () => show(idx + 1));
    return { step: d => show(idx + d) };
  })();

  /* ---------- 应援：每日打卡 ---------- */
  (function checkin() {
    const btn = $('#seeBtn');
    function stats() {
      const days = store.get('seen', []);
      let streak = 0; const d = new Date();
      if (!days.includes(today())) d.setDate(d.getDate() - 1);
      while (days.includes(d.toLocaleDateString('sv-SE'))) { streak++; d.setDate(d.getDate() - 1); }
      $('#streak').textContent = streak; $('#total').textContent = days.length;
      const done = days.includes(today());
      btn.classList.toggle('seen', done); $('#seeDone').textContent = done ? t('fans.done') : '';
      const wk = []; for (let i = 6; i >= 0; i--) { const x = new Date(); x.setDate(x.getDate() - i); const k = x.toLocaleDateString('sv-SE'); wk.push(`<span class="${days.includes(k) ? 'on' : ''}">${x.getDate()}</span>`); }
      $('#week').innerHTML = wk.join('');
    }
    onLang(stats);
    btn.addEventListener('click', e => {
      const days = store.get('seen', []);
      if (!days.includes(today())) { days.push(today()); store.set('seen', days); }
      stats(); burst(e.clientX, e.clientY);
    });
  })();
  function burst(x, y) {
    for (let i = 0; i < 16; i++) {
      const s = document.createElement('i'); s.className = 'burst'; s.textContent = i % 3 ? '✦' : '♡';
      const a = Math.random() * 6.283, d = 60 + Math.random() * 90;
      s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      document.body.appendChild(s); setTimeout(() => s.remove(), 1000);
    }
  }

  /* ---------- 应援：纸飞机 ---------- */
  (function planes() {
    const wall = $('#planeWall');
    const render = () => {
      const list = store.get('planes', []);
      wall.innerHTML = list.slice().reverse().map((p, i) => `<li>${esc(p.text)}<small>✈ ${new Date(p.t).toLocaleString()}</small><button data-del="${list.length - 1 - i}" aria-label="delete">×</button></li>`).join('');
    };
    render();
    $('#planeForm').addEventListener('submit', e => {
      e.preventDefault(); const ta = $('#planeText'); const text = ta.value.trim(); if (!text) return;
      const list = store.get('planes', []); list.push({ text, t: Date.now() }); store.set('planes', list.slice(-50));
      const b = ta.getBoundingClientRect(); const p = document.createElement('i'); p.className = 'flying-plane'; p.textContent = '✈️';
      p.style.left = b.left + 20 + 'px'; p.style.top = b.top + 'px'; document.body.appendChild(p); setTimeout(() => p.remove(), 1800);
      ta.value = ''; render();
    });
    wall.addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (!b) return; const list = store.get('planes', []); list.splice(+b.dataset.del, 1); store.set('planes', list); render(); });
  })();

  /* ---------- 隐藏房间：密码 9072 ---------- */
  (function secret() {
    const pad = $('#keypad'), cells = $$('span', pad); let buf = '';
    const hidden = document.createElement('input'); hidden.type = 'tel'; hidden.inputMode = 'numeric'; hidden.setAttribute('aria-label', 'password');
    Object.assign(hidden.style, { position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' });
    pad.after(hidden); pad.style.cursor = 'pointer'; pad.addEventListener('click', () => hidden.focus());
    hidden.addEventListener('input', () => { [...hidden.value.replace(/\D/g, '')].forEach(push); hidden.value = ''; });
    function draw() { cells.forEach((c, i) => { c.textContent = buf[i] || '_'; c.classList.toggle('on', !!buf[i]); }); }
    function push(d) {
      buf = (buf + d).slice(-4); draw();
      if (buf.length < 4) return;
      if (buf === '9072') { pad.classList.add('ok'); setTimeout(() => { openModal($('#blocks')); blocks.start(); pad.classList.remove('ok'); buf = ''; draw(); }, 400); }
      else { pad.classList.add('bad'); setTimeout(() => { pad.classList.remove('bad'); buf = ''; draw(); }, 450); }
    }
    addEventListener('keydown', e => {
      if (e.target.closest?.('textarea, input') || !/^\d$/.test(e.key) || $('.modal.open')) return;
      push(e.key);
    });
  })();

  /* ---------- 拉海洛方块（叠叠乐小游戏） ---------- */
  const blocks = (function () {
    const cv = $('#blocksCanvas'), x = cv.getContext('2d'), W = cv.width, H = cv.height, BH = 22;
    const colors = ['#ff9ad5', '#ffe48a', '#7fe3ff', '#c8a6ff', '#ff7a45'];
    let stack, cur, dir, speed, raf, over, score, camera;
    function reset() {
      stack = [{ x: 70, w: 180 }]; score = 0; over = false; speed = 2.2; dir = 1; camera = 0;
      cur = { x: 0, w: 180 }; $('#bScore').textContent = 0; $('#bMsg').textContent = '';
      $('#bBest').textContent = store.get('blocksBest', 0);
    }
    function drop() {
      if (over) { reset(); return; }
      const top = stack[stack.length - 1];
      const l = Math.max(cur.x, top.x), r = Math.min(cur.x + cur.w, top.x + top.w);
      if (r <= l) { over = true; $('#bMsg').textContent = t('blocks.over'); if (score > store.get('blocksBest', 0)) store.set('blocksBest', score); $('#bBest').textContent = store.get('blocksBest', 0); return; }
      stack.push({ x: l, w: r - l }); score++; $('#bScore').textContent = score;
      cur = { x: dir > 0 ? 0 : W - (r - l), w: r - l }; speed = Math.min(6, speed + .15);
    }
    function frame() {
      if (!over) { cur.x += dir * speed; if (cur.x + cur.w > W || cur.x < 0) dir *= -1; }
      const targetCam = Math.max(0, (stack.length + 1) * BH - H + 120); camera += (targetCam - camera) * .1;
      x.clearRect(0, 0, W, H);
      x.fillStyle = 'rgba(255,255,255,.6)';
      for (let i = 0; i < 30; i++) x.fillRect((i * 97) % W, (i * 53 + camera * .3) % H, 1.5, 1.5);
      stack.forEach((b, i) => { x.fillStyle = colors[i % colors.length]; x.fillRect(b.x, H - (i + 1) * BH + camera, b.w, BH - 2); });
      if (!over) { x.fillStyle = colors[stack.length % colors.length]; x.globalAlpha = .9; x.fillRect(cur.x, H - (stack.length + 1) * BH + camera, cur.w, BH - 2); x.globalAlpha = 1; }
      raf = requestAnimationFrame(frame);
    }
    cv.addEventListener('pointerdown', drop);
    addEventListener('keydown', e => { if ($('#blocks').classList.contains('open') && e.code === 'Space') { e.preventDefault(); drop(); } });
    return { start() { reset(); cancelAnimationFrame(raf); frame(); }, stop() { cancelAnimationFrame(raf); } };
  })();

  /* ---------- 飞行雪绒播放器：Apple Music 30 秒试听（参考站同款做法） ---------- */
  const music = (function () {
    const R = window.ITUNES || [];
    /* 同一首歌的多语言版本：按 ◉ 语音语言挑选；韩语版只在专辑详情里出现 */
    const VERS = { '星炬不熄': ['startorch', 'zh'], '絶やさぬスタートーチ': ['startorch', 'ja'], 'Unwavering Startorch': ['startorch', 'en'], '흔들리지 않는 스타토치': ['startorch', 'ko'],
      '祝福': ['grad', 'zh'], '祝福 (日文版)': ['grad', 'ja'], 'Graduation Show': ['grad', 'en'], '축하': ['grad', 'ko'] };
    const VL_NAME = { zh: '中文', ja: '日本語', en: 'English', ko: '한국어' };
    const TR = [];
    R.forEach(r => r.tracks.forEach(x => { const v = VERS[x.t[2]] || []; TR.push({ ...x, r, key: `${r.id}-${x.no}`, g: v[0], vl: v[1], inst: /Instrumental/.test(x.t[2]) }); }));
    const byKey = k => TR.find(x => x.key === k);
    const forVoice = list => list.filter(x => !x.g || x.vl === vlang);
    const relType = r => /- EP$/.test(r.t[2]) ? 'EP' : /- Single$/.test(r.t[2]) ? 'Single' : 'OST';
    const relName = r => r.t[2].replace(/\s*\(Original Game Soundtrack\)/, '').replace(/\s*-\s*(EP|Single)$/, '').trim();
    const starter = () => forVoice(TR.filter(x => !x.inst && x.vl !== 'ko' && x.sec > 60));
    const audio = new Audio(); audio.crossOrigin = 'anonymous'; audio.preload = 'none'; audio.volume = .85;
    const panel = $('#mplayer'), viz = $('#mViz'), vg = viz.getContext('2d');
    let queue = [], idx = 0, ctx = null, an = null, bins = new Uint8Array(64), raf = 0;
    window.__beat = 0;

    function graph() {
      if (ctx) { ctx.resume?.(); return; }
      try {
        ctx = new AudioContext(); const src = ctx.createMediaElementSource(audio);
        an = ctx.createAnalyser(); an.fftSize = 128; an.smoothingTimeConstant = .78;
        src.connect(an); an.connect(ctx.destination);
      } catch { ctx = null; an = null; }
    }
    const cur = () => queue[idx];
    function load(i) {
      idx = (i + queue.length) % queue.length; const x = cur(); if (!x) return;
      audio.src = x.p; graph(); voice.stop();
      audio.play().catch(() => {});
      render();
    }
    function playQueue(q, i = 0) {
      openPanel();
      if (NO_EMBED) { render(); toast(t('m.blocked')); return; }
      if (!q.length) return;
      queue = q; load(i);
    }
    function toggle() {
      if (NO_EMBED) return playQueue([]);
      if (!queue.length) return playQueue(starter());
      if (audio.paused) { graph(); audio.play().catch(() => {}); } else audio.pause();
    }
    function openPanel() { panel.classList.add('open'); ghost.home(); render(); }
    function closePanel() { panel.classList.remove('open'); }

    function render() {
      const x = cur() || starter()[0];
      if (x) {
        $('#mCover').src = `assets/img/covers/${x.r.id}.webp`;
        $('#mTitle').textContent = x.t[2];
        $('#mRel').textContent = `${relName(x.r)} · ${relType(x.r)} · ${x.r.date.slice(0, 4)}`;
        $('#mTag').textContent = x.vl ? `${t('m.vocal')} · ${VL_NAME[x.vl]}` : x.inst ? t('m.inst') : x.a.replace(/^Wuthering Waves,?\s*&?\s*/, '');
        const full = D.fullSongs[x.t[2]];
        $('#mLinks').innerHTML = (full && !NO_EMBED ? `<button data-play="${full}" data-title="${esc(x.t[2])}">▶ ${t('m.full')}</button>` : '') +
          `<a href="${x.r.apple}" target="_blank" rel="noopener">Apple Music ↗</a>`;
      }
      $('#mPlay').textContent = audio.paused ? '▶' : '❚❚';
      $('#mNote').textContent = NO_EMBED ? t('m.blocked') : t('radio.sub');
      const list = queue.length ? queue : starter();
      $('#mQueue').innerHTML = list.map((q, i) => `<li class="${queue.length && i === idx ? 'on' : ''}"><button data-mi="${i}"><img src="assets/img/covers/${q.r.id}.webp" alt=""><span><b>${esc(q.t[2])}</b><small>${esc(relName(q.r))}</small></span><i class="mono">${fmt(q.sec)}</i></button></li>`).join('');
      const k = cur()?.key;
      $$('[data-track]').forEach(b => b.classList.toggle('on', b.dataset.track === k && !audio.paused));
      $$('[data-rel]').forEach(b => b.classList.toggle('on', !audio.paused && cur()?.r.id === +b.dataset.rel));
      document.body.classList.toggle('music-on', !audio.paused);
      $('#eq').classList.toggle('playing', !audio.paused);
    }
    function time() {
      const d = isFinite(audio.duration) ? audio.duration : 30;
      $('#mBar').style.width = (audio.currentTime / d * 100) + '%';
      $('#mTime').textContent = `${fmt(audio.currentTime || 0)} / ${fmt(d)}`;
    }
    /* 像素风频谱 + 低音能量（驱动幽灵跳动） */
    function loop() {
      const W = viz.width, H = viz.height, n = 25, bw = W / n;
      vg.clearRect(0, 0, W, H);
      let bass = 0;
      if (an && !audio.paused) { an.getByteFrequencyData(bins); for (let i = 1; i < 7; i++) bass += bins[i]; bass = Math.pow(bass / (6 * 255), 1.6); }
      window.__beat += (bass - window.__beat) * .35;
      for (let i = 0; i < n; i++) {
        const v = an && !audio.paused ? bins[1 + Math.floor(Math.pow(i / n, 1.3) * 50)] / 255 : .12 + .08 * Math.sin(performance.now() / 300 + i * .6);
        const blocks = Math.max(1, Math.round(v * 9));
        for (let b = 0; b < blocks; b++) { vg.fillStyle = b > 6 ? '#ffe48a' : b > 3 ? '#ff9ad5' : '#c8a6ff'; vg.fillRect(i * bw + 1, H - (b + 1) * 5, bw - 3, 4); }
      }
      raf = !audio.paused && !reduce ? requestAnimationFrame(loop) : 0;
      if (!raf) window.__beat = 0;
    }
    audio.addEventListener('play', () => { render(); if (!raf) raf = requestAnimationFrame(loop); });
    audio.addEventListener('pause', () => { render(); loop(); });
    audio.addEventListener('timeupdate', time);
    audio.addEventListener('ended', () => { if (idx < queue.length - 1) load(idx + 1); else render(); });
    audio.addEventListener('error', () => { toast(t('m.blocked')); render(); });
    $('#mPlay').addEventListener('click', toggle);
    $('#mNext').addEventListener('click', () => queue.length ? load(idx + 1) : toggle());
    $('#mPrev').addEventListener('click', () => { if (audio.currentTime > 3) audio.currentTime = 0; else if (queue.length) load(idx - 1); });
    $('#mClose').addEventListener('click', closePanel);
    $('#mSeek').addEventListener('click', e => { const b = e.currentTarget.getBoundingClientRect(); if (isFinite(audio.duration)) audio.currentTime = (e.clientX - b.left) / b.width * audio.duration; });
    $('#mQueue').addEventListener('click', e => { const b = e.target.closest('[data-mi]'); if (!b) return; if (!queue.length) return playQueue(starter(), +b.dataset.mi); load(+b.dataset.mi); });
    document.addEventListener('click', e => {
      const tb = e.target.closest('[data-track]');
      if (tb) { const x = byKey(tb.dataset.track); if (!x) return; if (cur()?.key === x.key && !audio.paused) return audio.pause(); const q = x.r.tracks.map(y => byKey(`${x.r.id}-${y.no}`)); return playQueue(q, q.indexOf(x)); }
      const rb = e.target.closest('[data-rel], [data-music]');
      if (rb) { const id = +(rb.dataset.rel || rb.dataset.music); if (cur()?.r.id === id && !audio.paused) return audio.pause(); const q = forVoice(TR.filter(x => x.r.id === id && !x.inst && x.vl !== 'ko')); return playQueue(q.length ? q : TR.filter(x => x.r.id === id)); }
    });
    /* 切换语音语言时，正在播放的多语言歌曲换成对应版本 */
    onVlang(() => {
      const x = cur(); if (!x || !x.g || audio.paused) return render();
      const alt = TR.find(y => y.g === x.g && y.vl === vlang); if (!alt) return;
      queue[idx] = alt; const tm = audio.currentTime; audio.src = alt.p; audio.currentTime = tm; audio.play().catch(() => {}); render();
    });

    /* 作品区 */
    onLang(() => {
      $('#disco').innerHTML = R.map(r => `<article class="rel reveal">
        <button class="rel-cover" data-rel="${r.id}" aria-label="${t('disc.playAll')}"><img src="assets/img/covers/${r.id}.webp" alt="" loading="lazy"><span class="rel-play">▶</span></button>
        <div class="rel-body"><p class="rel-type pix">${relType(r)} · ${r.date}</p><h3>${esc(relName(r))}</h3>
        <ol class="rel-tracks">${r.tracks.map(x => { const k = byKey(`${r.id}-${x.no}`); const tag = k.vl ? `<b class="vl-tag">${{ zh: '中', ja: '日', en: 'EN', ko: 'KR' }[k.vl]}</b>` : k.inst ? `<b class="vl-tag inst">INST</b>` : '';
          return `<li><button data-track="${k.key}"><i>${String(x.no).padStart(2, '0')}</i><span>${esc(x.t[2])}</span>${tag}<em class="mono">${fmt(x.sec)}</em></button></li>`; }).join('')}</ol>
        <a class="rel-apple" href="${r.apple}" target="_blank" rel="noopener">Apple Music ↗</a></div></article>`).join('');
      observeReveal($('#music'));
      render();
    });
    loop();
    return { pause() { audio.pause(); }, toggle, isPlaying: () => !audio.paused, open: openPanel, close: closePanel, isOpen: () => panel.classList.contains('open') };
  })();

  /* ---------- 像素电子幽灵「飞行雪绒」：直接使用游戏内像素小人的待机动画素材
     （gitee.com/lzy-buaa-jdi/ameath，MIT；GIF 原素材 B 站 @_BLZ_）。
     状态机：待机呼吸 → 随机小动作；移动时播放行走动画并横穿屏幕；点击播放被抓起的动作；
     放音乐时扇翅膀；长时间无操作就像游戏里一样趴到屏幕底边探头 ---------- */
  const ghost = (function () {
    const el = $('#ghost'), cv = $('#ghostCv'), g = cv.getContext('2d'), say = $('#ghostSay'), btn = $('#ghostBtn');
    const C = window.CHIBI || {}, F = 200;
    const img = {};
    Object.keys(C).forEach(k => { const i = new Image(); i.src = `assets/img/chibi/${k}.webp`; img[k] = i; });
    const EXTRAS = ['idle1', 'idle3', 'idle4'];
    const SCREENS = ['screen1', 'screen2', 'screen3', 'screen4', 'screen5', 'screen6', 'screen7'];
    let anim = 'idle2', frame = 0, acc = 0, last = performance.now(), loop = true, onEnd = null, flip = false;
    let glitch = 0, sayTimer = 0, lastInput = Date.now(), mode = 'idle', hover = false, side = 'r', home = true, screenTimer = 0;

    const base = () => music.isPlaying() ? 'idle4' : 'idle2';
    function play(name, opts = {}) {
      if (!C[name]) return;
      anim = name; frame = 0; acc = 0; loop = !!opts.loop; onEnd = opts.then || null;
      if (opts.flip !== undefined) flip = opts.flip;
    }
    function draw(now) {
      const dt = Math.min(200, now - last); last = now;
      const meta = C[anim];
      if (meta) {
        acc += dt;
        while (acc >= meta.d[frame]) {
          acc -= meta.d[frame]; frame++;
          if (frame >= meta.n) {
            if (loop) frame = 0;
            else { frame = meta.n - 1; const f = onEnd; onEnd = null; if (f) f(); else play(base(), { loop: true }); break; }
          }
        }
      }
      g.clearRect(0, 0, F, F);
      const im = img[anim];
      if (im && im.complete && im.naturalWidth) {
        g.save();
        if (flip) { g.translate(F, 0); g.scale(-1, 1); }
        if (glitch > 0) {
          /* 电子幽灵的信号干扰：按横条错位 */
          for (let y = 0; y < F; y += 8) { const off = Math.random() < .3 ? (Math.random() < .5 ? -7 : 7) : 0; g.drawImage(im, frame * F, y, F, 8, off, y, F, 8); }
          glitch--;
        } else g.drawImage(im, frame * F, 0, F, F, 0, 0, F, F);
        g.restore();
      }
      el.style.setProperty('--beat', (window.__beat || 0).toFixed(3));
      requestAnimationFrame(draw);
    }

    function speak(text, ms = 2400) { say.textContent = text; say.classList.add('show'); clearTimeout(sayTimer); sayTimer = setTimeout(() => say.classList.remove('show'), ms); }
    function spawnNote() {
      const n = document.createElement('i'); n.className = 'ghost-note pix'; n.textContent = Math.random() < .5 ? '♪' : '♫';
      n.style.left = (30 + Math.random() * 50) + '%'; el.appendChild(n); setTimeout(() => n.remove(), 1600);
    }

    /* 位置：用 left/bottom 像素定位，移动时由 CSS 过渡 */
    const size = () => el.offsetWidth || 140;
    const spots = () => {
      const w = size(), r = innerWidth - w - 10;
      return innerWidth < 700 ? [{ s: 'r', x: r, b: 8 }, { s: 'l', x: 10, b: 8 }]
        : [{ s: 'r', x: r, b: 10 }, { s: 'r', x: r, b: Math.round(innerHeight * .4) }, { s: 'l', x: 10, b: 10 }, { s: 'l', x: 10, b: Math.round(innerHeight * .45) }];
    };
    let pos = null;
    function place(p, animate) {
      el.classList.toggle('moving', !!animate);
      el.style.right = ''; el.style.left = p.x + 'px'; el.style.bottom = p.b + 'px'; el.dataset.side = p.s; pos = p;
    }
    function walkTo(p) {
      if (!pos || (pos.x === p.x && pos.b === p.b)) return place(p, false);
      /* move.gif 朝左；向右走时镜像 */
      const toRight = p.x > pos.x;
      play('move', { loop: true, flip: toRight });
      glitch = 8;
      place(p, true);
      clearTimeout(walkTo.t);
      walkTo.t = setTimeout(() => { el.classList.remove('moving'); flip = false; play('idle3', { flip: false }); }, 2300);
    }

    /* 长时间无操作：像游戏里的屏幕待机彩蛋一样，趴到屏幕底边探头 */
    function enterScreen() {
      if (mode === 'screen' || music.isOpen() || music.isPlaying()) return;
      mode = 'screen'; el.classList.add('screen');
      const p = spots()[0]; place({ ...p, b: 0 }, true);
      const next = () => { play(SCREENS[Math.floor(Math.random() * SCREENS.length)], { loop: true, flip: false }); screenTimer = setTimeout(next, 5000 + Math.random() * 4000); };
      setTimeout(next, 600);
    }
    function exitScreen() {
      if (mode !== 'screen') return;
      mode = 'idle'; clearTimeout(screenTimer); el.classList.remove('screen');
      glitch = 10; play('idle3', { flip: false });
      place(spots()[0], true); home = true;
      setTimeout(() => speak(L(D.ghostLines[0]), 2000), 500);
    }
    const poke = () => { lastInput = Date.now(); if (mode === 'screen') exitScreen(); };
    ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(ev => addEventListener(ev, poke, { passive: true }));

    /* 待机小动作与随机移动 */
    function idle() {
      if (!reduce && mode === 'idle' && !hover) {
        if (Date.now() - lastInput > 20000) enterScreen();
        else if (!music.isOpen() && anim !== 'move') {
          const r = Math.random();
          if (r < .35) { const list = spots(), p = list[Math.floor(Math.random() * list.length)]; walkTo(p); home = p === list[0]; }
          else if (r < .8) play(EXTRAS[Math.floor(Math.random() * EXTRAS.length)]);
          else glitch = 12;
          if (Math.random() < .5) setTimeout(() => speak(L(D.ghostLines[Math.floor(Math.random() * D.ghostLines.length)])), 700);
        }
      }
      setTimeout(idle, 6000 + Math.random() * 6000);
    }

    btn.addEventListener('click', () => {
      poke();
      play('drag', { flip: false });             /* 被抓起来的表情 */
      if (music.isOpen()) { music.close(); return; }
      music.open(); if (!music.isPlaying()) music.toggle();
    });
    btn.addEventListener('pointerenter', () => { hover = true; if (mode === 'idle' && anim !== 'move') play('idle3', { flip: false }); speak(t('ghost.hint'), 1600); });
    btn.addEventListener('pointerleave', () => { hover = false; });
    setInterval(() => {
      if (music.isPlaying() && !reduce) { spawnNote(); if (anim === 'idle2') play('idle4', { loop: true }); }
      else if (anim === 'idle4' && loop) play('idle2', { loop: true });
    }, 700);
    addEventListener('resize', () => { if (mode === 'idle' && pos) place(spots()[pos.s === 'r' ? 0 : (innerWidth < 700 ? 1 : 2)], false); });

    place(spots()[0], false);
    play('idle2', { loop: true });
    requestAnimationFrame(draw);
    setTimeout(() => speak(L(D.ghostLines[0]), 2600), 2600);
    setTimeout(idle, 8000);
    return { home() { if (mode === 'screen') exitScreen(); else if (!home) { walkTo(spots()[0]); home = true; } } };
  })();

  /* ---------- 声音档案（中文语音 + 三语台词） ---------- */
  const voice = (function () {
    const V = window.VOICE || [];
    const CATS = ['ghost', 'exo', 'singer', 'savior', 'bonds'];
    const catLabel = c => c === 'bonds' ? t('voice.bonds') : t('tab.' + c);
    const audio = new Audio(); audio.preload = 'none';
    const canOgg = !!audio.canPlayType('audio/ogg; codecs="vorbis"');
    $('#vwarn').hidden = canOgg;
    const cv = $('#vscope'), g = cv.getContext('2d'), sub = $('#subbar');
    let cur = 0, filter = 'all', ctx = null, analyser = null, bins = null, raf = 0, stageVisible = false;
    const auto = $('#vauto'); auto.checked = store.get('vauto', true);
    auto.addEventListener('change', () => store.set('vauto', auto.checked));
    const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const indexOf = f => V.findIndex(v => v.f === f);
    const visibleList = () => V.map((_, i) => i).filter(i => filter === 'all' || V[i].c === filter);
    /* 台词按播放进度逐字浮现：原声为中文，下方附当前语言的官方台词 */
    const streamed = (text, p) => { const n = Math.ceil(text.length * p); return `${esc(text.slice(0, n))}<span class="vrest">${esc(text.slice(n))}</span>`; };
    /* 部分服务器不支持分段请求时 Ogg 的 duration 为 Infinity，改用已知时长 */
    const dur = () => isFinite(audio.duration) && audio.duration > 0 ? audio.duration : V[cur].d[vli()];
    const progress = () => audio.currentTime || !audio.paused ? Math.min(1, audio.currentTime / dur()) : 1;

    function initAnalyser() {
      if (ctx || !window.AudioContext) return;
      try {
        ctx = new AudioContext(); const src = ctx.createMediaElementSource(audio);
        analyser = ctx.createAnalyser(); analyser.fftSize = 128; bins = new Uint8Array(analyser.frequencyBinCount);
        src.connect(analyser); analyser.connect(ctx.destination);
      } catch { ctx = null; analyser = null; }
    }
    function renderStage() {
      /* 主台词 = 语音语言；下方 = 界面语言（两者相同时改附英文 / 中文） */
      const v = V[cur], p = audio.src ? progress() : 1;
      const transLang = li() !== vli() ? li() : (vlang === 'en' ? 0 : 2);
      $('#vcat').textContent = `${catLabel(v.c)} · ◉ ${{ zh: '中文', ja: '日本語', en: 'English' }[vlang]}`;
      $('#vtitle').textContent = L(v.t);
      $('#vtext').innerHTML = streamed(v.x[vli()], p);
      $('#vtext').lang = { zh: 'zh-CN', ja: 'ja', en: 'en' }[vlang];
      $('#vtrans').textContent = v.x[transLang];
      $('#vtime').textContent = `${fmt(audio.currentTime || 0)} / ${fmt(dur())}`;
      $('#vplayIcon').textContent = audio.paused ? '▶' : '❚❚';
      $('#subTitle').textContent = L(v.t);
      $('#subText').innerHTML = streamed(L(v.x), p);
    }
    function renderList() {
      $('#vcats').innerHTML = ['all', ...CATS].map(c => {
        const n = c === 'all' ? V.length : V.filter(v => v.c === c).length;
        return `<button data-vc="${c}" class="${c === filter ? 'on' : ''}">${c === 'all' ? t('voice.all') : catLabel(c)}<sup>${n}</sup></button>`;
      }).join('');
      $('#vlist').innerHTML = visibleList().map(i => {
        const v = V[i];
        return `<li class="${i === cur ? 'on' : ''} ${i === cur && !audio.paused ? 'playing' : ''}"><button data-vi="${i}">
          <span class="vl-cat vl-${v.c}"></span><span class="vl-main"><b>${esc(L(v.t))}</b><small>${esc(v.x[vli()])}</small></span><i class="mono">${fmt(v.d[vli()])}</i></button></li>`;
      }).join('');
      $$('[data-vt]').forEach(el => { const v = V[indexOf(el.dataset.vt)]; if (v) el.textContent = L(v.t); });
    }
    function syncState() {
      $$('[data-voice]').forEach(el => el.classList.toggle('playing', !audio.paused && el.dataset.voice === V[cur].f));
      $$('#vlist li').forEach(li => { const on = +li.firstElementChild.dataset.vi === cur; li.classList.toggle('on', on); li.classList.toggle('playing', on && !audio.paused); });
      sub.classList.toggle('show', !audio.paused && !stageVisible);
      renderStage();
    }
    function draw() {
      const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, R = W * .3;
      g.clearRect(0, 0, W, H);
      const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#ff9ad5';
      const n = 64, time = performance.now() / 1000;
      if (analyser && !audio.paused) analyser.getByteFrequencyData(bins);
      g.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 - Math.PI / 2;
        const live = analyser && !audio.paused ? bins[Math.floor((i < n / 2 ? i : n - i) / (n / 2) * bins.length * .7)] / 255 : 0;
        const idle = .08 + Math.sin(time * 1.6 + i * .5) * .04;
        const len = R * .08 + R * .55 * Math.max(live, idle);
        g.strokeStyle = i % 2 ? accent : '#7fe3ff'; g.globalAlpha = .45 + Math.max(live, idle) * .55; g.lineWidth = 3;
        g.beginPath(); g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.lineTo(cx + Math.cos(a) * (R + len), cy + Math.sin(a) * (R + len)); g.stroke();
      }
      g.globalAlpha = .5; g.strokeStyle = '#7fe3ff'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R - 6, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
      if (!audio.paused) renderStage();
      raf = (!audio.paused || stageVisible) && !reduce ? requestAnimationFrame(draw) : 0;
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };
    function play(i) {
      if (i < 0 || i >= V.length) return;
      if (!canOgg) { toast(t('voice.ogg')); return; }
      const src = `assets/audio/${vlang}/${V[i].f}.ogg`;
      if (i !== cur || !audio.src.endsWith(src)) { cur = i; audio.src = src; }
      music.pause(); initAnalyser(); ctx?.resume?.();
      audio.play().catch(() => toast(t('voice.ogg')));
    }
    function step(d) { const l = visibleList(); const k = l.indexOf(cur); play(l[(k + d + l.length) % l.length] ?? l[0]); }
    audio.addEventListener('play', () => { syncState(); kick(); });
    audio.addEventListener('pause', syncState);
    audio.addEventListener('loadedmetadata', renderStage);
    audio.addEventListener('ended', () => { syncState(); if (auto.checked) setTimeout(() => step(1), 700); });
    $('#vplay').addEventListener('click', () => audio.paused ? play(cur) : audio.pause());
    $('#vprev').addEventListener('click', () => step(-1));
    $('#vnext').addEventListener('click', () => step(1));
    $('#subStop').addEventListener('click', () => audio.pause());
    $('#vcats').addEventListener('click', e => { const b = e.target.closest('[data-vc]'); if (b) { filter = b.dataset.vc; renderList(); } });
    $('#vlist').addEventListener('click', e => { const b = e.target.closest('[data-vi]'); if (b) { const i = +b.dataset.vi; i === cur && !audio.paused ? audio.pause() : play(i); } });
    document.addEventListener('click', e => { const b = e.target.closest('[data-voice]'); if (b) { const i = indexOf(b.dataset.voice); i === cur && !audio.paused ? audio.pause() : play(i); } });
    new IntersectionObserver(es => es.forEach(e => { stageVisible = e.isIntersecting; syncState(); kick(); }), { threshold: .25 }).observe($('#vstage'));
    onLang(() => { renderList(); renderStage(); });
    /* 切换语音语言：正在播放就从头换成新语言 */
    onVlang(() => { const was = !audio.paused; renderList(); if (was) play(cur); else { audio.removeAttribute('src'); renderStage(); } });
    draw();
    return { stop() { audio.pause(); } };
  })();

  /* ---------- 出处 ---------- */
  onLang(() => {
    const groups = [['official', 'src.official'], ['wiki', 'src.wiki'], ['press', 'src.press'], ['music', 'src.music']];
    $('#srcGrid').innerHTML = groups.map(([k, label]) => `<div class="panel reveal"><h3>${t(label)}</h3><ol>${D.sources[k].map(([n, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(n)}</a></li>`).join('')}</ol></div>`).join('');
    observeReveal($('#sources'));
  });

  /* ---------- 启动 ---------- */
  applyLang(lang);
  applyVlang(vlang);
  observeReveal(document);
})();
