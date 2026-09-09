async function renderProfile() {
  const username = window.location.pathname.split('/').filter(Boolean).pop();
  document.title = `${username} — biolink`;

  let data;
  try {
    data = await API.getPublicProfile(username);
  } catch {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('notFound').style.display = 'block';
    mountScene({ blur: 30, brightness: 0.65 });
    return;
  }

  const { profile } = data;
  document.getElementById('loading').style.display = 'none';
  const card = document.getElementById('profileCard');
  card.style.display = 'block';
  if (profile.theme.glass !== 'liquid') card.classList.add(`glass--${profile.theme.glass}`);

  document.documentElement.style.setProperty('--accent', profile.theme.accent);
  document.documentElement.style.setProperty('--accent-2', profile.theme.accent2);

  mountScene({
    mediaUrl: profile.background.type !== 'none' ? profile.background.url : null,
    mediaType: profile.background.type,
    blur: profile.background.blur,
    brightness: profile.background.brightness,
    color: profile.background.type === 'none' ? profile.background.color : null
  });

  if (profile.theme.particles) mountParticles(profile.theme.accent);
  if (profile.theme.cursorGlow) mountCursorGlow();

  const avatarImg = document.getElementById('avatarImg');
  avatarImg.src = profile.avatarUrl || fallbackAvatar(data.username);
  document.getElementById('nameEl').textContent = profile.displayName || data.username;
  document.getElementById('bioEl').textContent = profile.bio || '';

  renderSocials(profile.socials || []);
  setupPlayer(profile.music);
}

function renderSocials(socials) {
  const socialsEl = document.getElementById('socialsEl');
  if (!socialsEl) return;
  socials.filter((s) => s.url).forEach((s) => {
    try {
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      const img = document.createElement('img');
      img.alt = s.label || '';
      img.loading = 'lazy';
      // если сеть не отдала иконку (нет интернета до Iconify, блокировка и т.п.) — не оставляем пустую дырку
      img.addEventListener('error', () => { img.style.display = 'none'; a.textContent = (s.label || '?').slice(0, 1).toUpperCase(); });
      img.src = (typeof iconUrl === 'function') ? iconUrl(s.icon) : '';
      a.appendChild(img);
      socialsEl.appendChild(a);
    } catch {
      // одна битая иконка не должна ломать остальные
    }
  });
}

function fallbackAvatar() {
  return 'https://api.iconify.design/mdi/account-circle.svg?color=%23ffffff';
}

function setupPlayer(music) {
  if (!music.tracks.length) return;

  const player = document.getElementById('player');
  const audio = document.getElementById('audio');
  const toggle = document.getElementById('playToggle');
  const titleEl = document.getElementById('trackTitle');
  player.style.display = 'flex';

  let index = 0;

  function loadTrack(i) {
    index = i;
    audio.src = music.tracks[i].url;
    titleEl.textContent = music.tracks[i].title;
  }

  function play() {
    audio.play().catch(() => {});
    player.classList.remove('paused');
    toggle.textContent = '❚❚';
  }

  function pause() {
    audio.pause();
    player.classList.add('paused');
    toggle.textContent = '▶';
  }

  loadTrack(0);
  toggle.addEventListener('click', () => (audio.paused ? play() : pause()));
  audio.addEventListener('ended', () => {
    loadTrack((index + 1) % music.tracks.length);
    play();
  });

  if (music.autoplay) {
    // браузеры блокируют автозвук без взаимодействия — запускаем по первому клику где угодно
    const kickoff = () => { play(); document.removeEventListener('click', kickoff); };
    document.addEventListener('click', kickoff, { once: true });
  }
}

renderProfile();
