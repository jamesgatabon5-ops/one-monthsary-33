// ==============================================
// ⚙️ EDIT THIS: the date you two started
// Format: 'YYYY-MM-DD'
// Example: relationship started June 14, 2026 -> '2026-06-14'
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
  wishpage: document.getElementById('wishpage'),
};

function goTo(name) {
  Object.values(pages).forEach(p => p.classList.remove('active'));
  pages[name].classList.add('active');
}

document.getElementById('next-btn').addEventListener('click', () => {
  goTo('picker');
});

// 1st galaxy letter chain
document.getElementById('to-wish-btn').addEventListener('click', () => {
  startSpaceTravel(() => goTo('wish'));
});
document.getElementById('to-wishpage-btn').addEventListener('click', () => {
  goTo('wishpage');
});

// 2nd galaxy letter chain
document.getElementById('to-wish2-btn').addEventListener('click', () => {
  startSpaceTravel(() => goTo('wish2'));
});
document.getElementById('to-wishpage-btn2').addEventListener('click', () => {
  goTo('wishpage');
});

document.getElementById('restart-btn').addEventListener('click', () => {
  goTo('opening');
});

// ==============================================
// SET THE MOOD — background music toggle
// Drop your own song file into the folder and point
// the <audio> source (in index.html) at it.
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
  const FADE_OUT_SECONDS = 2.5; // start fading this many seconds before the track ends

  // smoothly ramps audio.volume from `from` to `to` over `duration` ms
  function fadeVolume(from, to, duration, onDone) {
    const steps = 40;
    const stepTime = duration / steps;
    let step = 0;
    audio.volume = from;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      audio.volume = from + (to - from) * progress;
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

  // smooth, seamless-feeling loop: fade out just before the track ends,
  // then restart from the top with a fresh fade-in
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration || fadingOut) return;
    const remaining = audio.duration - audio.currentTime;
    if (remaining <= FADE_OUT_SECONDS) {
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
        // No music file has been added yet, or the browser blocked it.
        label.textContent = 'add music.mp3';
        setTimeout(() => { label.textContent = 'set the mood'; }, 2200);
        proceed();
      });
  });

  skipBtn.addEventListener('click', () => {
    proceed();
  });
})();

// ==============================================
// STARFIELD (shared helper, used on opening + letter pages)
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
initStarfield('wishpage-stars', 90);

// ==============================================
// LIVE "DAYS TOGETHER" COUNTER
// ==============================================
(function daysCounterModule() {
  const numEl = document.getElementById('days-num');
  const start = new Date(`${RELATIONSHIP_START}T00:00:00`);

  function tick() {
    const diffMs = Date.now() - start.getTime();
    const days = Math.max(0, Math.floor(diffMs / 86400000));
    numEl.textContent = days;
  }

  tick();
  setInterval(tick, 60000); // refresh every minute, rolls over at midnight
})();


// ==============================================
// GALAXY PICKER (page 2) — two independent, clickable
// clusters on one canvas:
//   • galaxy 1 — a small spiral galaxy   -> "1st galaxy" -> #letter
//   • galaxy 2 — a spherical / globular cluster -> "2nd galaxy" -> #letter2
// ==============================================
(function galaxyModule() {
  const canvas = document.getElementById('galaxy-canvas');
  const ctx = canvas.getContext('2d');
  const pickerSection = document.getElementById('picker');
  let w, h;
  let bgStars = [];

  // how much of the shorter canvas side each galaxy fills —
  // smaller number = smaller, more minimalist galaxy
  const GALAXY_SCALE = 0.13;
  const TAG_GAP = 26; // css px between a galaxy's outer edge and its tag

  // ---- the two galaxy definitions ----
  // xFrac / yFrac position each galaxy's center as a fraction of the canvas
  const galaxies = [
    {
      id: 'spiral',
      type: 'spiral',
      xFrac: 0.30,
      yFrac: 0.5,
      tagEl: document.getElementById('galaxy-tag-1'),
      targetPage: 'letter',
      rotation: 0,
      angularVelocity: 0.0018,
      dragVelocity: 0,
      tiltX: 0, tiltY: 0, targetTiltX: 0, targetTiltY: 0,
      isPointerDown: false, dragging: false,
      lastX: 0, lastY: 0, downX: 0, downY: 0, downTime: 0,
      particles: [],
    },
    {
      id: 'globular',
      type: 'globular',
      xFrac: 0.70,
      yFrac: 0.5,
      tagEl: document.getElementById('galaxy-tag-2'),
      targetPage: 'letter2',
      rotation: 0,
      angularVelocity: 0.0032,
      dragVelocity: 0,
      tiltX: 0, tiltY: 0, targetTiltX: 0, targetTiltY: 0,
      isPointerDown: false, dragging: false,
      lastX: 0, lastY: 0, downX: 0, downY: 0, downTime: 0,
      particles: [],
    },
  ];

  let selected = false;

  function resize() {
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;

    const coreRadius = Math.min(w, h) * GALAXY_SCALE;
    for (const g of galaxies) {
      g.cx = w * g.xFrac;
      g.cy = h * g.yFrac;
      g.coreRadius = coreRadius;
      if (g.type === 'spiral') buildSpiralParticles(g);
      else buildGlobularParticles(g);
      positionTag(g);
    }
    buildBgStars();
  }

  // keeps each galaxy's tag centered under its (responsive) sphere/spiral
  function positionTag(g) {
    if (!g.tagEl) return;
    const cssRadius = g.coreRadius / devicePixelRatio;
    const cssCx = g.cx / devicePixelRatio;
    const cssCy = g.cy / devicePixelRatio;
    g.tagEl.style.left = `${cssCx}px`;
    g.tagEl.style.top = `${cssCy + cssRadius + TAG_GAP}px`;
  }

  function buildSpiralParticles(g) {
    g.particles = [];
    const coreRadius = g.coreRadius;
    const arms = 3;
    const particlesPerArm = 130; // fewer particles -> a sparser, cleaner look
    for (let a = 0; a < arms; a++) {
      const armOffset = (a / arms) * Math.PI * 2;
      for (let i = 0; i < particlesPerArm; i++) {
        const t = i / particlesPerArm;                 // 0..1 along arm
        const radius = t * coreRadius;
        const spin = t * 3.1;                            // spiral tightness
        const angle = armOffset + spin + (Math.random() - 0.5) * 0.5;
        const jitter = (Math.random() - 0.5) * coreRadius * 0.16 * (0.3 + t);

        const hueMix = Math.random();
        let color;
        if (t < 0.15) {
          color = `rgba(255, 250, 240, ALPHA)`;          // warm white core
        } else if (hueMix < 0.5) {
          color = `rgba(127, 217, 255, ALPHA)`;          // cyan
        } else {
          color = `rgba(140, 120, 255, ALPHA)`;          // violet
        }

        g.particles.push({
          radius: radius + jitter,
          angle,
          size: (Math.random() * 1.3 + 0.35) * devicePixelRatio * (1.2 - t * 0.5),
          alpha: Math.random() * 0.5 + 0.4,
          color,
          twinkleSpeed: Math.random() * 0.02 + 0.006,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  // a dense, spherical globular cluster: points distributed inside a
  // sphere (concentrated toward the core) and rotated in true 3D so it
  // reads as a solid, rounded shape rather than a flat disc
  function buildGlobularParticles(g) {
    g.particles = [];
    const coreRadius = g.coreRadius;
    const count = 420;
    for (let i = 0; i < count; i++) {
      // bias points toward the center for a bright, dense core
      const u = Math.pow(Math.random(), 1.7);
      const r = coreRadius * u;
      const theta = Math.random() * Math.PI * 2;       // azimuth
      const phi = Math.acos(2 * Math.random() - 1);    // polar

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const coreness = 1 - r / coreRadius; // 1 at center, 0 at edge
      let color;
      if (coreness > 0.72) {
        color = `rgba(255, 248, 232, ALPHA)`;   // warm white-gold core
      } else if (Math.random() < 0.6) {
        color = `rgba(255, 217, 160, ALPHA)`;   // gold
      } else {
        color = `rgba(255, 159, 107, ALPHA)`;   // amber
      }

      g.particles.push({
        x, y, z,
        size: (Math.random() * 1.2 + 0.35) * devicePixelRatio * (0.7 + coreness * 0.7),
        alpha: Math.random() * 0.45 + 0.4,
        color,
        twinkleSpeed: Math.random() * 0.02 + 0.006,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function buildBgStars() {
    // distant background stars, unaffected by rotation, for depth
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

  function drawCoreGlow(g, colorInner, colorMid) {
    const grad = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, g.coreRadius * 0.95);
    grad.addColorStop(0, colorInner);
    grad.addColorStop(0.35, colorMid);
    grad.addColorStop(1, 'rgba(10, 15, 44, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, g.coreRadius * 1.05, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSpiral(g, t) {
    drawCoreGlow(g, 'rgba(255, 250, 240, 0.3)', 'rgba(140, 160, 255, 0.11)');

    g.tiltX += (g.targetTiltX - g.tiltX) * 0.04;
    g.tiltY += (g.targetTiltY - g.tiltY) * 0.04;

    if (!selected) {
      g.rotation += g.angularVelocity + g.dragVelocity;
      g.dragVelocity *= 0.94;
    }

    const squash = 0.62 + g.tiltY * 0.18;

    for (const p of g.particles) {
      const ang = p.angle + g.rotation;
      const x = g.cx + Math.cos(ang) * p.radius + g.tiltX * 8;
      const y = g.cy + Math.sin(ang) * p.radius * squash;
      const flicker = p.alpha + Math.sin(t * p.twinkleSpeed + p.phase) * 0.25;
      ctx.beginPath();
      ctx.fillStyle = p.color.replace('ALPHA', Math.max(0.08, Math.min(1, flicker)).toFixed(2));
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGlobular(g, t) {
    drawCoreGlow(g, 'rgba(255, 238, 210, 0.32)', 'rgba(255, 180, 120, 0.12)');

    g.tiltX += (g.targetTiltX - g.tiltX) * 0.04;
    g.tiltY += (g.targetTiltY - g.tiltY) * 0.04;

    if (!selected) {
      g.rotation += g.angularVelocity + g.dragVelocity;
      g.dragVelocity *= 0.94;
    }

    const focal = g.coreRadius * 2.6;
    const cosA = Math.cos(g.rotation);
    const sinA = Math.sin(g.rotation);
    const cosT = Math.cos(g.tiltY * 0.4);
    const sinT = Math.sin(g.tiltY * 0.4);

    // sort back-to-front so nearer points draw on top
    const projected = [];
    for (const p of g.particles) {
      // rotate around Y axis (left/right spin)
      let rx = p.x * cosA - p.z * sinA;
      let rz = p.x * sinA + p.z * cosA;
      // subtle secondary tilt around X axis, following the cursor
      let ry = p.y * cosT - rz * sinT;
      rz = p.y * sinT + rz * cosT;

      const scale = focal / (focal + rz);
      const sx = g.cx + rx * scale + g.tiltX * 6;
      const sy = g.cy + ry * scale;
      projected.push({ p, sx, sy, rz, scale });
    }
    projected.sort((a, b) => b.rz - a.rz);

    for (const { p, sx, sy, scale } of projected) {
      const depthAlpha = Math.max(0.15, Math.min(1, 0.55 + scale * 0.5));
      const flicker = p.alpha + Math.sin(t * p.twinkleSpeed + p.phase) * 0.2;
      const finalAlpha = Math.max(0.06, Math.min(1, flicker * depthAlpha));
      ctx.beginPath();
      ctx.fillStyle = p.color.replace('ALPHA', finalAlpha.toFixed(2));
      ctx.arc(sx, sy, p.size * scale, 0, Math.PI * 2);
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

    for (const g of galaxies) {
      if (g.type === 'spiral') drawSpiral(g, t);
      else drawGlobular(g, t);
    }

    requestAnimationFrame(draw);
  }

  // ---- pointer interaction: drag the nearest galaxy to spin it, tap to open ----
  function galaxyAt(x, y) {
    // x, y in CSS px relative to canvas
    let closest = null;
    let closestDist = Infinity;
    for (const g of galaxies) {
      const cssCx = g.cx / devicePixelRatio;
      const cssCy = g.cy / devicePixelRatio;
      const cssR = (g.coreRadius / devicePixelRatio) * 1.9; // generous hit area
      const dist = Math.hypot(x - cssCx, y - cssCy);
      if (dist <= cssR && dist < closestDist) {
        closest = g;
        closestDist = dist;
      }
    }
    return closest;
  }

  let activeDrag = null;

  function pointerDown(x, y) {
    if (selected) return;
    const rect = canvas.getBoundingClientRect();
    const lx = x - rect.left;
    const ly = y - rect.top;
    const g = galaxyAt(lx, ly);
    if (!g) return;
    activeDrag = g;
    g.isPointerDown = true;
    g.dragging = false;
    g.lastX = lx; g.lastY = ly;
    g.downX = lx; g.downY = ly;
    g.downTime = Date.now();
    pickerSection.classList.add('grabbing');
  }

  function pointerMove(x, y) {
    const rect = canvas.getBoundingClientRect();
    const lx = x - rect.left;
    const ly = y - rect.top;

    // cursor-follow glide (parallax) for every galaxy, always active
    for (const g of galaxies) {
      const cssCx = g.cx / devicePixelRatio;
      const cssCy = g.cy / devicePixelRatio;
      const cssR = (g.coreRadius / devicePixelRatio) * 3;
      const nx = Math.max(-1, Math.min(1, (lx - cssCx) / cssR));
      const ny = Math.max(-1, Math.min(1, (ly - cssCy) / cssR));
      g.targetTiltX = nx;
      g.targetTiltY = ny;
    }

    if (activeDrag && activeDrag.isPointerDown) {
      const dx = lx - activeDrag.lastX;
      if (Math.abs(dx) > 1) activeDrag.dragging = true;
      activeDrag.dragVelocity = dx * 0.00028;
      activeDrag.lastX = lx; activeDrag.lastY = ly;
    }
  }

  function pointerUp(x, y) {
    if (!activeDrag) return;
    const rect = canvas.getBoundingClientRect();
    const lx = x - rect.left;
    const ly = y - rect.top;

    const g = activeDrag;
    g.isPointerDown = false;
    activeDrag = null;
    pickerSection.classList.remove('grabbing');

    const dist = Math.hypot(lx - g.downX, ly - g.downY);
    const elapsed = Date.now() - g.downTime;

    // treat as a tap/click if the pointer barely moved
    if (!selected && dist < 12 && elapsed < 500) {
      selectGalaxy(g);
    }
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
  const note = document.getElementById('wish-note');
  const flash = document.getElementById('flash-overlay');
  let granted = false;

  function makeWish() {
    if (granted) return;
    granted = true;

    orb.classList.add('granted');
    prompt.classList.add('hidden');

    flash.style.transition = 'opacity 0.6s ease-in';
    flash.style.opacity = '1';

    setTimeout(() => {
      note.classList.add('show');
      flash.style.transition = 'opacity 1.2s ease-out';
      flash.style.opacity = '0';
      // remove the star and prompt from the layout entirely so the
      // note isn't left with empty space above it
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
    // translucent fill instead of clear -> soft motion-trail streaks
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

  // returns a function: startSpaceTravel(onArrive)
  return function startSpaceTravel(onArrive) {
    if (reducedMotion) {
      onArrive();
      return;
    }

    seedParticles(240);
    overlay.classList.add('active');
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(frame);

    setTimeout(() => {
      onArrive();
    }, 1500);

    setTimeout(() => {
      overlay.classList.remove('active');
      cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, w, h);
    }, 2050);
  };
})();