const ACCENT_PRESETS = [
  ['#7c5cff', '#22d3ee'],
  ['#ff3d81', '#ff9f5a'],
  ['#22d3ee', '#4ade80'],
  ['#f59e0b', '#ef4444'],
  ['#a855f7', '#ec4899'],
  ['#22c55e', '#84cc16']
];

let profile = null;
let username = null;

async function boot() {
  if (!API.token()) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const me = await API.getMe();
    profile = me.profile;
    username = me.username;
  } catch {
    API.clearToken();
    window.location.href = '/login.html';
    return;
  }

  document.getElementById('previewLink').href = `/u/${username}`;
  mountScene({
    mediaUrl: profile.background.type !== 'none' ? profile.background.url : null,
    mediaType: profile.background.type,
    blur: profile.background.blur,
    brightness: profile.background.brightness
  });

  fillProfileTab();
  fillBackgroundTab();
  fillThemeTab();
  fillSocialsTab();
  fillMusicTab();
  wireTabs();
  wireSave();
  wireLogout();
}

function showError(msg) {
  const box = document.getElementById('err');
  box.textContent = msg;
  box.classList.add('show');
  setTimeout(() => box.classList.remove('show'), 4000);
}

function wireTabs() {
  document.querySelectorAll('.tab[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab[data-tab]').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`.panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
    });
  });
}

/* ---------- Профиль ---------- */

const DEFAULT_AVATAR_PREVIEW = 'https://api.iconify.design/mdi/account-circle.svg?color=%239aa0b4';

function fillProfileTab() {
  document.getElementById('avatarUrl').value = profile.avatarUrl || '';
  document.getElementById('displayName').value = profile.displayName || '';
  document.getElementById('bio').value = profile.bio || '';

  const previewImg = document.getElementById('avatarPreviewImg');
  const previewZone = document.getElementById('avatarPreviewZone');
  const avatarUrlInput = document.getElementById('avatarUrl');
  const fileInput = document.getElementById('avatarFile');

  previewImg.src = profile.avatarUrl || DEFAULT_AVATAR_PREVIEW;

  previewZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const original = previewImg.src;
    try {
      const { url } = await API.uploadAvatar(file);
      profile.avatarUrl = url;
      avatarUrlInput.value = url;
      previewImg.src = url;
    } catch (err) {
      previewImg.src = original;
      showError(err.message);
    }
    fileInput.value = '';
  });

  document.getElementById('avatarClearBtn').addEventListener('click', () => {
    profile.avatarUrl = '';
    avatarUrlInput.value = '';
    previewImg.src = DEFAULT_AVATAR_PREVIEW;
  });

  // если человек вставляет ссылку вручную — обновляем превью тоже
  avatarUrlInput.addEventListener('input', () => {
    previewImg.src = avatarUrlInput.value.trim() || DEFAULT_AVATAR_PREVIEW;
  });
}

/* ---------- Фон ---------- */

function fillBackgroundTab() {
  const label = document.getElementById('bgPreviewLabel');
  label.textContent = profile.background.type !== 'none' ? `Текущий фон: ${profile.background.type}` : 'Фон не выбран';

  const blur = document.getElementById('blur');
  const brightness = document.getElementById('brightness');
  blur.value = profile.background.blur;
  brightness.value = profile.background.brightness;
  document.getElementById('blurVal').textContent = `${blur.value}px`;
  document.getElementById('brightVal').textContent = brightness.value;

  blur.addEventListener('input', () => {
    profile.background.blur = Number(blur.value);
    document.getElementById('blurVal').textContent = `${blur.value}px`;
    applySceneStyle({ blur: profile.background.blur });
  });
  brightness.addEventListener('input', () => {
    profile.background.brightness = Number(brightness.value);
    document.getElementById('brightVal').textContent = brightness.value;
    applySceneStyle({ brightness: profile.background.brightness });
  });

  const zone = document.getElementById('bgUploadZone');
  const input = document.getElementById('bgFile');
  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    zone.textContent = 'Загружаю…';
    try {
      const { url, type } = await API.uploadBackground(file);
      profile.background.type = type;
      profile.background.url = url;
      label.textContent = `Текущий фон: ${type}`;
      document.getElementById('scene')?.remove();
      mountScene({ mediaUrl: url, mediaType: type, blur: profile.background.blur, brightness: profile.background.brightness });
      zone.textContent = 'Нажми, чтобы загрузить фото или видео (до 100МБ)';
    } catch (err) {
      showError(err.message);
      zone.textContent = 'Нажми, чтобы загрузить фото или видео (до 100МБ)';
    }
  });
}

/* ---------- Тема ---------- */

function fillThemeTab() {
  const wrap = document.getElementById('accentSwatches');
  ACCENT_PRESETS.forEach(([a, b]) => {
    const sw = document.createElement('div');
    sw.className = 'swatch';
    sw.style.background = `linear-gradient(135deg, ${b}, ${a})`;
    if (profile.theme.accent === a) sw.classList.add('active');
    sw.addEventListener('click', () => {
      profile.theme.accent = a;
      profile.theme.accent2 = b;
      document.querySelectorAll('#accentSwatches .swatch').forEach((s) => s.classList.remove('active'));
      sw.classList.add('active');
    });
    wrap.appendChild(sw);
  });

  document.querySelectorAll('[data-glass]').forEach((btn) => {
    if (btn.dataset.glass === profile.theme.glass) btn.classList.add('active');
    btn.addEventListener('click', () => {
      profile.theme.glass = btn.dataset.glass;
      document.querySelectorAll('[data-glass]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('particlesToggle').checked = !!profile.theme.particles;
  document.getElementById('particlesToggle').addEventListener('change', (e) => {
    profile.theme.particles = e.target.checked;
  });
  document.getElementById('cursorToggle').checked = !!profile.theme.cursorGlow;
  document.getElementById('cursorToggle').addEventListener('change', (e) => {
    profile.theme.cursorGlow = e.target.checked;
  });
}

/* ---------- Соцсети ---------- */

function fillSocialsTab() {
  const picker = document.getElementById('socialPicker');
  const all = [...ICON_CATALOG.social, ...ICON_CATALOG.games];

  all.forEach((icon) => {
    const pill = document.createElement('div');
    pill.className = 'icon-pill';
    pill.innerHTML = `<img src="${iconUrl(icon.slug)}" alt=""> ${icon.label}`;
    if (profile.socials.some((s) => s.icon === icon.slug)) pill.classList.add('active');
    pill.addEventListener('click', () => {
      const exists = profile.socials.find((s) => s.icon === icon.slug);
      if (exists) {
        profile.socials = profile.socials.filter((s) => s.icon !== icon.slug);
        pill.classList.remove('active');
      } else {
        profile.socials.push({ icon: icon.slug, label: icon.label, url: '' });
        pill.classList.add('active');
      }
      renderSocialLinks();
    });
    picker.appendChild(pill);
  });

  renderSocialLinks();
}

function renderSocialLinks() {
  const wrap = document.getElementById('socialLinks');
  wrap.innerHTML = '';
  profile.socials.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'link-row';
    row.innerHTML = `
      <div class="reorder">
        <button type="button" class="btn btn--ghost" data-dir="up" ${i === 0 ? 'disabled' : ''}>▲</button>
        <button type="button" class="btn btn--ghost" data-dir="down" ${i === profile.socials.length - 1 ? 'disabled' : ''}>▼</button>
      </div>
      <img src="${iconUrl(s.icon)}" alt="">
      <input placeholder="Ссылка на ${s.label}" value="${s.url || ''}">
      <button type="button" class="btn btn--ghost btn--sm">✕</button>
    `;
    row.querySelector('input').addEventListener('input', (e) => { s.url = e.target.value; });
    row.querySelector('[data-dir="up"]').addEventListener('click', () => {
      if (i === 0) return;
      [profile.socials[i - 1], profile.socials[i]] = [profile.socials[i], profile.socials[i - 1]];
      renderSocialLinks();
    });
    row.querySelector('[data-dir="down"]').addEventListener('click', () => {
      if (i === profile.socials.length - 1) return;
      [profile.socials[i + 1], profile.socials[i]] = [profile.socials[i], profile.socials[i + 1]];
      renderSocialLinks();
    });
    row.querySelector('.btn--sm').addEventListener('click', () => {
      profile.socials = profile.socials.filter((x) => x !== s);
      document.querySelector(`.icon-pill:has(img[src="${iconUrl(s.icon)}"])`)?.classList.remove('active');
      renderSocialLinks();
    });
    wrap.appendChild(row);
  });
}

/* ---------- Музыка ---------- */

function fillMusicTab() {
  document.getElementById('autoplayToggle').checked = !!profile.music.autoplay;
  document.getElementById('autoplayToggle').addEventListener('change', (e) => {
    profile.music.autoplay = e.target.checked;
  });

  const zone = document.getElementById('musicUploadZone');
  const input = document.getElementById('musicFile');
  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    zone.textContent = 'Загружаю…';
    try {
      const { url } = await API.uploadMusic(file);
      profile.music.tracks.push({ title: file.name.replace(/\.[^.]+$/, ''), url, source: 'upload' });
      renderTracks();
    } catch (err) {
      showError(err.message);
    }
    zone.textContent = 'Загрузить трек с телефона (mp3/wav/m4a/aac/flac, до 100МБ)';
  });

  document.getElementById('addMusicLink').addEventListener('click', () => {
    const val = document.getElementById('musicLinkInput').value.trim();
    if (!val) return;
    let title;
    try { title = decodeURIComponent(new URL(val).pathname.split('/').pop() || val); } catch { title = val; }
    profile.music.tracks.push({ title, url: val, source: 'link' });
    document.getElementById('musicLinkInput').value = '';
    renderTracks();
  });

  renderTracks();
}

function renderTracks() {
  const wrap = document.getElementById('trackList');
  wrap.innerHTML = '';
  profile.music.tracks.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'track-row';
    row.innerHTML = `
      <div class="reorder">
        <button type="button" class="btn btn--ghost btn--sm" data-dir="up" ${i === 0 ? 'disabled' : ''}>▲</button>
        <button type="button" class="btn btn--ghost btn--sm" data-dir="down" ${i === profile.music.tracks.length - 1 ? 'disabled' : ''}>▼</button>
      </div>
      <span>${t.title}</span>
      <button type="button" class="btn btn--ghost btn--sm">Удалить</button>
    `;
    row.querySelector('[data-dir="up"]').addEventListener('click', () => {
      if (i === 0) return;
      [profile.music.tracks[i - 1], profile.music.tracks[i]] = [profile.music.tracks[i], profile.music.tracks[i - 1]];
      renderTracks();
    });
    row.querySelector('[data-dir="down"]').addEventListener('click', () => {
      if (i === profile.music.tracks.length - 1) return;
      [profile.music.tracks[i + 1], profile.music.tracks[i]] = [profile.music.tracks[i], profile.music.tracks[i + 1]];
      renderTracks();
    });
    row.querySelectorAll('button')[2].addEventListener('click', () => {
      profile.music.tracks = profile.music.tracks.filter((x) => x !== t);
      renderTracks();
    });
    wrap.appendChild(row);
  });
}

/* ---------- Сохранение ---------- */

function wireSave() {
  document.getElementById('saveBtn').addEventListener('click', async () => {
    profile.avatarUrl = document.getElementById('avatarUrl').value.trim();
    profile.displayName = document.getElementById('displayName').value.trim() || username;
    profile.bio = document.getElementById('bio').value;

    const btn = document.getElementById('saveBtn');
    const original = btn.textContent;
    btn.textContent = 'Сохраняю…';
    btn.disabled = true;
    try {
      await API.updateMe(profile);
      btn.textContent = 'Сохранено ✓';
    } catch (err) {
      showError(err.message);
      btn.textContent = original;
    } finally {
      btn.disabled = false;
      setTimeout(() => { btn.textContent = original; }, 1800);
    }
  });
}

function wireLogout() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    API.clearToken();
    window.location.href = '/';
  });
}

boot();
