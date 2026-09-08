function mountScene({ mediaUrl, mediaType, blur, brightness, color } = {}) {
  const scene = document.createElement('div');
  scene.className = 'scene';
  scene.id = 'scene';

  if (color) scene.style.background = color;

  if (mediaUrl) {
    const media = document.createElement(mediaType === 'video' ? 'video' : 'img');
    media.className = 'scene__media';
    media.src = mediaUrl;
    if (mediaType === 'video') {
      media.autoplay = true;
      media.loop = true;
      media.muted = true;
      media.playsInline = true;
    }
    scene.appendChild(media);
  }

  const blobA = document.createElement('div');
  blobA.className = 'scene__blob a';
  const blobB = document.createElement('div');
  blobB.className = 'scene__blob b';
  const grain = document.createElement('div');
  grain.className = 'scene__grain';

  scene.append(blobA, blobB, grain);
  document.body.prepend(scene);

  applySceneStyle({ blur, brightness });
  return scene;
}

function applySceneStyle({ blur, brightness } = {}) {
  const root = document.documentElement;
  if (blur !== undefined) root.style.setProperty('--bg-blur', `${blur}px`);
  if (brightness !== undefined) root.style.setProperty('--bg-brightness', brightness);
}

function mountCursorGlow() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  window.addEventListener('mousemove', (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  });
}
