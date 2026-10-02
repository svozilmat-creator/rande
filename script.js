(() => {
  'use strict';

  /* ---------- Data ---------- */
  const ACT = {
    food:    { icon: '🍝', name: 'Jídlo', q: 'Na co máš chuť?', opts: [
      ['🍕','Pizza'],['🍔','Burger'],['🍜','Asie'],['🍝','Itálie'],['🥩','Něco pořádného'],['🤷','Vyber ty',1]] },
    cinema:  { icon: '🎬', name: 'Kino', q: 'Na co zajdeme?', opts: [
      ['🎬','Film podle výběru'],['😂','Komedie'],['😱','Horor'],['❤️','Něco romantického'],['🤷','Vyber ty',1]] },
    netflix: { icon: '🍿', name: 'Netflix & chill', q: 'Co pustíme?', opts: [
      ['🎬','Film'],['📺','Seriál'],['😏','Ještě nevím, ale Netflix to jistí',1]] },
    coffee:  { icon: '☕', name: 'Káva', q: 'Kam na kávu?', opts: [
      ['☕','Kavárna'],['🍰','Káva + něco sladkého'],['🧋','Něco úplně jiného'],['🤷','Vyber ty',1]] },
    sport:   { icon: '🏃', name: 'Sport', q: 'Co dáme?', opts: [
      ['🎳','Bowling'],['🧗','Bouldering'],['🚶','Procházka'],['🚴','Kolo'],['🏓','Něco podle nálady',1]] },
    trip:    { icon: '🌲', name: 'Výlet', q: 'Kam vyrazíme?', opts: [
      ['🌲','Do přírody'],['🏙️','Někam do města'],['🏔️','Na výlet za výhledem'],['🚗','Někam autem a uvidíme'],['🤷','Nechám se překvapit',1]] },
  };
  const KEYS = Object.keys(ACT);
  const MONTHS = ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];
  const DAYS = ['neděle','pondělí','úterý','středa','čtvrtek','pátek','sobota'];
  const NO_LABELS = ['NE','Ale no tak…','Zkus to znovu','Tohle nepůjde 😏','Zkus radši ANO.','Opravdu NE?','Nene, ANO'];

  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const $ = s => document.querySelector(s);

  // Monogram: Soňa (S, korál) a Matěj (M, grafit) jako dva překrývající se kruhy
  let monoN = 0;
  const mono = () => {
    const id = 'mc' + monoN++;
    return `<svg class="mono" viewBox="0 0 76 44" role="img" aria-label="Soňa &amp; Matěj"><defs><clipPath id="${id}"><circle cx="26" cy="22" r="20"/></clipPath></defs>` +
      `<g class="gs"><circle class="m-s" cx="26" cy="22" r="20"/><text class="t-s" x="17" y="22" dy=".35em">S</text></g>` +
      `<g class="gm"><circle class="m-m" cx="50" cy="22" r="20"/><text class="t-m" x="59" y="22" dy=".35em">M</text></g>` +
      `<circle class="m-x" cx="50" cy="22" r="20" clip-path="url(#${id})"/></svg>`;
  };

  function defaultDate() {            // nejbližší sobota (nebo dnes, je-li sobota)
    const d = new Date();
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
    return ymd(d);
  }

  /* ---------- State ---------- */
  const state = { step: 'intro', date: defaultDate(), time: '18:30', acts: [], pick: {}, tries: 0 };

  const flow = () => ['intro', 'when', 'what', ...state.acts.map(a => 'd:' + a), 'summary', 'final'];
  const stage = s => s === 'intro' ? 1 : s === 'when' ? 2 : s === 'what' ? 3 : s === 'summary' ? 5 : 4;

  const parts = () => {
    const [y, m, d] = state.date.split('-').map(Number);
    return { y, m, d, dow: new Date(y, m - 1, d).getDay() };
  };
  const dateLong = () => { const p = parts(); return `${DAYS[p.dow]} ${p.d}. ${MONTHS[p.m - 1]} ${p.y}`; };
  const dateShort = () => { const p = parts(); return `${p.d}. ${p.m}. ${p.y}`; };
  const program = () => state.acts.map(k => ACT[k].name).join(' + ');
  const choice = k => ACT[k].opts.find(o => o[1] === state.pick[k]);
  const finalLine = () => state.acts.map(k => {
    const o = choice(k);
    return !o || o[2] ? ACT[k].name : o[1];
  }).join(' + ');

  /* ---------- Rendering ---------- */
  const stageEl = $('#stage');

  function go(step, dir) {
    state.step = step;
    render(dir);
  }
  const next = () => { const f = flow(); go(f[f.indexOf(state.step) + 1], 'fwd'); };
  const prev = () => { const f = flow(); go(f[f.indexOf(state.step) - 1], 'back'); };

  function render(dir) {
    const s = state.step;
    const top = $('#top');
    top.hidden = (s === 'intro' || s === 'final');
    if (!top.hidden) {
      $('#count').textContent = stage(s) + ' / 5';
      $('#barFill').style.width = stage(s) * 20 + '%';
    }
    const dark = s === 'intro' || s === 'final';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    $('meta[name="theme-color"]').content = dark ? '#1B1A1C' : '#F4EFE6';
    document.documentElement.style.overflow = s === 'intro' ? 'hidden' : '';
    stageEl.innerHTML = view(s);
    stageEl.querySelectorAll('.step>*').forEach((n, i) => n.style.setProperty('--i', i));
    stageEl.querySelectorAll('.card,.opt,.row').forEach((n, i) => n.style.setProperty('--i', i + 2));
    const el = stageEl.firstElementChild;
    if (dir === 'back') el.classList.add('back');
    stageEl.scrollTop = 0;
    if (s === 'intro') initRunaway();
    if (s === 'final') confetti();
  }

  function view(s) {
    if (s === 'intro') return `
      <section class="step intro">
        <div class="brand">${mono()}<span>Pozvánka jen pro Soňu</span></div>
        <h1>Soni, půjdeš se mnou na rande?</h1>
        <p class="sub">Vyplň krátký dotazník a společně naplánujeme náš večer.</p>
        <div class="actions">
          <button class="btn yes" id="yes" type="button">ANO</button>
          <div class="no-slot"><button class="btn" id="no" type="button">NE</button></div>
        </div>
        <p class="fine">Možnost NE je momentálně v údržbě.</p>
        <div class="rings"><i></i><i></i></div>
      </section>`;

    if (s === 'when') return `
      <section class="step">
        <h2>Tak jo. Kdy vyrážíme?</h2>
        <p class="sub">Matěj je flexibilní. Většinou.</p>
        <label class="field"><span>Datum</span><input type="date" id="date" value="${state.date}" min="${ymd(new Date())}"></label>
        <label class="field"><span>Čas</span><input type="time" id="time" value="${state.time}"></label>
        <div class="actions"><button class="btn dark" id="go" type="button" ${state.date && state.time ? '' : 'disabled'}>Pokračovat →</button></div>
      </section>`;

    if (s === 'what') return `
      <section class="step">
        <h2>A co podnikneme?</h2>
        <p class="sub">Klidně víc věcí. Večer je dlouhý.</p>
        <div class="grid">${KEYS.map(k => `
          <button class="card ${state.acts.includes(k) ? 'on' : ''}" type="button" data-act="${k}" aria-pressed="${state.acts.includes(k)}">
            <span class="e">${ACT[k].icon}</span><b>${ACT[k].name}</b></button>`).join('')}
        </div>
        <div class="actions"><button class="btn dark" id="go" type="button" ${state.acts.length ? '' : 'disabled'}>Pokračovat →</button></div>
      </section>`;

    if (s.startsWith('d:')) {
      const k = s.slice(2), a = ACT[k];
      return `
      <section class="step">
        <span class="chip">${a.icon} ${a.name}</span>
        <h2>${a.q}</h2>
        <div class="list" style="margin-top:18px">${a.opts.map(o => `
          <button class="opt ${state.pick[k] === o[1] ? 'on' : ''}" type="button" data-pick="${o[1]}">
            <span class="e">${o[0]}</span>${o[1]}</button>`).join('')}
        </div>
      </section>`;
    }

    if (s === 'summary') return `
      <section class="step">
        <h2>Takže máme plán.</h2>
        <p class="sub">Poslední šance to změnit. (Nevyužiješ ji.)</p>
        <div class="sum">
          <div class="row"><span class="e">📅</span><div><small>Datum</small><b>${dateLong()}</b></div></div>
          <div class="row"><span class="e">🕐</span><div><small>Čas</small><b>${state.time}</b></div></div>
          <div class="row"><span class="e">🎯</span><div><small>Program</small><b>${program()}</b></div></div>
          ${state.acts.map(k => { const o = choice(k); return o ? `
          <div class="row"><span class="e">${o[0]}</span><div><small>${ACT[k].name}</small><b>${o[1]}</b></div></div>` : ''; }).join('')}
        </div>
        <div class="actions">
          <button class="btn ghost" id="edit" type="button">← Upravit</button>
          <button class="btn dark" id="ok" type="button">Tohle beru →</button>
        </div>
      </section>`;

    return `
      <section class="step final">
        <div class="monowrap">${mono()}</div>
        <h1>Tak platí.</h1>
        <p class="names">Soňa &amp; Matěj<br>jdou na rande.</p>
        <div class="when">${dateShort()} <span>v</span> ${state.time}<br>${finalLine()}</div>
        <p class="soon">Těším se.<span class="sig">– Matěj</span></p>
        <div class="actions"><button class="btn yes" id="cal" type="button">Přidat do kalendáře</button></div>
      </section>`;
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.id === 'back') return prev();
    if (t.id === 'go') return next();
    if (t.id === 'edit') return go('when', 'back');
    if (t.id === 'ok') return next();
    if (t.id === 'cal') return downloadIcs();
    if (t.id === 'yes') return yes(t);
    if (t.dataset.act) {
      const k = t.dataset.act, i = state.acts.indexOf(k);
      i < 0 ? state.acts.push(k) : state.acts.splice(i, 1);
      state.acts.sort((a, b) => KEYS.indexOf(a) - KEYS.indexOf(b));
      t.classList.toggle('on', i < 0);
      t.setAttribute('aria-pressed', i < 0);
      $('#go').disabled = !state.acts.length;
    }
    if (t.dataset.pick) {
      state.pick[state.step.slice(2)] = t.dataset.pick;
      document.querySelectorAll('.opt').forEach(b => b.classList.toggle('on', b === t));
      setTimeout(next, 320);
    }
  });

  document.addEventListener('input', e => {
    if (e.target.id === 'date') state.date = e.target.value;
    if (e.target.id === 'time') state.time = e.target.value;
    if (e.target.id === 'date' || e.target.id === 'time') $('#go').disabled = !(state.date && state.time);
  });

  /* ---------- ANO: krátká animace ---------- */
  function yes(btn) {
    const r = btn.getBoundingClientRect();
    const w = document.createElement('div');
    w.className = 'wipe';
    w.style.left = r.left + r.width / 2 + 'px';
    w.style.top = r.top + r.height / 2 + 'px';
    document.body.appendChild(w);
    requestAnimationFrame(() => {
      const big = Math.hypot(innerWidth, innerHeight) / 30;
      w.style.transform = `scale(${big})`;
    });
    setTimeout(() => { next(); w.style.opacity = 0; }, 480);
    setTimeout(() => w.remove(), 900);
  }

  /* ---------- Nepolapitelné NE ---------- */
  let lastFlee = 0;

  function flee(e) {
    if (e && e.cancelable) e.preventDefault();
    const no = $('#no'), yesBtn = $('#yes');
    if (!no || !yesBtn) return;
    const now = Date.now();
    if (now - lastFlee < 200) return;
    lastFlee = now;

    state.tries++;
    no.textContent = NO_LABELS[Math.min(Math.floor(state.tries / 2), NO_LABELS.length - 1)];

    if (!no.classList.contains('fled')) {          // první útěk: začni z původního místa
      const r = no.getBoundingClientRect();
      no.style.left = r.left + 'px';
      no.style.top = r.top + 'px';
      no.classList.add('fled');
      void no.offsetWidth;
    }
    placeNo(true);
  }

  function placeNo(avoidCurrent) {
    const no = $('#no'), yb = $('#yes');
    if (!no || !yb) return;
    const W = document.documentElement.clientWidth || innerWidth;
    const H = Math.min(innerHeight, document.documentElement.clientHeight || innerHeight);
    const m = 16, topMin = 24;
    const bw = no.offsetWidth, bh = no.offsetHeight;
    const y = yb.getBoundingClientRect(), c = no.getBoundingClientRect();
    const pad8 = 18;
    const bad = (x, t) => x < y.right + pad8 && x + bw > y.left - pad8 && t < y.bottom + pad8 && t + bh > y.top - pad8;
    let pos = null;
    for (let i = 0; i < 60 && !pos; i++) {
      const x = m + Math.random() * Math.max(0, W - bw - 2 * m);
      const t = topMin + Math.random() * Math.max(0, H - bh - topMin - m);
      if (bad(x, t)) continue;
      if (avoidCurrent && Math.hypot(x - c.left, t - c.top) < 120) continue;
      pos = [x, t];
    }
    if (!pos) {                                      // záloha: rohy obrazovky
      const corners = [[m, topMin], [W - bw - m, topMin], [m, H - bh - m], [W - bw - m, H - bh - m]];
      pos = corners.find(p => !bad(p[0], p[1])) || corners[0];
    }
    no.style.left = Math.max(m, Math.min(pos[0], W - bw - m)) + 'px';
    no.style.top = Math.max(m, Math.min(pos[1], H - bh - m)) + 'px';
  }

  function initRunaway() {
    state.tries = 0;
    const no = $('#no');
    no.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') flee(e); });
    no.addEventListener('pointerdown', flee);
    no.addEventListener('touchstart', flee, { passive: false });
    no.addEventListener('click', flee);
  }

  // myš: NE uteče už při přiblížení
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || state.step !== 'intro') return;
    const no = $('#no');
    if (!no) return;
    const r = no.getBoundingClientRect(), p = 50;
    if (e.clientX > r.left - p && e.clientX < r.right + p && e.clientY > r.top - p && e.clientY < r.bottom + p) flee(e);
  });

  window.addEventListener('resize', () => { const no = $('#no'); if (no && no.classList.contains('fled')) placeNo(false); });

  /* ---------- Kalendář (.ics) ---------- */
  const esc = s => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  function buildIcs() {
    const p = parts(), [hh, mm] = state.time.split(':').map(Number);
    const fmt = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const start = new Date(p.y, p.m - 1, p.d, hh, mm), end = new Date(p.y, p.m - 1, p.d, hh + 2, mm);
    const desc = [`Program: ${program()}`, ...state.acts.map(k => {
      const o = choice(k); return o ? `${ACT[k].name}: ${o[1]}` : null;
    }).filter(Boolean), '', 'Těším se.'].join('\n');
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rande//CS', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@rande`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
      `SUMMARY:${esc('Soňa & Matěj – rande')}`,
      `DESCRIPTION:${esc(desc)}`,
      'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Rande za hodinu', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
  }

  function downloadIcs() {
    const blob = new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (ios) { location.href = url; return; }       // Safari nabídne přidání do Kalendáře
    const a = document.createElement('a');
    a.href = url; a.download = 'rande.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  /* ---------- Konfety ---------- */
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = $('#fx'), ctx = cv.getContext('2d'), dpr = devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const colors = ['#FF6B4F', '#F4EFE6', '#8A2A40', '#F2C14E', '#B9B6AB'];
    const ps = Array.from({ length: 80 }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 80, y: innerHeight * .35,
      vx: (Math.random() - .5) * 11, vy: -Math.random() * 11 - 3,
      s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .4,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
    const t0 = performance.now();
    (function tick(t) {
      const k = (t - t0) / 2600;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (k >= 1) return;
      ctx.globalAlpha = Math.min(1, 2 - 2 * k);
      ps.forEach(p => {
        p.vy += .28; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
      });
      requestAnimationFrame(tick);
    })(t0);
  }

  $('#monoSlot').innerHTML = mono();
  render();
})();
