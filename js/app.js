// 前端应用主逻辑
const App = (() => {
  let state = {
    content: null,
    currentSection: 'home',
    currentCaseSub: 'theatre',
    materials: [],
    categories: [],
    materialFilter: { category: '', q: '' },
  };

  // ============ 渲染函数 ============
  function renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    if (!state.content) return;
    nav.innerHTML = state.content.sections
      .filter(s => s.showInNav !== false)
      .map(s => `
        <a href="#${s.id}" class="sidebar-nav-item" data-section="${s.id}">
          <span class="ico">${s.icon || '•'}</span>
          <span>${s.name}</span>
        </a>
      `).join('');
    nav.querySelectorAll('.sidebar-nav-item').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        navigateTo(el.dataset.section);
        closeSidebar();
      });
    });
  }

  function navigateTo(sectionId, params = {}) {
    state.currentSection = sectionId;
    document.querySelectorAll('.sidebar-nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.section === sectionId);
    });
    if (sectionId === 'cases' && params.sub) {
      state.currentCaseSub = params.sub;
    }
    if (sectionId === 'materials' && params.materialFilter) {
      state.materialFilter = { ...state.materialFilter, ...params.materialFilter };
    }
    renderMain();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // 更新 hash 但不触发跳转
    history.replaceState(null, '', '#' + sectionId);
  }

  function renderMain() {
    const main = document.getElementById('main');
    if (!state.content) {
      main.innerHTML = '<div class="loading"><div class="spinner"></div><p>正在加载公司信息...</p></div>';
      return;
    }
    const section = state.content.sections.find(s => s.id === state.currentSection);
    if (!section) { main.innerHTML = '<div class="content-wrap"><p>未找到该板块</p></div>'; return; }
    let html = '';
    switch (section.id) {
      case 'home': html = renderHome(section); break;
      case 'about': html = renderAbout(section); break;
      case 'qualification': html = renderQualification(section); break;
      case 'advantage': html = renderAdvantage(section); break;
      case 'cases': html = renderCases(section); break;
      case 'materials': html = renderMaterials(); break;
      case 'contact': html = renderContact(section); break;
      default: html = '<div class="content-wrap">该板块暂无内容</div>';
    }
    main.innerHTML = `<div class="fade-in">${html}</div>`;
    bindMainEvents();
  }

  function sectionHero(section) {
    return `
      <div class="section-hero">
        <div class="ico">${section.icon || ''}</div>
        <h1>${section.name}</h1>
        <div class="en">${section.nameEn || ''}</div>
      </div>
    `;
  }

  // ============ 各板块渲染 ============
  function renderHome(section) {
    const page = section.pages[0];
    return `
      <div class="cover-page">
        <img src="${page.image}" alt="${state.content.company.name}">
        <div class="cover-page-text">
          <h1>${page.subtitle || state.content.company.name}</h1>
          <div class="en">${state.content.company.nameEn || ''}</div>
        </div>
      </div>
    `;
  }

  function renderAbout(section) {
    const page = section.pages[0];
    return `
      ${sectionHero(section)}
      <div class="content-wrap">
        <div class="card">
          <div class="card-title">${page.title}</div>
          <div class="timeline">
            ${page.items.map(it => `
              <div class="timeline-item">
                <div class="timeline-year">${it.year}</div>
                <div class="timeline-event">${it.event}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ${page.image ? `<div class="card" style="padding: 0; overflow: hidden;">
          <img src="${page.image}" alt="${page.title}" style="width: 100%; cursor: zoom-in;" data-gallery="false">
        </div>` : ''}
      </div>
    `;
  }

  function renderQualification(section) {
    const pages = section.pages;
    return `
      ${sectionHero(section)}
      <div class="content-wrap">
        ${pages.map(p => {
          if (p.type === 'qualification-list') {
            return `
              <div class="card">
                <div class="card-title">${p.title}</div>
                <ul class="qual-list">
                  ${p.items.map(i => `<li>${i}</li>`).join('')}
                </ul>
              </div>
            `;
          }
          if (p.type === 'image-gallery') {
            return `
              <div class="card">
                <div class="card-title">${p.title}</div>
                ${p.description ? `<p style="color: var(--text-soft); margin-bottom: 12px; font-size: 14px;">${p.description}</p>` : ''}
                <div class="image-gallery">
                  ${p.images.map(src => `<img src="${src}" alt="${p.title}" data-gallery-group="qual-${p.title}">`).join('')}
                </div>
              </div>
            `;
          }
          if (p.type === 'image') {
            return `
              <div class="card">
                <div class="card-title">${p.title}</div>
                ${p.description ? `<p style="color: var(--text-soft); margin-bottom: 12px; font-size: 14px;">${p.description}</p>` : ''}
                <img src="${p.image}" alt="${p.title}" style="border-radius: 8px; width: 100%;" data-gallery="false">
              </div>
            `;
          }
          return '';
        }).join('')}
      </div>
    `;
  }

  function renderAdvantage(section) {
    const page = section.pages[0];
    return `
      ${sectionHero(section)}
      <div class="content-wrap">
        <div class="card">
          <div class="card-title">${page.title}</div>
          <p style="color: var(--text-soft); margin-bottom: 16px; text-align: center; font-size: 15px;">${page.subtitle || ''}</p>
          <div class="advantage-grid">
            ${page.items.map(a => `
              <div class="adv-item">
                <h3>${a.name}</h3>
                <div class="adv-metric">${a.metric}</div>
                <p>${a.description}</p>
              </div>
            `).join('')}
          </div>
          ${page.capabilities ? `
            <div class="adv-capability">
              <h3>🌟 我们的能力</h3>
              <ul>
                ${page.capabilities.map(c => `<li>${c}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderCases(section) {
    const subs = section.subCategories;
    const current = subs.find(s => s.id === state.currentCaseSub) || subs[0];
    return `
      ${sectionHero(section)}
      <div class="content-wrap">
        <div class="case-tabs">
          ${subs.map(s => `
            <button class="case-tab ${s.id === current.id ? 'active' : ''}" data-sub="${s.id}">${s.name}</button>
          `).join('')}
        </div>
        <div id="caseTabContent">
          ${renderCaseSub(current)}
        </div>
      </div>
    `;
  }

  function renderCaseSub(sub) {
    const featured = sub.featured || [];
    const more = sub.moreList || [];
    return `
      ${featured.length ? `
        <div class="case-featured">
          ${featured.map(c => `
            <div class="case-card">
              <div class="case-card-images ${(c.images||[]).length <= 1 ? 'single' : ''}">
                ${(c.images || []).slice(0, 5).map(src => `<img src="${src}" alt="${c.name}" data-gallery-group="case-${sub.id}-${c.name}" loading="lazy">`).join('')}
              </div>
              <div class="case-card-body">
                ${c.brand ? `<div class="case-card-brand">${c.brand}</div>` : ''}
                <div class="case-card-name">${c.name}</div>
                ${c.location ? `<div class="case-card-location">${c.location}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${more.length ? `
        <div class="more-list">
          <h3>${sub.name}项目我们还服务过 ——</h3>
          <ul>
            ${more.map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    `;
  }

  // ============ 材料资源 ============
  async function loadMaterials() {
    const params = {};
    if (state.materialFilter.category) params.category = state.materialFilter.category;
    if (state.materialFilter.q) params.q = state.materialFilter.q;
    try {
      const data = await API.getMaterials(params);
      state.materials = data.materials;
    } catch (e) {
      state.materials = [];
    }
    try {
      const data = await API.getCategories();
      state.categories = data.categories;
    } catch (e) {
      state.categories = [];
    }
  }

  function renderMaterials() {
    const cats = state.categories;
    const items = state.materials;
    return `
      <div class="section-hero">
        <div class="ico">📦</div>
        <h1>材料资源</h1>
        <div class="en">MATERIAL RESOURCES</div>
      </div>
      <div class="content-wrap">
        <div class="materials-toolbar">
          <input class="materials-search" id="matSearch" placeholder="🔍 搜索品类、品牌、联系方式..." value="${escapeAttr(state.materialFilter.q)}">
        </div>
        ${cats.length ? `
          <div class="materials-toolbar" id="matChips">
            <button class="materials-cat-chip ${!state.materialFilter.category ? 'active' : ''}" data-cat="">全部 (${items.length >= cats.reduce((s,c)=>s+c.n,0) ? items.length : cats.reduce((s,c)=>s+c.n,0)})</button>
            ${cats.map(c => `
              <button class="materials-cat-chip ${state.materialFilter.category === c.category ? 'active' : ''}" data-cat="${escapeAttr(c.category)}">${escapeHtml(c.category)} (${c.n})</button>
            `).join('')}
          </div>
        ` : ''}
        <div class="materials-list" id="matList">
          ${renderMaterialList(items)}
        </div>
      </div>
    `;
  }

  function renderMaterialList(items) {
    if (!items.length) {
      return `<div class="materials-empty">📭 暂无材料数据${state.materialFilter.category || state.materialFilter.q ? '（请尝试其他筛选条件）' : '，请等待管理员添加'}</div>`;
    }
    return items.map(m => {
      const contactHtml = formatContact(m.contact);
      return `
        <div class="material-card">
          <div class="material-cat">${escapeHtml(m.category)}</div>
          <div class="material-brand">${escapeHtml(m.brand)}</div>
          <div class="material-contact">
            <span class="material-contact-label">📞 联系方式:</span>${contactHtml}
          </div>
          ${m.note ? `<div class="material-note">💬 ${escapeHtml(m.note)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function formatContact(text) {
    // 识别手机号、邮箱、网址并生成可点击链接
    const escaped = escapeHtml(text);
    return escaped
      .replace(/(\d{11})/g, '<a href="tel:$1">$1</a>')
      .replace(/(\d{3,4}-?\d{7,8})/g, '<a href="tel:$1">$1</a>')
      .replace(/([\w.-]+@[\w.-]+\.\w+)/g, '<a href="mailto:$1">$1</a>')
      .replace(/(www\.[\w.-]+)/g, '<a href="https://$1" target="_blank" rel="noopener">$1</a>');
  }

  function renderContact(section) {
    const page = section.pages[0];
    const co = state.content.company;
    return `
      <div class="contact-page">
        <h1>${page.title}</h1>
        <div class="slogan">${page.slogan || ''}</div>
        <div class="contact-info">
          <div class="contact-info-row">
            <span class="ico">🌐</span>
            <span>官网：<a href="https://${co.website}" target="_blank" rel="noopener">${co.website}</a></span>
          </div>
          ${page.info && page.info.address ? `
            <div class="contact-info-row">
              <span class="ico">📍</span>
              <span>${escapeHtml(page.info.address)}</span>
            </div>
          ` : ''}
          ${page.info && page.info.phone ? `
            <div class="contact-info-row">
              <span class="ico">📞</span>
              <span>电话：<a href="tel:${page.info.phone}">${escapeHtml(page.info.phone)}</a></span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // ============ 事件绑定 ============
  function bindMainEvents() {
    // 案例 tab 切换
    document.querySelectorAll('.case-tab').forEach(el => {
      el.addEventListener('click', () => {
        state.currentCaseSub = el.dataset.sub;
        document.querySelectorAll('.case-tab').forEach(t => t.classList.toggle('active', t.dataset.sub === state.currentCaseSub));
        const sub = state.content.sections.find(s => s.id === 'cases').subCategories.find(x => x.id === state.currentCaseSub);
        document.getElementById('caseTabContent').innerHTML = renderCaseSub(sub);
        attachLightbox();
      });
    });

    // 材料 - 搜索
    const searchEl = document.getElementById('matSearch');
    if (searchEl) {
      let timer = null;
      searchEl.addEventListener('input', e => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          state.materialFilter.q = e.target.value.trim();
          await loadMaterials();
          document.getElementById('matList').innerHTML = renderMaterialList(state.materials);
        }, 250);
      });
    }
    // 材料 - 分类筛选
    document.querySelectorAll('.materials-cat-chip').forEach(el => {
      el.addEventListener('click', async () => {
        state.materialFilter.category = el.dataset.cat;
        document.querySelectorAll('.materials-cat-chip').forEach(c => c.classList.toggle('active', c === el));
        await loadMaterials();
        document.getElementById('matList').innerHTML = renderMaterialList(state.materials);
      });
    });

    attachLightbox();
  }

  // ============ Lightbox ============
  let lightboxGroup = [];
  let lightboxIndex = 0;
  function attachLightbox() {
    document.querySelectorAll('img[data-gallery-group]').forEach(img => {
      img.addEventListener('click', () => {
        const group = img.dataset.galleryGroup;
        const allInGroup = Array.from(document.querySelectorAll(`img[data-gallery-group="${group}"]`));
        lightboxGroup = allInGroup.map(i => i.src);
        lightboxIndex = allInGroup.indexOf(img);
        openLightbox();
      });
    });
    document.querySelectorAll('img[data-gallery="false"]').forEach(img => {
      img.addEventListener('click', () => {
        lightboxGroup = [img.src];
        lightboxIndex = 0;
        openLightbox();
      });
    });
  }

  function openLightbox() {
    const lb = document.getElementById('lightbox');
    document.getElementById('lightboxImg').src = lightboxGroup[lightboxIndex];
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    document.getElementById('lightbox').hidden = true;
    document.body.style.overflow = '';
  }
  function nextLightbox() {
    lightboxIndex = (lightboxIndex + 1) % lightboxGroup.length;
    document.getElementById('lightboxImg').src = lightboxGroup[lightboxIndex];
  }
  function prevLightbox() {
    lightboxIndex = (lightboxIndex - 1 + lightboxGroup.length) % lightboxGroup.length;
    document.getElementById('lightboxImg').src = lightboxGroup[lightboxIndex];
  }

  // ============ 工具函数 ============
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ============ 侧边栏 ============
  function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('backdrop');
    if (sidebar) { sidebar.classList.add('open'); sidebar.style.transform = 'translateX(0)'; }
    if (backdrop) backdrop.classList.add('show');
  }
  function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('backdrop');
    if (sidebar) { sidebar.classList.remove('open'); sidebar.style.transform = ''; }
    if (backdrop) backdrop.classList.remove('show');
  }
  // 全局事件委托：确保即使 JS 早期绑定失败也能响应
  document.addEventListener('click', e => {
    const closeBtn = e.target.closest('#closeSidebar');
    if (closeBtn) { closeSidebar(); e.stopPropagation(); return; }
    const menuBtn = e.target.closest('#menuBtn');
    if (menuBtn) { openSidebar(); e.stopPropagation(); return; }
    const backdrop = e.target.closest('#backdrop');
    if (backdrop) { closeSidebar(); e.stopPropagation(); return; }
  });

  // ============ PWA 安装提示 ============
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    const tip = document.getElementById('installTip');
    if (tip && !localStorage.getItem('pwa_install_dismissed')) {
      tip.hidden = false;
    }
  });
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
      }
      const tip = document.getElementById('installTip');
      if (tip) tip.hidden = true;
    });
  }
  const installClose = document.getElementById('installClose');
  if (installClose) {
    installClose.addEventListener('click', () => {
      const tip = document.getElementById('installTip');
      if (tip) tip.hidden = true;
      localStorage.setItem('pwa_install_dismissed', '1');
    });
  }

  // ============ 初始化 ============
  async function init() {
    // 绑定基础事件（带 null 防护）
    function bindIf(id, event, handler) {
      const el = document.getElementById(id);
      if (el) el.addEventListener(event, handler);
    }
    bindIf('menuBtn', 'click', openSidebar);
    bindIf('closeSidebar', 'click', closeSidebar);
    bindIf('backdrop', 'click', closeSidebar);
    bindIf('lightboxClose', 'click', closeLightbox);
    bindIf('lightboxNext', 'click', nextLightbox);
    bindIf('lightboxPrev', 'click', prevLightbox);
    bindIf('lightbox', 'click', e => {
      if (e.target.id === 'lightbox') closeLightbox();
    });
    document.addEventListener('keydown', e => {
      const lb = document.getElementById('lightbox');
      if (!lb || lb.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
    });

    try {
      state.content = await API.getContent();
    } catch (e) {
      const main = document.getElementById('main');
      if (main) main.innerHTML = `<div class="content-wrap"><div class="card" style="text-align: center; padding: 40px;"><p style="color: var(--danger);">❌ 加载失败：${e.message}</p></div></div>`;
      return;
    }
    renderSidebar();
    // 预加载材料（用于分类筛选）
    await loadMaterials();

    // 解析 hash
    const hash = (location.hash || '').replace('#', '');
    if (hash && state.content.sections.find(s => s.id === hash)) {
      state.currentSection = hash;
    }
    renderMain();
  }

  return { init };
})();

// ==================== 全局兜底事件绑定 ====================
// 无论 IIFE 内部是否出错，这里都保证按钮可点击
(function bindGlobalEvents() {
  function openSidebar() {
    const s = document.getElementById('sidebar');
    const b = document.getElementById('backdrop');
    if (s) { s.classList.add('open'); s.style.transform = 'translateX(0)'; }
    if (b) b.classList.add('show');
  }
  function closeSidebar() {
    const s = document.getElementById('sidebar');
    const b = document.getElementById('backdrop');
    if (s) { s.classList.remove('open'); s.style.transform = ''; }
    if (b) b.classList.remove('show');
  }
  // 用 onwindow 暴露给 inline onclick
  window.__zx = { openSidebar, closeSidebar };

  document.addEventListener('click', e => {
    const t = e.target;
    if (!t) return;
    // 菜单按钮
    if (t.closest && t.closest('#menuBtn')) { openSidebar(); e.preventDefault(); return; }
    // 关闭按钮
    if (t.closest && t.closest('#closeSidebar')) { closeSidebar(); e.preventDefault(); return; }
    // 背景遮罩
    if (t.id === 'backdrop') { closeSidebar(); return; }
    // 侧边导航项
    const navItem = t.closest && t.closest('.sidebar-nav-item');
    if (navItem) {
      e.preventDefault();
      const section = navItem.dataset.section;
      if (section) location.hash = section;
      closeSidebar();
      return;
    }
    // 安装提示关闭
    if (t.id === 'installClose') {
      const tip = document.getElementById('installTip');
      if (tip) tip.hidden = true;
      try { localStorage.setItem('pwa_install_dismissed', '1'); } catch {}
      return;
    }
    // 安装按钮
    if (t.id === 'installBtn') {
      // 由 beforeinstallprompt 处理
      return;
    }
  }, true);

  // 案例子分类 tab 点击
  document.addEventListener('click', e => {
    const tab = e.target.closest && e.target.closest('.case-tab');
    if (tab) {
      e.preventDefault();
      const sub = tab.dataset.sub;
      if (sub && window.App && window.App.setCaseSub) {
        window.App.setCaseSub(sub);
      } else {
        // 降级：手动切换 active class
        document.querySelectorAll('.case-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      }
    }
  });

  console.log('✅ 全局事件绑定完成');
})();

document.addEventListener('DOMContentLoaded', App.init);
