/* =====================================================================
   非官方物种 · 前端逻辑
   后端：Cloudflare Worker + D1（/api/*）
   ===================================================================== */
(function () {
  'use strict';

  var API = window.ZOO_API_BASE || 'https://zoo-api.pages.dev';

  var el = function (id) { return document.getElementById(id); };
  var postsBox = el('posts'), emptyBox = el('empty'), pill = el('status-pill');
  var btnAdmin = el('btn-admin'), btnSubmit = el('btn-submit'), btnLogout = el('btn-logout');
  var who = el('who'), switchWrap = el('switch-wrap'), openToggle = el('open-toggle');
  var modalLogin = el('modal-login'), modalForm = el('modal-form');
  var loginTitle = el('login-title'), loginSub = el('login-sub'), loginPass = el('login-pass');
  var loginErr = el('login-err'), loginGo = el('login-go');
  var form = el('post-form'), fName = el('f-name'), fContributor = el('f-contributor');
  var fIntro = el('f-intro'), introCount = el('intro-count'), fImage = el('f-image');
  var fPreview = el('f-preview'), formErr = el('form-err'), formGo = el('form-go');
  var toastBox = el('toast'), feedNote = el('feed-note');

  var token = sessionStorage.getItem('zoo_token') || '';
  var role = sessionStorage.getItem('zoo_role') || '';
  var isOpen = true;
  var loginMode = 'admin';
  var busy = false;

  var storageBox = el('storage'), storageText = el('storage-text');
  var storageFill = el('storage-fill'), storageNote = el('storage-note');

  /* ---------- 网络 ---------- */
  async function api(path, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    var res = await fetch(API + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    var data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (!res.ok) {
      var err = new Error((data && (data.message || data.error)) || ('HTTP ' + res.status));
      err.status = res.status;
      err.code = data && data.error;
      throw err;
    }
    return data;
  }

  function toast(msg, kind) {
    toastBox.textContent = msg;
    toastBox.className = 'toast show' + (kind ? ' ' + kind : '');
    toastBox.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastBox.hidden = true; }, 3200);
  }

  /* ---------- 渲染 ---------- */
  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function card(post) {
    var cardEl = document.createElement('article');
    cardEl.className = 'card post-card';

    if (post.imageId) {
      var img = document.createElement('img');
      img.className = 'post-img';
      img.loading = 'lazy';
      img.alt = post.name;
      img.src = API + '/api/img/' + encodeURIComponent(post.imageId);
      cardEl.appendChild(img);
    }

    var body = document.createElement('div');
    body.className = 'post-body';

    var head = document.createElement('div');
    head.className = 'post-head';
    var h = document.createElement('h2');
    h.className = 'post-name';
    h.textContent = post.name;
    head.appendChild(h);
    if (role === 'admin') {
      var del = document.createElement('button');
      del.className = 'chip-btn tiny danger';
      del.type = 'button';
      del.textContent = '删除';
      del.addEventListener('click', function () { removePost(post.id, post.name); });
      head.appendChild(del);
    }
    body.appendChild(head);

    var intro = document.createElement('p');
    intro.className = 'post-intro';
    intro.textContent = post.intro;
    body.appendChild(intro);

    var meta = document.createElement('p');
    meta.className = 'post-meta';
    var c = document.createElement('span');
    c.className = 'tag';
    c.textContent = '提供人 · ' + post.contributor;
    meta.appendChild(c);
    var t = document.createElement('span');
    t.className = 'date';
    t.textContent = fmtDate(post.createdAt);
    meta.appendChild(t);
    body.appendChild(meta);

    cardEl.appendChild(body);
    return cardEl;
  }

  function render(data) {
    postsBox.innerHTML = '';
    if (!data.posts.length) {
      emptyBox.hidden = false;
    } else {
      emptyBox.hidden = true;
      data.posts.forEach(function (p) { postsBox.appendChild(card(p)); });
    }
    setStatus(data.open);
  }

  function setStatus(open) {
    isOpen = open;
    pill.textContent = open ? '投稿状态：开放' : '投稿状态：已关闭';
    pill.className = 'status-pill ' + (open ? 'open' : 'closed');
    if (switchWrap.hidden === false) openToggle.checked = open;
  }

  function setOffline(msg) {
    pill.textContent = msg || '接口暂时无法连接';
    pill.className = 'status-pill offline';
  }

  /* ---------- 存储用量（管理员） ---------- */
  function fmtBytes(n) {
    if (!isFinite(n) || n < 0) return '—';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB';
    return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }

  async function loadStorage() {
    if (role !== 'admin') { storageBox.hidden = true; return; }
    storageBox.hidden = false;
    try {
      var d = await api('/api/storage');
      var pct = Math.max(0, Math.min(100, Number(d.percent) || 0));
      storageFill.style.width = pct + '%';
      storageFill.className = pct >= 85 ? 'warn' : '';
      storageText.textContent =
        fmtBytes(d.usedBytes) + ' / ' + fmtBytes(d.quotaBytes) +
        ' · 剩余 ' + fmtBytes(d.remainingBytes) + '（已用 ' + pct + '%）';
      storageNote.textContent =
        '图片 ' + d.images + ' 张 · 投稿 ' + d.posts + ' 条 · 免费额度为 D1 数据库 500 MB；' +
        '这里是按实际数据大小估算，不含数据库文件与索引的内部开销。';
    } catch (e) {
      storageFill.style.width = '0%';
      storageText.textContent = '读取失败：' + e.message;
      storageNote.textContent = e.status === 401 ? '登录已过期，请重新进入管理员模式。' : '';
    }
  }

  /* ---------- 数据 ---------- */
  async function loadAll() {
    try {
      var data = await api('/api/posts');
      render(data);
      feedNote.hidden = true;
    } catch (e) {
      setOffline('接口暂时无法连接（网络原因）');
      postsBox.innerHTML = '';
      emptyBox.hidden = true;
      feedNote.hidden = false;
      feedNote.textContent = '暂时读不到投稿列表：可能是网络不通，也可能是接口还没接上。列表为空时先别急。';
    }
  }

  /* ---------- 登录 ---------- */
  function openLogin(mode) {
    loginMode = mode;
    loginTitle.textContent = mode === 'admin' ? '管理员登录' : '投稿登录';
    loginSub.textContent = mode === 'admin'
      ? '管理员凭密码进入，可删帖与开关投稿。'
      : '输入投稿密码后即可提交，密码由园方口头告知。';
    loginErr.hidden = true;
    loginPass.value = '';
    modalLogin.hidden = false;
    setTimeout(function () { loginPass.focus(); }, 30);
  }

  function closeLogin() { modalLogin.hidden = true; }

  async function doLogin() {
    if (busy) return;
    var pass = loginPass.value.trim();
    if (!pass) { loginErr.textContent = '请输入密码'; loginErr.hidden = false; return; }
    busy = true; loginGo.disabled = true;
    try {
      var data = await api('/api/login', { method: 'POST', body: { role: loginMode, password: pass } });
      token = data.token;
      role = loginMode;
      sessionStorage.setItem('zoo_token', token);
      sessionStorage.setItem('zoo_role', role);
      closeLogin();
      applyRole();
      await loadAll();
      if (loginMode === 'submit') { openForm(); toast('投稿密码正确，可以提交了', 'ok'); }
      else { toast('已进入管理员模式', 'ok'); }
    } catch (e) {
      loginErr.textContent = e.status === 401 ? '密码不对' : ('登录失败：' + e.message);
      loginErr.hidden = false;
    } finally {
      busy = false; loginGo.disabled = false;
    }
  }

  function applyRole() {
    if (role === 'admin') {
      btnAdmin.hidden = true;
      btnSubmit.hidden = false;
      who.hidden = false; who.textContent = '管理员模式';
      switchWrap.hidden = false;
      openToggle.checked = isOpen;
      btnLogout.hidden = false;
      loadStorage();
    } else if (role === 'submit') {
      btnAdmin.hidden = true;
      btnSubmit.hidden = true;
      who.hidden = false; who.textContent = '投稿模式';
      switchWrap.hidden = true;
      btnLogout.hidden = false;
      storageBox.hidden = true;
    } else {
      btnAdmin.hidden = false;
      btnSubmit.hidden = false;
      who.hidden = true;
      switchWrap.hidden = true;
      btnLogout.hidden = true;
      storageBox.hidden = true;
    }
  }

  function logout() {
    token = ''; role = '';
    sessionStorage.removeItem('zoo_token');
    sessionStorage.removeItem('zoo_role');
    applyRole();
    loadAll();
    toast('已退出');
  }

  /* ---------- 投稿 ---------- */
  function openForm() {
    if (!token) { openLogin('submit'); return; }
    if (!isOpen && role !== 'admin') { toast('投稿已关闭', 'warn'); return; }
    formErr.hidden = true;
    modalForm.hidden = false;
    setTimeout(function () { fName.focus(); }, 30);
  }
  function closeForm() { modalForm.hidden = true; }

  function blobToB64(blob) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result).replace(/^data:[^,]*,/, '')); };
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  async function compress(file) {
    var limit = 1400000;
    var bitmap;
    try { bitmap = await createImageBitmap(file); }
    catch (e) { throw new Error('这张图片读不出来，换一张试试'); }

    var maxSide = 1200;
    var scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    var w = Math.max(1, Math.round(bitmap.width * scale));
    var h = Math.max(1, Math.round(bitmap.height * scale));
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);

    var quality = 0.82;
    var blob = await new Promise(function (r) { canvas.toBlob(r, 'image/jpeg', quality); });
    while (blob && blob.size > limit && quality > 0.4) {
      quality -= 0.12;
      blob = await new Promise(function (r) { canvas.toBlob(r, 'image/jpeg', quality); });
    }
    if (!blob) throw new Error('图片压缩失败');
    if (blob.size > limit) throw new Error('这张图片压到 1.3 MB 还是太大，换一张吧');
    return { mime: 'image/jpeg', b64: await blobToB64(blob) };
  }

  async function submitPost(ev) {
    ev.preventDefault();
    if (busy) return;
    formErr.hidden = true;
    var name = fName.value.trim();
    var contributor = fContributor.value.trim();
    var intro = fIntro.value.trim();
    if (!name) { showFormErr('请填物种名称'); return; }
    if (!contributor) { showFormErr('请填提供人'); return; }
    if (!intro) { showFormErr('请写点介绍'); return; }

    busy = true;
    formGo.disabled = true;
    formGo.textContent = fImage.files.length ? '压缩并上传中…' : '提交中…';

    try {
      var payload = { name: name, contributor: contributor, intro: intro };
      if (fImage.files && fImage.files[0]) {
        payload.image = await compress(fImage.files[0]);
      }
      await api('/api/posts', { method: 'POST', body: payload });
      closeForm();
      form.reset();
      fPreview.hidden = true;
      introCount.textContent = '0 / 800';
      await loadAll();
      loadStorage();
      toast('投稿成功，已出现在下面', 'ok');
    } catch (e) {
      if (e.status === 403 && e.code === 'closed') { toast('投稿已关闭', 'warn'); closeForm(); loadAll(); }
      else if (e.status === 429) { showFormErr('一小时内投稿太多了，歇会儿再来'); }
      else if (e.status === 401) { showFormErr('登录过期了，请重新输入投稿密码'); logout(); closeForm(); openLogin('submit'); }
      else { showFormErr('提交失败：' + e.message); }
    } finally {
      busy = false; formGo.disabled = false; formGo.textContent = '提交';
    }
  }

  function showFormErr(msg) { formErr.textContent = msg; formErr.hidden = false; }

  /* ---------- 管理员动作 ---------- */
  async function removePost(id, name) {
    if (!confirm('确定删除「' + name + '」这条投稿？')) return;
    try {
      await api('/api/posts/' + id, { method: 'DELETE' });
      await loadAll();
      loadStorage();
      toast('已删除', 'ok');
    } catch (e) {
      toast('删除失败：' + e.message, 'warn');
    }
  }

  async function toggleOpen() {
    var next = openToggle.checked;
    try {
      await api('/api/state', { method: 'POST', body: { open: next } });
      setStatus(next);
      toast(next ? '投稿已开放' : '投稿已关闭', 'ok');
    } catch (e) {
      openToggle.checked = !next;
      toast('操作失败：' + e.message, 'warn');
    }
  }

  /* ---------- 事件绑定 ---------- */
  btnAdmin.addEventListener('click', function () { openLogin('admin'); });
  btnSubmit.addEventListener('click', function () {
    if (role === 'admin') { openForm(); return; }
    if (token && role === 'submit') { openForm(); return; }
    openLogin('submit');
  });
  loginGo.addEventListener('click', doLogin);
  loginPass.addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
  btnLogout.addEventListener('click', logout);
  openToggle.addEventListener('change', toggleOpen);
  form.addEventListener('submit', submitPost);

  fIntro.addEventListener('input', function () {
    introCount.textContent = fIntro.value.length + ' / 800';
  });

  fImage.addEventListener('change', async function () {
    var file = fImage.files && fImage.files[0];
    if (!file) { fPreview.hidden = true; return; }
    if (file.size > 12 * 1024 * 1024) { showFormErr('原图太大了（>12MB），请先裁一下'); fImage.value = ''; return; }
    var url = URL.createObjectURL(file);
    fPreview.src = url;
    fPreview.hidden = false;
    formErr.hidden = true;
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-close]'), function (node) {
    node.addEventListener('click', function (e) {
      e.preventDefault();
      if (!modalForm.hidden) closeForm();
      if (!modalLogin.hidden) closeLogin();
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!modalForm.hidden) closeForm();
    if (!modalLogin.hidden) closeLogin();
  });

  /* ---------- 启动 ---------- */
  applyRole();
  loadAll();
})();
