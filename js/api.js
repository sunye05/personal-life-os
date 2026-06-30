// API 客户端
const API = (() => {
  async function request(method, url, body) {
    const opts = { method, credentials: 'same-origin', headers: {} };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) {
      const err = new Error((data && data.error) || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }
  return {
    getContent: () => request('GET', '/api/content'),
    getMaterials: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', '/api/materials' + (qs ? '?' + qs : ''));
    },
    getCategories: () => request('GET', '/api/materials/categories'),
    login: (username, password) => request('POST', '/api/auth/login', { username, password }),
    logout: () => request('POST', '/api/auth/logout'),
    me: () => request('GET', '/api/auth/me'),
    changePassword: (old_password, new_password) => request('POST', '/api/auth/change-password', { old_password, new_password }),

    // 账号管理
    listUsers: () => request('GET', '/api/users'),
    createUser: (data) => request('POST', '/api/users', data),
    updateUser: (id, data) => request('PUT', '/api/users/' + id, data),
    deleteUser: (id) => request('DELETE', '/api/users/' + id),

    // 材料管理
    createMaterial: (data) => request('POST', '/api/materials', data),
    updateMaterial: (id, data) => request('PUT', '/api/materials/' + id, data),
    deleteMaterial: (id) => request('DELETE', '/api/materials/' + id),
  };
})();
