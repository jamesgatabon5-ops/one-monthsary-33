// ==============================================
// ⚙️ EDIT THIS: the date you two started
// Format: 'YYYY-MM-DD'
// ==============================================
const RELATIONSHIP_START = '2026-06-29';

// ==============================================
// PAGE NAVIGATION
// ==============================================
const pages = {
  mood: document.getElementById('mood'),
  opening: document.getElementById('opening'),
  picker: document.getElementById('picker'),
  letter: document.getElementById('letter'),
  wish: document.getElementById('wish'),
  letter2: document.getElementById('letter2'),
  wish2: document.getElementById('wish2'),
  letter3: document.getElementById('letter3'),
  wish3: document.getElementById('wish3'),
  letter4: document.getElementById('letter4'),
  wish4: document.getElementById('wish4'),
  letter5: document.getElementById('letter5'),
  wish5: document.getElementById('wish5'),
  wishpage: document.getElementById('wishpage'),
};

function goTo(name) {
  Object.values(pages).forEach(p => p.classList.remove('active'));
  pages[name].classList.add('active');
}

// opens the wish page showing the wish that belongs to galaxy n
function goToWishPage(n) {
  if (window.resetWishPage) window.resetWishPage(n);
  goTo('wishpage');
}

document.getElementById('next-btn').addEventListener('click', () => goTo('picker'));

// letter -> wish -> wish page chains, one per galaxy
const chains = [
  { toWish: 'to-wish-btn',  wishPage: 'wish',  toWishPage: 'to-wishpage-btn',  n: 1 },
  { toWish: 'to-wish2-btn', wishPage: 'wish2', toWishPage: 'to-wishpage-btn2', n: 2 },
  { toWish: 'to-wish3-btn', wishPage: 'wish3', toWishPage: 'to-wishpage-btn3', n: 3 },
  { toWish: 'to-wish4-btn', wishPage: 'wish4', toWishPage: 'to-wishpage-btn4', n: 4 },
  { toWish: 'to-wish5-btn', wishPage: 'wish5', toWishPage: 'to-wishpage-btn5', n: 5 },
];
chains.forEach(c => {
  document.getElementById(c.toWish).addEventListener('click', () => {
    startSpaceTravel(() => goTo(c.wishPage));
  });
  document.getElementById(c.toWishPage).addEventListener('click', () => goToWishPage(c.n));
});

document.querySelectorAll('.restart-btn').forEach(b => b.addEventListener('click', () => goTo('opening')));

// ==============================================
// SET THE MOOD — background music toggle
// Put your song next to index.html as music.mp3
// ==============================================
(function musicModule() {
  const btn = document.getElementById('music-btn');
  const skipBtn = document.getElementById('skip-music-btn');
  const label = btn.querySelector('.music-label');
  const audio = document.getElementById('bg-audio');
  let handled = false;
  let fadingOut = false;

  const TARGET_VOLUME = 0.55;
  const FADE_IN_MS = 2200;
  const FADE_OUT_SECONDS = 2.5;

  function fadeVolume(from, to, duration, onDone) {
    const steps = 40;
    const stepTime = duration / steps;
    let step = 0;
    audio.volume = from;
    const timer = setInterval(() => {
      step++;
      audio.volume = from + (to - from) * (step / steps);
      if (step >= steps) {
        clearInterval(timer);
        audio.volume = to;
        if (onDone) onDone();
      }
    }, stepTime);
  }

  function playWithFadeIn() {
    audio.volume = 0;
    return audio.play().then(() => {
      fadingOut = false;
      fadeVolume(0, TARGET_VOLUME, FADE_IN_MS);
    });
  }

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration || fadingOut) return;
    if (audio.duration - audio.currentTime <= FADE_OUT_SECONDS) {
      fadingOut = true;
      fadeVolume(audio.volume, 0, FADE_OUT_SECONDS * 1000);
    }
  });

  audio.addEventListener('ended', () => {
    audio.currentTime = 0;
    playWithFadeIn();
  });

  function proceed() {
    if (handled) return;
    handled = true;
    setTimeout(() => goTo('opening'), 500);
  }

  btn.addEventListener('click', () => {
    playWithFadeIn()
      .then(() => {
        btn.classList.add('playing');
        label.textContent = 'now playing';
        btn.setAttribute('aria-pressed', 'true');
        proceed();
      })
      .catch(() => {
        label.textContent = 'add music.mp3';
        setTimeout(() => { label.textContent = 'set the mood'; }, 2200);
        proceed();
      });
  });

  skipBtn.addEventListener('click', proceed);
})();

// ==============================================
// STARFIELD (shared helper)
// ==============================================
function initStarfield(canvasId, starCount) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  let w, h, stars;

  function resize() {
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;
  }

  function makeStars() {
    stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 * devicePixelRatio + 0.3,
        baseAlpha: Math.random() * 0.6 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const alpha = s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.phase) * 0.3;
      ctx.beginPath();
      ctx.fillStyle = `rgba(244, 242, 255, ${Math.max(0, Math.min(1, alpha))})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  makeStars();
  window.addEventListener('resize', () => { resize(); makeStars(); });
  requestAnimationFrame(draw);
}

initStarfield('mood-stars', 160);
initStarfield('stars-canvas', 160);
initStarfield('letter-stars', 90);
initStarfield('wish-stars', 90);
initStarfield('letter2-stars', 90);
initStarfield('wish2-stars', 90);
initStarfield('letter3-stars', 90);
initStarfield('wish3-stars', 90);
initStarfield('letter4-stars', 90);
initStarfield('wish4-stars', 90);
initStarfield('letter5-stars', 90);
initStarfield('wish5-stars', 90);
initStarfield('wishpage-stars', 90);

// ==============================================
// LIVE "DAYS TOGETHER" COUNTER
// ==============================================
(function daysCounterModule() {
  const numEl = document.getElementById('days-num');
  const start = new Date(`${RELATIONSHIP_START}T00:00:00`);

  function tick() {
    const diffMs = Date.now() - start.getTime();
    numEl.textContent = Math.max(0, Math.floor(diffMs / 86400000));
  }

  tick();
  setInterval(tick, 60000);
})();

// ==============================================
// GALAXY PICKER — five galaxies spread evenly over an
// invisible sphere. Drag to rotate it (it also auto-rotates);
// tap a galaxy to open its letters:
//   • spiral (cyan/violet)      -> #letter
//   • globular (gold/amber)     -> #letter2
//   • blossom (pink)            -> #letter3
//   • starry night (blue/gold)  -> #letter4
//   • twilight (pink + blue)    -> #letter5
// ==============================================
(function galaxyModule() {
  const canvas = document.getElementById('galaxy-canvas');
  const ctx = canvas.getContext('2d');
  const pickerSection = document.getElementById('picker');
  let w, h;
  let bgStars = [];

  const GALAXY_SCALE = 0.13; // size of each galaxy (fraction of shorter side)
  const SPHERE_SCALE = 0.33;  // radius of the invisible sphere
  const TAG_GAP = 26;         // css px between a galaxy and its tag

  // evenly spreads n anchors over a sphere (works for any galaxy count)
  function fib(i, n) {
    const y = 1 - ((i + 0.5) * 2) / n;
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.399963; // golden angle
    return { x: Math.cos(a) * r, y, z: Math.sin(a) * r };
  }

  const base = {
    rotation: 0,
    tiltX: 0, tiltY: 0, targetTiltX: 0, targetTiltY: 0,
  };

  const galaxies = [
    {
      ...base, id: 'spiral', type: 'spiral', anchor: fib(0, 5),
      tagEl: document.getElementById('galaxy-tag-1'),
      targetPage: 'letter', angularVelocity: 0.0018, particles: [],
      glowInner: 'rgba(255, 250, 240, 0.3)',
      glowMid: 'rgba(140, 160, 255, 0.11)',
    },
    {
      ...base, id: 'globular', type: 'globular', anchor: fib(1, 5),
      tagEl: document.getElementById('galaxy-tag-2'),
      targetPage: 'letter2', angularVelocity: 0.0032, particles: [],
      glowInner: 'rgba(255, 238, 210, 0.32)',
      glowMid: 'rgba(255, 180, 120, 0.12)',
    },
    {
      ...base, id: 'blossom', type: 'blossom', anchor: fib(2, 5),
      tagEl: document.getElementById('galaxy-tag-3'),
      targetPage: 'letter3', angularVelocity: 0.0025, particles: [],
      glowInner: 'rgba(255, 240, 245, 0.32)',
      glowMid: 'rgba(255, 150, 190, 0.13)',
    },
    {
      ...base, id: 'starry', type: 'starry', anchor: fib(3, 5),
      tagEl: document.getElementById('galaxy-tag-4'),
      targetPage: 'letter4', angularVelocity: 0.0022, particles: [],
      glowInner: 'rgba(255, 233, 160, 0.26)',
      glowMid: 'rgba(58, 107, 209, 0.18)',
    },
    {
      ...base, id: 'twilight', type: 'twilight', anchor: fib(4, 5),
      tagEl: document.getElementById('galaxy-tag-5'),
      targetPage: 'letter5', angularVelocity: 0.0027, particles: [],
      glowInner: 'rgba(240, 225, 255, 0.32)',
      glowMid: 'rgba(150, 70, 200, 0.22)',
    },
  ];

  let selected = false;

  // whole-sphere rotation state
  let systemRotY = Math.random() * Math.PI * 2;
  let systemRotX = -0.18;
  let systemSpinVelocity = 0;
  const SYSTEM_AUTOSPIN = 0.00035;
  const SYSTEM_TILT_MIN = -0.9;
  const SYSTEM_TILT_MAX = 0.55;

  function resize() {
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;

    const coreRadius = Math.min(w, h) * GALAXY_SCALE;
    for (const g of galaxies) {
      g.coreRadius = coreRadius;
      if (g.type === 'spiral') buildSpiralParticles(g);
      else if (g.type === 'starry') buildStarryParticles(g);
      else if (g.type === 'twilight') buildTwilightParticles(g);
      else buildClusterParticles(g);
    }
    buildBgStars();
    layoutSystem();
  }

  function positionTag(g) {
    if (!g.tagEl) return;
    const cssRadius = (g.coreRadius * g.depthScale) / devicePixelRatio;
    g.tagEl.style.left = `${g.cx / devicePixelRatio}px`;
    g.tagEl.style.top = `${g.cy / devicePixelRatio + cssRadius + TAG_GAP}px`;
    g.tagEl.style.opacity = (0.5 + g.depthAlpha * 0.4).toFixed(2);
  }

  function layoutSystem() {
    const R = Math.min(w, h) * SPHERE_SCALE;
    const cosY = Math.cos(systemRotY), sinY = Math.sin(systemRotY);
    const cosX = Math.cos(systemRotX), sinX = Math.sin(systemRotX);

    for (const g of galaxies) {
      const { x: ux, y: uy, z: uz } = g.anchor;

      const x1 = ux * cosY - uz * sinY;
      const z1 = ux * sinY + uz * cosY;
      const y2 = uy * cosX - z1 * sinX;
      const z2 = uy * sinX + z1 * cosX;

      g.cx = w / 2 + x1 * R;
      g.cy = h / 2 + y2 * R;

      const depthNorm = (z2 + 1) / 2; // 0 = far, 1 = near
      g.depthAlpha = 0.45 + depthNorm * 0.55;
      g.depthScale = 0.78 + depthNorm * 0.32;
      g.depthOrder = z2;

      positionTag(g);
    }
  }

  function buildSpiralParticles(g) {
    g.particles = [];
    const coreRadius = g.coreRadius;
    const arms = 3;
    const particlesPerArm = 200;
    for (let a = 0; a < arms; a++) {
      const armOffset = (a / arms) * Math.PI * 2;
      for (let i = 0; i < particlesPerArm; i++) {
        const t = i / particlesPerArm;
        const radius = t * coreRadius;
        const angle = armOffset + t * 3.1 + (Math.random() - 0.5) * 0.5;
        const jitter = (Math.random() - 0.5) * coreRadius * 0.24 * (0.35 + t);

        let color;
        if (t < 0.15) color = 'rgba(255, 250, 240, ALPHA)';
        else if (Math.random() < 0.5) color = 'rgba(127, 217, 255, ALPHA)';
        else color = 'rgba(140, 120, 255, ALPHA)';

        g.particles.push({
          radius: radius + jitter,
          angle,
          size: (Math.random() * 1.5 + 0.6) * devicePixelRatio * (1.25 - t * 0.45),
          alpha: Math.random() * 0.45 + 0.5,
          color,
          twinkleSpeed: Math.random() * 0.02 + 0.006,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  // starry night: tight wavy double swirl in Van Gogh blues and golds
  function buildStarryParticles(g) {
    g.particles = [];
    const R = g.coreRadius;
    const arms = 2;
    const perArm = 280;
    for (let a = 0; a < arms; a++) {
      const armOffset = (a / arms) * Math.PI * 2;
      for (let i = 0; i < perArm; i++) {
        const t = i / perArm;
        const angle = armOffset + t * 5.2 + Math.sin(t * 14) * 0.22 + (Math.random() - 0.5) * 0.35;
        const jitter = (Math.random() - 0.5) * R * 0.26 * (0.35 + t);

        const m = Math.random();
        let color;
        if (t < 0.12)      color = 'rgba(255, 233, 160, ALPHA)';
        else if (m < 0.18) color = 'rgba(246, 213, 92, ALPHA)';
        else if (m < 0.55) color = 'rgba(58, 107, 209, ALPHA)';
        else if (m < 0.85) color = 'rgba(122, 170, 255, ALPHA)';
        else               color = 'rgba(150, 215, 220, ALPHA)';

        g.particles.push({
          radius: t * R + jitter,
          angle,
          size: (Math.random() * 1.5 + 0.6) * devicePixelRatio * (1.25 - t * 0.45),
          alpha: Math.random() * 0.45 + 0.5,
          color,
          twinkleSpeed: Math.random() * 0.02 + 0.006,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  // twilight: four soft arms in lavender, deep purple, magenta and indigo
  function buildTwilightParticles(g) {
    g.particles = [];
    const R = g.coreRadius;
    const arms = 4;
    const perArm = 200;
    for (let a = 0; a < arms; a++) {
      const armOffset = (a / arms) * Math.PI * 2;
      const pinkArm = a % 2 === 0;
      for (let i = 0; i < perArm; i++) {
        const t = i / perArm;
        const angle = armOffset + t * 3.6 + (Math.random() - 0.5) * 0.45;
        const jitter = (Math.random() - 0.5) * R * 0.24 * (0.35 + t);

        const m = Math.random();
        let color;
        if (t < 0.13)      color = 'rgba(240, 225, 255, ALPHA)';        // pale lilac core
        else if (pinkArm)  color = m < 0.55 ? 'rgba(200, 150, 235, ALPHA)'   // lavender
                                 : m < 0.8  ? 'rgba(225, 70, 145, ALPHA)'    // magenta
                                            : 'rgba(115, 55, 165, ALPHA)';   // deep purple
        else               color = m < 0.45 ? 'rgba(115, 55, 165, ALPHA)'    // deep purple
                                 : m < 0.75 ? 'rgba(200, 150, 235, ALPHA)'   // lavender
                                            : 'rgba(80, 90, 175, ALPHA)';    // indigo blue

        g.particles.push({
          radius: t * R + jitter,
          angle,
          size: (Math.random() * 1.5 + 0.6) * devicePixelRatio * (1.25 - t * 0.45),
          alpha: Math.random() * 0.45 + 0.5,
          color,
          twinkleSpeed: Math.random() * 0.02 + 0.006,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  // shared builder for the 3D point-cloud galaxies (globular + blossom)
  function buildClusterParticles(g) {
    g.particles = [];
    const coreRadius = g.coreRadius;
    const count = 650;
    for (let i = 0; i < count; i++) {
      const u = Math.pow(Math.random(), 1.7);
      const r = coreRadius * u;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const coreness = 1 - r / coreRadius;
      let color;
      if (g.type === 'blossom') {
        if (coreness > 0.72) color = 'rgba(255, 240, 245, ALPHA)';
        else if (Math.random() < 0.6) color = 'rgba(255, 179, 209, ALPHA)';
        else color = 'rgba(255, 133, 178, ALPHA)';
      } else {
        if (coreness > 0.72) color = 'rgba(255, 248, 232, ALPHA)';
        else if (Math.random() < 0.6) color = 'rgba(255, 217, 160, ALPHA)';
        else color = 'rgba(255, 159, 107, ALPHA)';
      }

      g.particles.push({
        x, y, z,
        size: (Math.random() * 1.4 + 0.6) * devicePixelRatio * (0.8 + coreness * 0.75),
        alpha: Math.random() * 0.4 + 0.5,
        color,
        twinkleSpeed: Math.random() * 0.02 + 0.006,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function buildBgStars() {
    bgStars = [];
    for (let i = 0; i < 140; i++) {
      bgStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 * devicePixelRatio + 0.2,
        alpha: Math.random() * 0.5 + 0.15,
      });
    }
  }

  function drawCoreGlow(g, radius) {
    const grad = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, radius * 1.15);
    grad.addColorStop(0, g.glowInner);
    grad.addColorStop(0.4, g.glowMid);
    grad.addColorStop(1, 'rgba(10, 15, 44, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, radius * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // flat swirling disc — used by spiral, starry and twilight
  function drawSpiral(g, t) {
    const radius = g.coreRadius * g.depthScale;
    drawCoreGlow(g, radius);

    g.tiltX += (g.targetTiltX - g.tiltX) * 0.04;
    g.tiltY += (g.targetTiltY - g.tiltY) * 0.04;

    if (!selected) g.rotation += g.angularVelocity;

    const squash = 0.66 + g.tiltY * 0.18;
    const scale = g.depthScale;

    for (const p of g.particles) {
      const ang = p.angle + g.rotation;
      const x = g.cx + Math.cos(ang) * p.radius * scale + g.tiltX * 8;
      const y = g.cy + Math.sin(ang) * p.radius * scale * squash;
      const flicker = p.alpha + Math.sin(t * p.twinkleSpeed + p.phase) * 0.25;
      const a = Math.max(0.05, Math.min(1, flicker * g.depthAlpha));
      ctx.beginPath();
      ctx.fillStyle = p.color.replace('ALPHA', a.toFixed(2));
      ctx.arc(x, y, p.size * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3D point-cloud renderer (globular + blossom)
  function drawCluster(g, t) {
    const radius = g.coreRadius * g.depthScale;
    drawCoreGlow(g, radius);

    g.tiltX += (g.targetTiltX - g.tiltX) * 0.04;
    g.tiltY += (g.targetTiltY - g.tiltY) * 0.04;

    if (!selected) g.rotation += g.angularVelocity;

    const focal = g.coreRadius * 2.6;
    const cosA = Math.cos(g.rotation);
    const sinA = Math.sin(g.rotation);
    const cosT = Math.cos(g.tiltY * 0.4);
    const sinT = Math.sin(g.tiltY * 0.4);

    const projected = [];
    for (const p of g.particles) {
      let rx = p.x * cosA - p.z * sinA;
      let rz = p.x * sinA + p.z * cosA;
      let ry = p.y * cosT - rz * sinT;
      rz = p.y * sinT + rz * cosT;

      const scale = focal / (focal + rz);
      const sx = g.cx + rx * scale * g.depthScale + g.tiltX * 6;
      const sy = g.cy + ry * scale * g.depthScale;
      projected.push({ p, sx, sy, rz, scale });
    }
    projected.sort((a, b) => b.rz - a.rz);

    for (const { p, sx, sy, scale } of projected) {
      const localDepthAlpha = Math.max(0.15, Math.min(1, 0.55 + scale * 0.5));
      const flicker = p.alpha + Math.sin(t * p.twinkleSpeed + p.phase) * 0.2;
      const finalAlpha = Math.max(0.04, Math.min(1, flicker * localDepthAlpha * g.depthAlpha));
      ctx.beginPath();
      ctx.fillStyle = p.color.replace('ALPHA', finalAlpha.toFixed(2));
      ctx.arc(sx, sy, p.size * scale * g.depthScale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);

    for (const s of bgStars) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(244, 242, 255, ${s.alpha})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!selected && !systemPointerDown) {
      systemRotY += SYSTEM_AUTOSPIN + systemSpinVelocity;
      systemSpinVelocity *= 0.95;
    }
    if (!selected) layoutSystem();

    // farthest first, nearest last
    const order = [...galaxies].sort((a, b) => a.depthOrder - b.depthOrder);
    for (const g of order) {
      if (g.type === 'globular' || g.type === 'blossom') drawCluster(g, t);
      else drawSpiral(g, t);
    }

    requestAnimationFrame(draw);
  }

  // ---- pointer interaction: drag to rotate, tap a galaxy to open it ----
  function galaxyAt(x, y) {
    let closest = null;
    let closestDist = Infinity;
    for (const g of galaxies) {
      const cssCx = g.cx / devicePixelRatio;
      const cssCy = g.cy / devicePixelRatio;
      const cssR = (g.coreRadius * g.depthScale / devicePixelRatio) * 1.9;
      const dist = Math.hypot(x - cssCx, y - cssCy);
      if (dist <= cssR && dist < closestDist) {
        closest = g;
        closestDist = dist;
      }
    }
    return closest;
  }

  let systemPointerDown = false;
  let dragging = false;
  let lastX = 0, lastY = 0, downX = 0, downY = 0, downTime = 0;
  let downGalaxy = null;

  function pointerDown(x, y) {
    if (selected) return;
    const rect = canvas.getBoundingClientRect();
    const lx = x - rect.left;
    const ly = y - rect.top;
    systemPointerDown = true;
    dragging = false;
    lastX = lx; lastY = ly;
    downX = lx; downY = ly;
    downTime = Date.now();
    downGalaxy = galaxyAt(lx, ly);
    pickerSection.classList.add('grabbing');
  }

  function pointerMove(x, y) {
    const rect = canvas.getBoundingClientRect();
    const lx = x - rect.left;
    const ly = y - rect.top;

    // subtle cursor-follow warp
    for (const g of galaxies) {
      const cssCx = g.cx / devicePixelRatio;
      const cssCy = g.cy / devicePixelRatio;
      const cssR = (g.coreRadius / devicePixelRatio) * 3;
      g.targetTiltX = Math.max(-1, Math.min(1, (lx - cssCx) / cssR));
      g.targetTiltY = Math.max(-1, Math.min(1, (ly - cssCy) / cssR));
    }

    if (systemPointerDown) {
      const dx = lx - lastX;
      const dy = ly - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 2) dragging = true;

      if (dragging) {
        systemRotY += dx * 0.006;
        systemRotX = Math.max(SYSTEM_TILT_MIN, Math.min(SYSTEM_TILT_MAX, systemRotX + dy * 0.005));
        systemSpinVelocity = dx * 0.0006;
        layoutSystem();
      }
      lastX = lx; lastY = ly;
    }
  }

  function pointerUp(x, y) {
    if (!systemPointerDown) return;
    const rect = canvas.getBoundingClientRect();
    const lx = x - rect.left;
    const ly = y - rect.top;

    systemPointerDown = false;
    pickerSection.classList.remove('grabbing');

    const dist = Math.hypot(lx - downX, ly - downY);
    const elapsed = Date.now() - downTime;

    if (!selected && !dragging && dist < 12 && elapsed < 500 && downGalaxy) {
      selectGalaxy(downGalaxy);
    }
    downGalaxy = null;
  }

  canvas.addEventListener('mousedown', e => pointerDown(e.clientX, e.clientY));
  window.addEventListener('mousemove', e => pointerMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', e => pointerUp(e.clientX, e.clientY));

  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    pointerDown(t.clientX, t.clientY);
  }, { passive: true });

  canvas.addEventListener('touchmove', e => {
    const t = e.touches[0];
    pointerMove(t.clientX, t.clientY);
  }, { passive: true });

  canvas.addEventListener('touchend', e => {
    const t = e.changedTouches[0];
    pointerUp(t.clientX, t.clientY);
  });

  // ---- selection: flash white, then reveal that galaxy's letter ----
  function selectGalaxy(g) {
    selected = true;
    const flash = document.getElementById('flash-overlay');
    flash.style.transition = 'opacity 0.55s ease-in';
    flash.style.opacity = '1';

    setTimeout(() => {
      goTo(g.targetPage);
      setTimeout(() => {
        flash.style.transition = 'opacity 1.1s ease-out';
        flash.style.opacity = '0';
        setTimeout(() => { selected = false; }, 400);
      }, 120);
    }, 550);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(draw);
})();

// ==============================================
// MAKE A WISH — click the star to reveal the wish note
// ==============================================
(function wishOrbModule() {
  const orb = document.getElementById('wish-orb');
  const prompt = document.getElementById('wish-prompt');
  const notes = document.querySelectorAll('.wish-note');
  const flash = document.getElementById('flash-overlay');
  let granted = false;
  let activeNote = null;

  window.resetWishPage = function (n) {
    granted = false;
    notes.forEach(el => el.classList.remove('show', 'ready'));
    activeNote = document.querySelector(`.wish-note[data-galaxy="${n}"]`);
    if (activeNote) activeNote.classList.add('ready');

    orb.classList.remove('granted');
    orb.style.display = '';
    prompt.style.display = '';
    prompt.classList.remove('hidden');
  };
  window.resetWishPage(1);

  function makeWish() {
    if (granted || !activeNote) return;
    granted = true;

    orb.classList.add('granted');
    prompt.classList.add('hidden');

    flash.style.transition = 'opacity 0.6s ease-in';
    flash.style.opacity = '1';

    setTimeout(() => {
      activeNote.classList.add('show');
      flash.style.transition = 'opacity 1.2s ease-out';
      flash.style.opacity = '0';
      orb.style.display = 'none';
      prompt.style.display = 'none';
    }, 550);
  }

  orb.addEventListener('click', makeWish);
  orb.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      makeWish();
    }
  });
})();

// ==============================================
// SPACE TRAVEL — warp transition between letters
// ==============================================
const startSpaceTravel = (function spaceTravelModule() {
  const overlay = document.getElementById('travel-overlay');
  const canvas = document.getElementById('travel-canvas');
  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w, h, cx, cy, particles = [];
  let rafId = null;

  function resize() {
    w = canvas.width = window.innerWidth * devicePixelRatio;
    h = canvas.height = window.innerHeight * devicePixelRatio;
    cx = w / 2;
    cy = h / 2;
  }

  function freshParticle() {
    return {
      x: (Math.random() - 0.5) * w,
      y: (Math.random() - 0.5) * h,
      z: Math.random() * w + w * 0.3,
    };
  }

  function seedParticles(count) {
    particles = [];
    for (let i = 0; i < count; i++) particles.push(freshParticle());
  }

  function frame() {
    ctx.fillStyle = 'rgba(3, 3, 8, 0.32)';
    ctx.fillRect(0, 0, w, h);

    const focal = w * 0.55;
    const speed = w * 0.028;

    for (const p of particles) {
      const prevZ = p.z;
      p.z -= speed;

      if (p.z < 1) {
        Object.assign(p, freshParticle());
        p.z = w + w * 0.3;
        continue;
      }

      const sx = cx + (p.x / p.z) * focal;
      const sy = cy + (p.y / p.z) * focal;
      const psx = cx + (p.x / prevZ) * focal;
      const psy = cy + (p.y / prevZ) * focal;

      const depth = Math.max(0, Math.min(1, 1 - p.z / (w + w * 0.3)));
      ctx.strokeStyle = `rgba(190, 224, 255, ${0.15 + depth * 0.75})`;
      ctx.lineWidth = Math.max(0.5, depth * 2.4) * devicePixelRatio;
      ctx.beginPath();
      ctx.moveTo(psx, psy);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }

    rafId = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);

  return function startSpaceTravel(onArrive) {
    if (reducedMotion) {
      onArrive();
      return;
    }

    seedParticles(240);
    overlay.classList.add('active');
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(frame);

    setTimeout(onArrive, 1500);

    setTimeout(() => {
      overlay.classList.remove('active');
      cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, w, h);
    }, 2050);
  };
})();