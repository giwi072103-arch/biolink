const API = {
  base: '/api',

  token() {
    return localStorage.getItem('biolink_token');
  },

  setToken(token) {
    localStorage.setItem('biolink_token', token);
  },

  clearToken() {
    localStorage.removeItem('biolink_token');
  },

  async request(path, { method = 'GET', body, isForm = false } = {}) {
    const headers = {};
    const token = this.token();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!isForm && body) headers['Content-Type'] = 'application/json';

    const res = await fetch(this.base + path, {
      method,
      headers,
      body: isForm ? body : body ? JSON.stringify(body) : undefined
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      // тело может быть пустым
    }

    if (!res.ok) {
      throw new Error((data && data.error) || 'Что-то пошло не так');
    }
    return data;
  },

  register(code, username, password) {
    return this.request('/auth/register', { method: 'POST', body: { code, username, password } });
  },
  login(username, password) {
    return this.request('/auth/login', { method: 'POST', body: { username, password } });
  },
  checkCode(code) {
    return this.request(`/auth/code/${encodeURIComponent(code)}`);
  },
  getMe() {
    return this.request('/profile/me');
  },
  updateMe(patch) {
    return this.request('/profile/me', { method: 'PUT', body: patch });
  },
  getPublicProfile(username) {
    return this.request(`/profile/${encodeURIComponent(username)}`);
  },
  uploadAvatar(file) {
    const fd = new FormData();
    fd.append('file', file);
    return this.request('/upload/avatar', { method: 'POST', body: fd, isForm: true });
  },
  uploadBackground(file) {
    const fd = new FormData();
    fd.append('file', file);
    return this.request('/upload/background', { method: 'POST', body: fd, isForm: true });
  },
  uploadMusic(file) {
    const fd = new FormData();
    fd.append('file', file);
    return this.request('/upload/music', { method: 'POST', body: fd, isForm: true });
  }
};
