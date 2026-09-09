function mountParticles(color = '#7c5cff') {
  const canvas = document.createElement('canvas');
  canvas.id = 'particles';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let w, h, particles;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    const count = window.innerWidth < 640 ? 26 : 50;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.6,
      vy: Math.random() * 0.35 + 0.08,
      drift: Math.random() * 0.4 - 0.2,
      alpha: Math.random() * 0.5 + 0.15
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    particles.forEach((p) => {
      p.y -= p.vy;
      p.x += p.drift * 0.2;
      if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  init();
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) tick();
}
