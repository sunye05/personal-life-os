// 管理后台逻辑
const Admin = (() => {
  let me = null;

  // ============ 通用 ============
  function $(s, root = document) { return root.querySelector(s); }
  function $$(s, root = document) { return Array.from(root.querySelectorAll(s)); }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function toast(msg, type = '') {
    const el = $('#toast');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, 2400);
  }

  // ============ 登录 ============
  async function checkAuth() {
    try {
      const { user } = await API.me();
      me = user;
      showAdmin();
    } catch {
      showLogin();
    }
  }

  function showLogin() {
    $('#loginPage').hidden = false;
    $('#adminPage').hidden = true;
    $('#username').focus();
  }

  function showAdmin() {
    $('#loginPage').hidden = true;
    $('#adminPage').hidden = false;
    $('#adminUser').textContent = `${me.display_name || me.username} (${me.role === 'superadmin' ? '超级管理员' : '管理员'})`;
    if (me.role !== 'superadmin') {
      $('#usersTab').style.display = 'none';
    }
    loadMaterials();
  }

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = $('#loginBtn');
    btn.disabled = true; btn.textContent = '登录中...';
    $('#loginError').hidden = true;
    try {
      const { user } = await API.login(fd.get('username').trim(), fd.get('password'));
      me = user;
      showAdmin();
      toast('登录成功', 'success');
    } catch (err) {
      $('#loginError').textContent = err.message;
      $('#loginError').hidden = false;
    } finally {
      btn.disabled = false; btn.textContent = '登 录';
    }
  });

  $('#logoutBtn').addEventListener('click', async () => {
    try { await API.logout(); } catch {}
    me = null;
    showLogin();
  });

  // ============ Tab 切换 ============
  $$('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.admin-tab').forEach(t => t.classList.toggle('active', t === tab));
      const id = tab.dataset.tab;
      $('#pane-materials').classList.toggle('active', id === 'materials');
      $('#pane-users').classList.toggle('active', id === 'users');
      if (id === 'users') loadUsers();
    });
  });

  // ============ 弹窗 ============
  function openModal(id) {
    const el = $('#' + id);
    if (el) el.hidden = false;
  }
  function closeModal(id) {
    const el = $('#' + id);
    if (el) el.hidden = true;
  }
  function closeAllModals() {
    $$('.modal').forEach(m => { m.hidden = true; });
  }
  // 关闭按钮
  document.addEventListener('click', e => {
    const closeBtn = e.target.closest('[data-close]');
    if (closeBtn) {
      e.preventDefault();
      e.stopPropagation();
      closeModal(closeBtn.dataset.close);
      return;
    }
    // 点遮罩关闭
    if (e.target.classList && e.target.classList.contains('modal-mask')) {
      e.preventDefault();
      e.stopPropagation();
      const modal = e.target.closest('.modal');
      if (modal) modal.hidden = true;
      return;
    }
    // 点 × 按钮关闭（兼容 data-close 缺失的情况）
    if (e.target.classList && (e.target.classList.contains('modal-close') || e.target.classList.contains('close-btn'))) {
      e.preventDefault();
      e.stopPropagation();
      const modal = e.target.closest('.modal');
      if (modal) modal.hidden = true;
      return;
    }
  });
  // ESC 键关闭所有弹窗
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });

  // ============ 材料管理 ============
  async function loadMaterials() {
    $('#matTbody').innerHTML = '<tr><td colspan="8" class="empty">加载中...</td></tr>';
    try {
      const { materials } = await API.getMaterials({ include_inactive: '1' });
      renderMaterialTable(materials);
      // 填充 datalist
      const cats = Array.from(new Set(materials.map(m => m.category))).sort();
      $('#categoryList').innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">`).join('');
      $('#matHint').textContent = `共 ${materials.length} 条`;
    } catch (e) {
      $('#matTbody').innerHTML = `<tr><td colspan="8" class="empty">❌ ${e.message}</td></tr>`;
    }
  }

  function renderMaterialTable(items) {
    if (!items.length) {
      $('#matTbody').innerHTML = '<tr><td colspan="8" class="empty">暂无数据，点击"新增材料"开始添加</td></tr>';
      return;
    }
    $('#matTbody').innerHTML = items.map(m => `
      <tr>
        <td>${m.id}</td>
        <td>${escapeHtml(m.category)}</td>
        <td><strong>${escapeHtml(m.brand)}</strong></td>
        <td>${escapeHtml(m.contact)}</td>
        <td style="color: var(--text-mute); max-width: 200px; word-break: break-all;">${escapeHtml(m.note || '')}</td>
        <td>${m.sort_order || 0}</td>
        <td>${m.is_active
          ? '<span class="badge badge-success">启用</span>'
          : '<span class="badge badge-muted">停用</span>'}</td>
        <td class="actions">
          <button class="btn-link" data-edit="${m.id}">编辑</button>
          <button class="btn-link" data-toggle="${m.id}" data-active="${m.is_active}">${m.is_active ? '停用' : '启用'}</button>
          <button class="btn-link danger" data-del="${m.id}">删除</button>
        </td>
      </tr>
    `).join('');
  }

  $('#addMatBtn').addEventListener('click', () => {
    $('#matModalTitle').textContent = '新增材料';
    $('#matForm').reset();
    $('#matForm [name=id]').value = '';
    $('#matForm [name=is_active]').value = '1';
    openModal('matModal');
  });

  $('#matTbody').addEventListener('click', async e => {
    const editId = e.target.dataset.edit;
    const delId = e.target.dataset.del;
    const toggleId = e.target.dataset.toggle;
    if (editId !== undefined) {
      try {
        const { materials } = await API.getMaterials({ include_inactive: '1' });
        const m = materials.find(x => x.id === Number(editId));
        if (!m) return;
        $('#matModalTitle').textContent = '编辑材料 #' + m.id;
        const f = $('#matForm');
        f.reset();
        f.elements.id.value = m.id;
        f.elements.category.value = m.category;
        f.elements.brand.value = m.brand;
        f.elements.contact.value = m.contact;
        f.elements.note.value = m.note || '';
        f.elements.sort_order.value = m.sort_order || 0;
        f.elements.is_active.value = String(m.is_active);
        openModal('matModal');
      } catch (err) { toast(err.message, 'error'); }
    } else if (delId !== undefined) {
      if (!confirm('确定要删除该材料吗？此操作不可撤销。')) return;
      try {
        await API.deleteMaterial(delId);
        toast('已删除', 'success');
        loadMaterials();
      } catch (err) { toast(err.message, 'error'); }
    } else if (toggleId !== undefined) {
      const isActive = e.target.dataset.active === '1' ? 0 : 1;
      try {
        await API.updateMaterial(toggleId, { is_active: isActive });
        toast(isActive ? '已启用' : '已停用', 'success');
        loadMaterials();
      } catch (err) { toast(err.message, 'error'); }
    }
  });

  $('#matForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const id = f.elements.id.value;
    const data = {
      category: f.elements.category.value.trim(),
      brand: f.elements.brand.value.trim(),
      contact: f.elements.contact.value.trim(),
      note: f.elements.note.value.trim(),
      sort_order: Number(f.elements.sort_order.value) || 0,
      is_active: Number(f.elements.is_active.value),
    };
    if (!data.category || !data.brand || !data.contact) {
      toast('请填写品类、品牌、联系方式', 'error'); return;
    }
    try {
      if (id) {
        await API.updateMaterial(id, data);
        toast('已更新', 'success');
      } else {
        await API.createMaterial(data);
        toast('已添加', 'success');
      }
      closeModal('matModal');
      loadMaterials();
    } catch (err) { toast(err.message, 'error'); }
  });

  // ============ 账号管理 ============
  async function loadUsers() {
    if (me.role !== 'superadmin') return;
    $('#userTbody').innerHTML = '<tr><td colspan="7" class="empty">加载中...</td></tr>';
    try {
      const { users } = await API.listUsers();
      renderUserTable(users);
    } catch (e) {
      $('#userTbody').innerHTML = `<tr><td colspan="7" class="empty">❌ ${e.message}</td></tr>`;
    }
  }

  function renderUserTable(users) {
    if (!users.length) {
      $('#userTbody').innerHTML = '<tr><td colspan="7" class="empty">暂无账号</td></tr>';
      return;
    }
    $('#userTbody').innerHTML = users.map(u => `
      <tr>
        <td>${u.id}</td>
        <td><strong>${escapeHtml(u.username)}</strong></td>
        <td>${escapeHtml(u.display_name || '')}</td>
        <td><span class="badge ${u.role === 'superadmin' ? 'badge-role-super' : 'badge-role-admin'}">${u.role === 'superadmin' ? '超级管理员' : '管理员'}</span></td>
        <td>${u.is_active
          ? '<span class="badge badge-success">启用</span>'
          : '<span class="badge badge-muted">停用</span>'}</td>
        <td style="color: var(--text-mute); font-size: 12px;">${escapeHtml(u.created_at)}</td>
        <td class="actions">
          <button class="btn-link" data-edit-user="${u.id}">编辑</button>
          ${u.id !== me.id ? `<button class="btn-link" data-toggle-user="${u.id}" data-active="${u.is_active}">${u.is_active ? '停用' : '启用'}</button>` : ''}
          ${u.id !== me.id ? `<button class="btn-link danger" data-del-user="${u.id}">删除</button>` : ''}
        </td>
      </tr>
    `).join('');
  }

  $('#addUserBtn').addEventListener('click', () => {
    $('#userModalTitle').textContent = '新增账号';
    $('#userForm').reset();
    $('#userForm [name=id]').value = '';
    $('#userForm [name=role]').value = 'admin';
    $('#pwdRequired').style.display = 'inline';
    $('#pwdHint').textContent = '新增时必填；编辑时留空表示不修改';
    $('#pwdHint').style.display = 'block';
    $('#userForm [name=password]').required = true;
    $('#activeGroup').hidden = true;
    openModal('userModal');
  });

  $('#userTbody').addEventListener('click', async e => {
    const editId = e.target.dataset.editUser;
    const delId = e.target.dataset.delUser;
    const toggleId = e.target.dataset.toggleUser;
    if (editId !== undefined) {
      try {
        const { users } = await API.listUsers();
        const u = users.find(x => x.id === Number(editId));
        if (!u) return;
        $('#userModalTitle').textContent = '编辑账号 #' + u.id;
        const f = $('#userForm');
        f.reset();
        f.elements.id.value = u.id;
        f.elements.username.value = u.username;
        f.elements.display_name.value = u.display_name || '';
        f.elements.password.value = '';
        f.elements.role.value = u.role;
        f.elements.is_active.value = String(u.is_active);
        $('#pwdRequired').style.display = 'none';
        $('#pwdHint').textContent = '编辑时留空表示不修改密码';
        $('#pwdHint').style.display = 'block';
        $('#userForm [name=password]').required = false;
        $('#activeGroup').hidden = (Number(editId) === me.id);
        openModal('userModal');
      } catch (err) { toast(err.message, 'error'); }
    } else if (delId !== undefined) {
      if (!confirm('确定要删除该账号吗？此操作不可撤销。')) return;
      try {
        await API.deleteUser(delId);
        toast('已删除', 'success');
        loadUsers();
      } catch (err) { toast(err.message, 'error'); }
    } else if (toggleId !== undefined) {
      const isActive = e.target.dataset.active === '1' ? 0 : 1;
      try {
        await API.updateUser(toggleId, { is_active });
        toast(isActive ? '已启用' : '已停用', 'success');
        loadUsers();
      } catch (err) { toast(err.message, 'error'); }
    }
  });

  $('#userForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const id = f.elements.id.value;
    const password = f.elements.password.value;
    const data = {
      display_name: f.elements.display_name.value.trim(),
      role: f.elements.role.value,
    };
    if (!id) {
      data.username = f.elements.username.value.trim();
      data.password = password;
    } else {
      if (password) data.password = password;
      data.username = f.elements.username.value.trim();
      data.is_active = Number(f.elements.is_active.value);
    }
    if (!data.username) { toast('请填写账号', 'error'); return; }
    if (!id && (!password || password.length < 6)) { toast('密码至少 6 位', 'error'); return; }
    if (id && password && password.length < 6) { toast('密码至少 6 位', 'error'); return; }
    try {
      if (id) {
        await API.updateUser(id, data);
        toast('已更新', 'success');
      } else {
        await API.createUser(data);
        toast('已创建', 'success');
      }
      closeModal('userModal');
      loadUsers();
    } catch (err) { toast(err.message, 'error'); }
  });

  // ============ 修改自己密码 ============
  $('#changePwdBtn').addEventListener('click', () => {
    $('#pwdForm').reset();
    openModal('pwdModal');
  });
  $('#pwdForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    if (f.elements.new_password.value !== f.elements.confirm.value) {
      toast('两次输入的新密码不一致', 'error'); return;
    }
    try {
      await API.changePassword(f.elements.old_password.value, f.elements.new_password.value);
      toast('密码已修改', 'success');
      closeModal('pwdModal');
    } catch (err) { toast(err.message, 'error'); }
  });

  // ============ 初始化 ============
  checkAuth();
})();
