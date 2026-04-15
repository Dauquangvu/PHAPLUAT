// script.js — FB Interaction Pro
// Kết nối với /api/posts và /api/ai trên Vercel

// ─── STATE ───────────────────────────────────────────────
const state = {
  posts: [],
  pageInfo: null,
  logCount: 0,
};

// ─── NAVIGATION ──────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + name)?.classList.add('active');
  document.querySelectorAll('.sidebar-item').forEach(item => {
    if (item.getAttribute('onclick')?.includes(name)) item.classList.add('active');
  });
  const titles = {
    dashboard: ['Dashboard', 'Tổng quan hoạt động'],
    posts:     ['Posts', 'Danh sách bài viết'],
    logs:      ['Logs', 'Lịch sử thực thi'],
    settings:  ['Cài đặt', 'Cấu hình hệ thống'],
  };
  if (titles[name]) {
    document.getElementById('page-title').textContent = titles[name][0];
    document.getElementById('page-sub').textContent   = titles[name][1];
  }
}

// ─── FETCH POSTS ─────────────────────────────────────────
async function fetchPosts() {
  const url   = document.getElementById('page-url').value.trim();
  const btn   = document.getElementById('fetch-btn');
  const icon  = document.getElementById('fetch-icon');
  const label = document.getElementById('fetch-label');

  if (!url) { showToast('Nhập URL hoặc tên page Facebook', 'warning'); return; }

  btn.disabled = true;
  icon.innerHTML = '<div class="spinner"></div>';
  label.textContent = 'Đang tải...';
  setStatus('Fetching posts...', 'blue');
  addLog('info', `Fetching posts từ: ${url}`);

  try {
    const res  = await fetch(`/api/posts?page=${encodeURIComponent(url)}`);
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || 'Không lấy được posts');
    }

    state.posts    = data.posts;
    state.pageInfo = data.page;

    renderPosts();
    updateStats();
    updateRunBtn();

    addLog('success', `Đã tải ${data.posts.length} posts từ page "${data.page.name}"`);
    showToast(`✅ Tải được ${data.posts.length} posts`, 'success');
    setStatus('Posts loaded', 'green');

    // Chuyển sang tab Posts
    showSection('posts');

  } catch (err) {
    addLog('error', `Fetch thất bại: ${err.message}`);
    showToast(`❌ ${err.message}`, 'error');
    setStatus('Error', 'red');
  } finally {
    btn.disabled = false;
    icon.textContent = '⬇';
    label.textContent = 'Fetch Posts';
  }
}

// ─── RENDER POSTS ─────────────────────────────────────────
function renderPosts() {
  const container = document.getElementById('posts-container');
  if (!state.posts.length) {
    container.innerHTML = `<div class="text-center py-16" style="color:var(--muted)"><div class="text-4xl mb-3">📭</div><p class="text-sm">Không có posts nào.</p></div>`;
    return;
  }

  // Page header
  let pageHeader = '';
  if (state.pageInfo) {
    pageHeader = `
      <div class="card p-4 mb-4 flex items-center gap-3">
        ${state.pageInfo.avatar ? `<img src="${state.pageInfo.avatar}" class="w-10 h-10 rounded-full" />` : '<div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg">📄</div>'}
        <div>
          <div class="font-semibold text-sm">${escHtml(state.pageInfo.name)}</div>
          <div class="text-xs" style="color:var(--muted)">${fmtNum(state.pageInfo.fans)} followers</div>
        </div>
        <div class="ml-auto text-xs" style="color:var(--muted)">${state.posts.length} posts</div>
      </div>`;
  }

  const html = state.posts.map((post, i) => `
    <div class="post-card p-4 mb-3 slide-in" id="post-card-${i}" style="animation-delay:${i * 30}ms">
      <div class="flex gap-3">
        <!-- Checkboxes -->
        <div class="flex flex-col gap-2 pt-1">
          <label class="flex items-center gap-1 text-xs cursor-pointer" title="Like post">
            <input type="checkbox" class="checkbox-custom" id="like-${i}" onchange="updateStats()"/>
            <span style="color:var(--muted)">👍</span>
          </label>
          <label class="flex items-center gap-1 text-xs cursor-pointer" title="Comment post">
            <input type="checkbox" class="checkbox-custom" id="cmt-${i}" onchange="onCommentCheck(${i})"/>
            <span style="color:var(--muted)">💬</span>
          </label>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs" style="color:var(--muted)">${fmtDate(post.created)}</span>
            <span class="text-xs" style="color:var(--muted)">·</span>
            <span class="text-xs" style="color:var(--muted)">👍 ${fmtNum(post.likes)}  💬 ${fmtNum(post.comments)}  🔁 ${fmtNum(post.shares)}</span>
            <a href="${post.url}" target="_blank" class="ml-auto text-xs" style="color:var(--accent)">Xem →</a>
          </div>

          <p class="text-sm leading-relaxed mb-3 line-clamp-3" style="color:var(--text)">${escHtml(post.message)}</p>

          ${post.image ? `<img src="${post.image}" class="rounded-lg mb-3 max-h-40 object-cover w-full" style="border:1px solid var(--border)" onerror="this.style.display='none'" />` : ''}

          <!-- AI Comment area -->
          <div id="ai-area-${i}" class="hidden mt-2">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-semibold" style="color:var(--accent2)">🤖 AI Comment</span>
              <select id="style-${i}" class="text-xs rounded px-2 py-1 ml-auto" style="background:var(--bg);border:1px solid var(--border);color:var(--text)">
                <option value="natural">🌿 Tự nhiên</option>
                <option value="seeding">🌱 Seeding</option>
                <option value="viral">🔥 Viral</option>
              </select>
              <button class="btn btn-cyan text-xs py-1 px-2" onclick="generateComment(${i})">
                <span id="gen-icon-${i}">✨</span> Gen
              </button>
            </div>
            <textarea id="comment-${i}" class="input text-xs" rows="3" placeholder="Bấm Gen để tạo comment AI..."></textarea>
            <div class="flex gap-2 mt-2">
              <button class="btn btn-ghost text-xs py-1 px-2" onclick="copyComment(${i})">📋 Copy</button>
              <button class="btn btn-ghost text-xs py-1 px-2" onclick="openPost(${i})">🔗 Mở tab</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = pageHeader + html;

  // Badge
  const badge = document.getElementById('post-count-badge');
  badge.textContent = state.posts.length;
  badge.classList.remove('hidden');
}

// ─── COMMENT CHECK ────────────────────────────────────────
function onCommentCheck(i) {
  const checked = document.getElementById(`cmt-${i}`)?.checked;
  const area    = document.getElementById(`ai-area-${i}`);
  if (area) area.classList.toggle('hidden', !checked);

  // Update post-card selected style
  const card = document.getElementById(`post-card-${i}`);
  if (card) card.classList.toggle('selected', checked || document.getElementById(`like-${i}`)?.checked);

  updateStats();
  updateRunBtn();
}

// ─── GENERATE COMMENT ─────────────────────────────────────
async function generateComment(i) {
  const post    = state.posts[i];
  const style   = document.getElementById(`style-${i}`)?.value || 'natural';
  const icon    = document.getElementById(`gen-icon-${i}`);
  const textarea = document.getElementById(`comment-${i}`);

  if (!post) return;

  const stylePrompts = {
    natural: 'Viết 1 comment ngắn tự nhiên, thân thiện bằng tiếng Việt cho bài viết sau. Chỉ trả về comment, không giải thích.',
    seeding: 'Viết 1 comment tiếng Việt theo kiểu seeding, tò mò, khơi gợi thảo luận cho bài viết sau. Chỉ trả về comment, không giải thích.',
    viral:   'Viết 1 comment tiếng Việt cực kỳ hấp dẫn, có thể viral, dùng emoji phù hợp cho bài viết sau. Chỉ trả về comment, không giải thích.',
  };

  const prompt = `${stylePrompts[style]}\n\nBài viết: "${post.message.slice(0, 500)}"`;

  icon.innerHTML = '<div class="spinner" style="border-top-color:#000;border-color:rgba(0,0,0,0.3);border-top-color:#000"></div>';
  textarea.value = '';
  textarea.placeholder = 'Đang tạo...';
  addLog('info', `Đang gen comment (${style}) cho post #${i + 1}...`);

  try {
    const res  = await fetch('/api/ai', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt }),
    });
    const data = await res.json();

    if (!res.ok || data.error) throw new Error(data.error || 'AI error');

    textarea.value = data.result.trim();
    textarea.placeholder = '';

    // Update stat
    const done = parseInt(document.getElementById('stat-comments').textContent) || 0;
    document.getElementById('stat-comments').textContent = done + 1;

    addLog('success', `Comment generated cho post #${i + 1}`);
  } catch (err) {
    textarea.placeholder = `Lỗi: ${err.message}`;
    addLog('error', `Gen comment thất bại: ${err.message}`);
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    icon.textContent = '✨';
  }
}

// ─── GENERATE ALL ─────────────────────────────────────────
async function generateAllComments() {
  const checked = state.posts
    .map((_, i) => i)
    .filter(i => document.getElementById(`cmt-${i}`)?.checked);

  if (!checked.length) {
    showToast('Chọn ít nhất 1 post để comment trước', 'warning');
    return;
  }

  addLog('info', `Generating ${checked.length} comments...`);
  for (const i of checked) {
    await generateComment(i);
    await sleep(600);
  }
  showToast(`✅ Đã gen ${checked.length} comments`, 'success');
}

// ─── COPY COMMENT ─────────────────────────────────────────
function copyComment(i) {
  const val = document.getElementById(`comment-${i}`)?.value;
  if (!val) { showToast('Chưa có comment để copy', 'warning'); return; }
  navigator.clipboard.writeText(val);
  showToast('📋 Đã copy vào clipboard!', 'success');
}

// ─── OPEN POST ────────────────────────────────────────────
function openPost(i) {
  const post = state.posts[i];
  if (post?.url) window.open(post.url, '_blank');
}

// ─── QUICK ACTIONS ────────────────────────────────────────
function selectAll() {
  state.posts.forEach((_, i) => {
    const cb = document.getElementById(`like-${i}`);
    if (cb) { cb.checked = true; document.getElementById(`post-card-${i}`)?.classList.add('selected'); }
  });
  updateStats(); updateRunBtn();
}

function selectAllComments() {
  state.posts.forEach((_, i) => {
    const cb = document.getElementById(`cmt-${i}`);
    if (cb) { cb.checked = true; onCommentCheck(i); }
  });
  updateStats(); updateRunBtn();
}

function clearSelection() {
  state.posts.forEach((_, i) => {
    ['like-', 'cmt-'].forEach(pfx => {
      const cb = document.getElementById(pfx + i);
      if (cb) cb.checked = false;
    });
    document.getElementById(`post-card-${i}`)?.classList.remove('selected');
    document.getElementById(`ai-area-${i}`)?.classList.add('hidden');
  });
  updateStats(); updateRunBtn();
}

// ─── RUN EXECUTION ────────────────────────────────────────
async function runExecution() {
  const delayMin = parseInt(document.getElementById('delay-min')?.value) || 7;
  const delayMax = parseInt(document.getElementById('delay-max')?.value) || 20;

  const likedPosts   = state.posts.filter((_, i) => document.getElementById(`like-${i}`)?.checked);
  const commentPosts = state.posts.filter((_, i) => {
    const checked  = document.getElementById(`cmt-${i}`)?.checked;
    const hasText  = document.getElementById(`comment-${i}`)?.value?.trim();
    return checked && hasText;
  });

  if (!likedPosts.length && !commentPosts.length) {
    showToast('Chưa chọn post nào để thực thi', 'warning');
    return;
  }

  showSection('logs');
  const wrap = document.getElementById('progress-bar-wrap');
  const fill = document.getElementById('progress-fill');
  wrap.classList.remove('hidden');

  const total = likedPosts.length + commentPosts.length;
  let done = 0;

  const btn = document.getElementById('run-btn');
  btn.disabled = true;
  setStatus('Running...', 'blue');
  addLog('info', `Bắt đầu: ${likedPosts.length} likes + ${commentPosts.length} comments`);

  // Process likes
  for (const post of likedPosts) {
    const delay = randBetween(delayMin, delayMax) * 1000;
    addLog('info', `[LIKE] Mở tab → ${post.url.slice(0, 60)}...`);
    window.open(post.url, '_blank');
    done++;
    fill.style.width = `${(done / total) * 100}%`;
    await sleep(delay);
    addLog('success', `[LIKE] ✅ Tab đã mở`);
  }

  // Process comments
  for (const post of commentPosts) {
    const i       = state.posts.indexOf(post);
    const comment = document.getElementById(`comment-${i}`)?.value?.trim();
    if (!comment) continue;

    const delay = randBetween(delayMin, delayMax) * 1000;
    addLog('info', `[CMT] Copy comment → "${comment.slice(0, 40)}..."`);
    await navigator.clipboard.writeText(comment);
    window.open(post.url, '_blank');
    done++;
    fill.style.width = `${(done / total) * 100}%`;
    addLog('success', `[CMT] ✅ Tab mở + comment đã copy vào clipboard`);
    await sleep(delay);
  }

  document.getElementById('stat-done').textContent = done;
  addLog('success', `✅ Hoàn thành ${done}/${total} tác vụ`);
  showToast(`✅ Hoàn thành ${done} tác vụ`, 'success');
  setStatus('Done', 'green');
  btn.disabled = false;

  setTimeout(() => wrap.classList.add('hidden'), 3000);
}

// ─── HELPERS ─────────────────────────────────────────────
function updateStats() {
  const liked    = state.posts.filter((_, i) => document.getElementById(`like-${i}`)?.checked).length;
  const commented = state.posts.filter((_, i) => document.getElementById(`cmt-${i}`)?.checked).length;
  document.getElementById('stat-posts').textContent    = state.posts.length;
  document.getElementById('stat-selected').textContent = liked + commented;
}

function updateRunBtn() {
  const hasAny = state.posts.some((_, i) =>
    document.getElementById(`like-${i}`)?.checked ||
    document.getElementById(`cmt-${i}`)?.checked
  );
  document.getElementById('run-btn').disabled = !hasAny;
}

function addLog(type, msg) {
  state.logCount++;
  const container = document.getElementById('log-container');
  const ts  = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const div = document.createElement('div');
  div.className = `log-entry log-${type} slide-in`;
  div.innerHTML = `<span style="color:var(--muted)">[${ts}]</span> ${escHtml(msg)}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  // Badge
  const badge = document.getElementById('log-badge');
  badge.textContent = state.logCount;
  badge.classList.remove('hidden');
}

function clearLogs() {
  document.getElementById('log-container').innerHTML = '<div class="log-entry log-info"><span style="color:var(--muted)">[READY]</span> Logs cleared.</div>';
  state.logCount = 0;
  document.getElementById('log-badge').classList.add('hidden');
}

function setStatus(text, color) {
  const map = { blue: 'var(--accent)', green: 'var(--success)', red: 'var(--danger)', muted: 'var(--muted)' };
  document.getElementById('status-text').textContent = text;
  document.getElementById('status-dot').style.background = map[color] || map.muted;
}

function showToast(msg, type = 'info') {
  const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
  const toast  = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `background:${colors[type] || colors.info};color:#fff;`;
  toast.textContent = msg;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
