// ==============================================
// ⚙️ EDIT THIS: the date you two started
// Format: 'YYYY-MM-DD'
// Example: relationship started June 14, 2026 -> '2026-06-14'
// ==============================================
const RELATIONSHIP_START = '2026-06-14';

// ==============================================
// PAGE NAVIGATION
// ==============================================
const pages = {
  mood: document.getElementById('mood'),
  opening: document.getElementById('opening'),
  picker: document.getElementById('picker'),
  letter: document.getElementById('letter'),
  wish: document.getElementById('wish'),
  wishpage: document.getElementById('wishpage'),
};

function goTo(name) {
  Object.values(pages).forEach(p => p.classList.remove('active'));
  pages[name].classList.add('active');
}

document.getElementById('next-btn').addEventListener('click', () => {
  goTo('picker');
});

document.getElementById('to-wish-btn').addEventListener('click', () => {
  startSpaceTravel(() => goTo('wish'));
});

document.getElementById('to-wishpage-btn').addEventListener('click', () => {
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
initStarfield('wishpage-stars', 90);

// ==============================================
// LIVE "DAYS TOGETHER" COUNTER
// ==============================================

// ==============================================
// GALAXY (page 2) — one interactive spiral galaxy
// shrunk down to a small, minimalist cluster with a
// "1st galaxy" tag anchored beneath it
// ==============================================
(function galaxyModule() {
  const canvas = document.getElementById('galaxy-canvas');
  const ctx = canvas.getContext('2d');
  const pickerSection = document.getElementById('picker');
  const tagEl = document.getElementById('galaxy-tag');
  let w, h, cx, cy, coreRadius;
  let particles = [];
  let bgStars = [];

  // how much of the shorter canvas side the galaxy fills —
  // smaller number = smaller, more minimalist galaxy
  const GALAXY_SCALE = 0.15;
  const TAG_GAP = 26; // css px between the galaxy's outer edge and the tag

  // rotation state
  let rotation = 0;
  let angularVelocity = 0.0018;     // gentle constant drift
  let dragVelocity = 0;             // added by user drag, decays with friction
  let tiltX = 0, tiltY = 0;         // subtle 3D tilt following the cursor
  let targetTiltX = 0, targetTiltY = 0;

  // interaction state
  let isPointerDown = false;
  let dragging = false;
  let lastX = 0, lastY = 0;
  let downX = 0, downY = 0, downTime = 0;
  let selected = false;

  function resize() {
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    cx = w / 2;
    cy = h / 2;
    coreRadius = Math.min(w, h) * GALAXY_SCALE;
    buildGalaxy();
    positionTag();
  }

  // keeps the "1st galaxy" tag centered under the (responsive) galaxy
  function positionTag() {
    if (!tagEl) return;
    const cssRadius = coreRadius / devicePixelRatio;
    const cssCenterY = canvas.offsetHeight / 2;
    tagEl.style.top = `${cssCenterY + cssRadius + TAG_GAP}px`;
  }

  function buildGalaxy() {
    particles = [];
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

        particles.push({
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

    // distant background stars, unaffected by rotation, for depth
    bgStars = [];
    for (let i = 0; i < 120; i++) {
      bgStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 * devicePixelRatio + 0.2,
        alpha: Math.random() * 0.5 + 0.15,
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);

    // distant stars
    for (const s of bgStars) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(244, 242, 255, ${s.alpha})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // core glow — kept subtle so the small galaxy still reads as minimalist
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 0.95);
    grad.addColorStop(0, 'rgba(255, 250, 240, 0.3)');
    grad.addColorStop(0.35, 'rgba(140, 160, 255, 0.11)');
    grad.addColorStop(1, 'rgba(10, 15, 44, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius * 1.05, 0, Math.PI * 2);
    ctx.fill();

    // ease tilt toward target (cursor-follow "glide")
    tiltX += (targetTiltX - tiltX) * 0.04;
    tiltY += (targetTiltY - tiltY) * 0.04;

    // update rotation: base drift + drag momentum (with friction)
    if (!selected) {
      rotation += angularVelocity + dragVelocity;
      dragVelocity *= 0.94;
    }

    const squash = 0.62 + tiltY * 0.18; // simulates a slight 3D tilt

    for (const p of particles) {
      const ang = p.angle + rotation;
      const x = cx + Math.cos(ang) * p.radius + tiltX * 8;
      const y = cy + Math.sin(ang) * p.radius * squash;
      const flicker = p.alpha + Math.sin(t * p.twinkleSpeed + p.phase) * 0.25;
      ctx.beginPath();
      ctx.fillStyle = p.color.replace('ALPHA', Math.max(0.08, Math.min(1, flicker)).toFixed(2));
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  // ---- pointer interaction: drag to spin, tap to open ----
  function pointerDown(x, y) {
    if (selected) return;
    isPointerDown = true;
    dragging = false;
    lastX = x; lastY = y;
    downX = x; downY = y;
    downTime = Date.now();
    pickerSection.classList.add('grabbing');
  }

  function pointerMove(x, y, isRealDrag) {
    // cursor-follow glide (parallax) — always active, even without pressing
    const nx = (x / (canvas.offsetWidth || 1)) * 2 - 1;
    const ny = (y / (canvas.offsetHeight || 1)) * 2 - 1;
    targetTiltX = nx;
    targetTiltY = ny;

    if (isPointerDown && isRealDrag) {
      const dx = x - lastX;
      if (Math.abs(dx) > 1) dragging = true;
      dragVelocity = dx * 0.00028;
      lastX = x; lastY = y;
    }
  }

  function pointerUp(x, y) {
    if (!isPointerDown) return;
    isPointerDown = false;
    pickerSection.classList.remove('grabbing');

    const dist = Math.hypot(x - downX, y - downY);
    const elapsed = Date.now() - downTime;

    // treat as a tap/click if the pointer barely moved
    if (!selected && dist < 12 && elapsed < 500) {
      selectGalaxy();
    }
  }

  canvas.addEventListener('mousedown', e => pointerDown(e.clientX, e.clientY));
  window.addEventListener('mousemove', e => pointerMove(e.clientX, e.clientY, true));
  window.addEventListener('mouseup', e => pointerUp(e.clientX, e.clientY));

  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    pointerDown(t.clientX, t.clientY);
  }, { passive: true });

  canvas.addEventListener('touchmove', e => {
    const t = e.touches[0];
    pointerMove(t.clientX, t.clientY, true);
  }, { passive: true });

  canvas.addEventListener('touchend', e => {
    const t = e.changedTouches[0];
    pointerUp(t.clientX, t.clientY);
  });

  // ---- selection: flash white, then reveal the letter ----
  function selectGalaxy() {
    selected = true;
    const flash = document.getElementById('flash-overlay');
    flash.style.transition = 'opacity 0.55s ease-in';
    flash.style.opacity = '1';

    setTimeout(() => {
      goTo('letter');
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