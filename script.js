// ─── STATE ──────────────────────────────────────────────────────────────────
const state = {
  posts: [],
  actions: {},      // { postId: { like, comment, share, commentText } }
  logs: [],
  stats: { done: 0, aiGenerated: 0 },
  running: false,
};

// ─── NAVIGATION ─────────────────────────────────────────────────────────────
function showSection(name) {
  ['dashboard', 'posts', 'logs', 'settings'].forEach(s => {
    document.getElementById(`section-${s}`)?.classList.toggle('hidden', s !== name);
  });
  document.querySelectorAll('.sidebar-item').forEach((el, i) => {
    el.classList.remove('active');
    el.classList.add('text-slate-300');
    el.classList.remove('text-indigo-400');
  });
  const btns = document.querySelectorAll('.sidebar-item');
  const map = { dashboard: 0, posts: 1, logs: 2, settings: 3 };
  const idx = map[name];
  if (btns[idx]) {
    btns[idx].classList.add('active');
  }
  const titles = {
    dashboard: ['Dashboard', 'Tổng quan hệ thống'],
    posts: ['Posts & Interaction', 'Chọn actions cho từng bài viết'],
    logs: ['Execution Logs', 'Tiến trình thực thi'],
    settings: ['Settings', 'Cấu hình tool'],
  };
  document.getElementById('page-title').textContent = titles[name][0];
  document.getElementById('page-subtitle').textContent = titles[name][1];
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  sb.classList.toggle('-translate-x-full');
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const colors = {
    info: 'bg-slate-800 border-slate-700 text-slate-200',
    success: 'bg-emerald-900/80 border-emerald-700 text-emerald-200',
    error: 'bg-red-900/80 border-red-700 text-red-200',
    warn: 'bg-amber-900/80 border-amber-700 text-amber-200',
  };
  const el = document.createElement('div');
  el.className = `pointer-events-auto max-w-xs text-xs font-medium px-4 py-2.5 rounded-lg border ${colors[type]} shadow-lg transition-all`;
  el.style.animation = 'slideIn .3s ease';
  el.textContent = msg;
  document.getElementById('toast').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ─── LOGS ────────────────────────────────────────────────────────────────────
function addLog(msg, type = 'info') {
  const time = new Date().toLocaleTimeString('vi-VN');
  const colors = {
    info: 'text-slate-400',
    success: 'text-emerald-400',
    error: 'text-red-400',
    warn: 'text-amber-400',
    action: 'text-indigo-400',
  };
  const prefix = { info: '→', success: '✓', error: '✗', warn: '!', action: '⚡' };
  state.logs.push({ time, msg, type });

  const container = document.getElementById('log-container');
  const entry = document.createElement('p');
  entry.className = `log-entry ${colors[type] || 'text-slate-400'}`;
  entry.textContent = `[${time}] ${prefix[type] || '→'} ${msg}`;
  // Remove placeholder
  const placeholder = container.querySelector('p.italic');
  if (placeholder) placeholder.remove();
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;

  // Badge
  const badge = document.getElementById('log-badge');
  badge.textContent = state.logs.length;
  badge.classList.remove('hidden');
}

function clearLogs() {
  state.logs = [];
  document.getElementById('log-container').innerHTML = '<p class="text-slate-600 italic">Logs will appear here during execution...</p>';
  document.getElementById('log-badge').classList.add('hidden');
}

// ─── STATS ───────────────────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('stat-posts').textContent = state.posts.length;
  const actionCount = Object.values(state.actions).filter(a => a.like || a.comment || a.share).length;
  document.getElementById('stat-actions').textContent = actionCount;
  document.getElementById('stat-done').textContent = state.stats.done;
  document.getElementById('stat-ai').textContent = state.stats.aiGenerated;
}

// ─── FETCH POSTS ─────────────────────────────────────────────────────────────
async function fetchPosts() {
  const url = document.getElementById('page-url').value.trim();
  if (!url) { toast('Nhập link Facebook Page trước!', 'warn'); return; }
  if (!url.includes('facebook.com')) { toast('Link không hợp lệ! Phải là link Facebook', 'error'); return; }

  const btn = document.getElementById('fetch-btn');
  const icon = document.getElementById('fetch-icon');
  btn.disabled = true;
  icon.outerHTML = `<svg id="fetch-icon" class="w-4 h-4 spinner" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="25 75" stroke-linecap="round"/></svg>`;

  addLog(`Đang xử lý page: ${url}`, 'info');

  try {
    // Extract page identifier from URL
    const cleaned = url.replace(/\/$/, '');
    const match = cleaned.match(/facebook\.com\/(?:pages\/[^/]+\/)?([^/?#]+)/);
    const pageId = match ? match[1] : 'page';
    // Normalize: strip query params
    const pageUrl = `https://www.facebook.com/${pageId}`;

    await sleep(800);

    // Generate 10 placeholder slots — user sẽ nhập URL bài thật vào từng slot
    state.pageUrl = pageUrl;
    state.pageId = pageId;
    state.posts = generatePostSlots(pageId, pageUrl, 10);
    state.actions = {};
    state.posts.forEach(p => {
      state.actions[p.id] = { like: false, comment: false, share: false, commentText: '' };
    });

    renderPosts();
    updateStats();
    addLog(`Đã tạo 10 slot bài viết cho page: ${pageId}`, 'success');
    addLog(`➡ Nhập URL bài viết thật vào từng slot, hoặc RUN để thao tác trên Page`, 'warn');
    toast(`Sẵn sàng! Nhập URL bài viết thật vào từng slot`, 'success');
    showSection('posts');
  } catch (e) {
    addLog(`Error: ${e.message}`, 'error');
    toast('Lỗi xử lý URL', 'error');
  } finally {
    btn.disabled = false;
    document.getElementById('fetch-icon').outerHTML = `<svg id="fetch-icon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>`;
  }
}

function generatePostSlots(pageId, pageUrl, count) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `post_${i + 1}`,
    content: '',         // user sẽ nhập / để trống cũng được
    image: null,
    likes: null,
    comments: null,
    shares: null,
    time: new Date(now - i * 3600000 * 4).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    // URL thật — user tự paste; mặc định trỏ về page để tiện navigate
    url: pageUrl,
    isSlot: true,        // flag = chưa có URL bài cụ thể
  }));
}

// ─── RENDER POSTS ────────────────────────────────────────────────────────────
function renderPosts() {
  const container = document.getElementById('posts-list');
  const empty = document.getElementById('posts-empty');
  if (!state.posts.length) { empty.classList.remove('hidden'); container.classList.add('hidden'); return; }
  empty.classList.add('hidden');
  container.classList.remove('hidden');
  container.innerHTML = '';

  state.posts.forEach((post, idx) => {
    const a = state.actions[post.id];
    const card = document.createElement('div');
    card.className = 'post-card bg-slate-900 border border-slate-800 rounded-xl overflow-hidden';
    card.id = `card-${post.id}`;
    card.innerHTML = `
      <div class="flex items-start gap-4 p-4">
        <!-- Index -->
        <div class="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">${idx + 1}</div>
        <!-- Content -->
        <div class="flex-1 min-w-0">

          <!-- URL input thật -->
          <div class="mb-3">
            <label class="text-xs text-slate-500 mb-1 block">URL bài viết thật (copy từ Facebook)</label>
            <div class="flex gap-2">
              <input id="url-${post.id}" type="text"
                value="${escapeHtml(post.isSlot ? '' : post.url)}"
                placeholder="https://www.facebook.com/page/posts/..."
                oninput="updatePostUrl('${post.id}', this.value)"
                class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 min-w-0" />
              <button onclick="openPostUrl('${post.id}')"
                class="shrink-0 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                Mở
              </button>
            </div>
          </div>

          <!-- Note / mô tả tuỳ chọn -->
          <div class="mb-3">
            <input id="note-${post.id}" type="text"
              value="${escapeHtml(post.content || '')}"
              placeholder="Ghi chú về bài này (tuỳ chọn)..."
              oninput="updatePostNote('${post.id}', this.value)"
              class="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-400 placeholder-slate-600 focus:outline-none focus:border-slate-600" />
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-3 mb-3">
            <label class="flex items-center gap-1.5 cursor-pointer select-none">
              <input type="checkbox" ${a.like ? 'checked' : ''} onchange="toggleAction('${post.id}','like',this.checked)"
                class="w-3.5 h-3.5 accent-indigo-500 cursor-pointer" />
              <span class="text-xs text-slate-400 hover:text-slate-200">👍 Like</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer select-none">
              <input type="checkbox" ${a.comment ? 'checked' : ''} onchange="toggleAction('${post.id}','comment',this.checked)"
                class="w-3.5 h-3.5 accent-indigo-500 cursor-pointer" />
              <span class="text-xs text-slate-400 hover:text-slate-200">💬 Comment</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer select-none">
              <input type="checkbox" ${a.share ? 'checked' : ''} onchange="toggleAction('${post.id}','share',this.checked)"
                class="w-3.5 h-3.5 accent-indigo-500 cursor-pointer" />
              <span class="text-xs text-slate-400 hover:text-slate-200">🔗 Share</span>
            </label>
          </div>

          <!-- Comment box -->
          <div id="comment-area-${post.id}" class="${a.comment ? '' : 'hidden'}">
            <div class="flex gap-2 mb-2">
              <select id="style-${post.id}" class="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500">
                <option value="natural">Tự nhiên</option>
                <option value="seeding">Seeding</option>
                <option value="viral">Viral</option>
              </select>
              <button onclick="generateComment('${post.id}')" id="ai-btn-${post.id}"
                class="flex items-center gap-1.5 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 text-xs px-3 py-1.5 rounded-lg transition-all font-medium">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                AI Generate
              </button>
              ${a.commentText ? `<button onclick="copyComment('${post.id}')" class="flex items-center gap-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg transition-all">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copy
              </button>` : ''}
            </div>
            <textarea id="comment-${post.id}" rows="2" placeholder="Nhập comment hoặc dùng AI Generate..."
              oninput="updateComment('${post.id}',this.value)"
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none">${escapeHtml(a.commentText || '')}</textarea>
          </div>
        </div>
      </div>
      <!-- Card footer -->
      <div class="px-4 py-2.5 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <span id="url-status-${post.id}" class="text-xs ${post.isSlot ? 'text-amber-500' : 'text-emerald-400'}">
          ${post.isSlot ? '⚠ Chưa có URL bài viết' : '✓ Đã có URL'}
        </span>
        <span id="card-status-${post.id}" class="text-xs text-slate-600">Pending</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleAction(postId, type, value) {
  state.actions[postId][type] = value;
  if (type === 'comment') {
    const area = document.getElementById(`comment-area-${postId}`);
    area?.classList.toggle('hidden', !value);
  }
  updateStats();
}

function updateComment(postId, text) {
  state.actions[postId].commentText = text;
  // Re-render copy button visibility
  const area = document.getElementById(`comment-area-${postId}`);
  if (area) {
    const copyBtn = area.querySelector('.copy-btn');
    // handled inline via re-render would be complex; skip for perf
  }
}

function updatePostUrl(postId, url) {
  const post = state.posts.find(p => p.id === postId);
  if (!post) return;
  const trimmed = url.trim();
  post.url = trimmed || state.pageUrl;
  post.isSlot = !trimmed || !trimmed.includes('facebook.com');
  const statusEl = document.getElementById(`url-status-${postId}`);
  if (statusEl) {
    if (post.isSlot) {
      statusEl.textContent = '⚠ Chưa có URL bài viết';
      statusEl.className = 'text-xs text-amber-500';
    } else {
      statusEl.textContent = '✓ Đã có URL';
      statusEl.className = 'text-xs text-emerald-400';
    }
  }
}

function updatePostNote(postId, text) {
  const post = state.posts.find(p => p.id === postId);
  if (post) post.content = text;
}

function openPostUrl(postId) {
  const post = state.posts.find(p => p.id === postId);
  if (!post) return;
  const url = post.url || state.pageUrl;
  if (url) window.open(url, '_blank');
  else toast('Chưa có URL để mở!', 'warn');
}

async function copyComment(postId) {
  const text = state.actions[postId]?.commentText;
  if (!text) { toast('Chưa có comment!', 'warn'); return; }
  try {
    await navigator.clipboard.writeText(text);
    toast('Đã copy vào clipboard!', 'success');
  } catch {
    toast(`Copy thủ công: ${text}`, 'warn');
  }
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── AI GENERATE COMMENT ─────────────────────────────────────────────────────
async function generateComment(postId) {
  const post = state.posts.find(p => p.id === postId);
  const style = document.getElementById(`style-${postId}`).value;
  const btn = document.getElementById(`ai-btn-${postId}`);
  if (!post) return;

  btn.disabled = true;
  btn.innerHTML = `<svg class="w-3 h-3 spinner" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="25 75" stroke-linecap="round"/></svg> Generating...`;

  const styleMap = {
    natural: 'viết comment tự nhiên, ngắn gọn, chân thực như người dùng thật',
    seeding: 'viết comment seeding sản phẩm, thể hiện quan tâm hoặc hỏi thêm thông tin, không lộ quảng cáo',
    viral: 'viết comment hài hước, viral, dễ tạo engagement, có thể dùng emoji phù hợp',
  };

  addLog(`Generating AI comment for post ${postId} (style: ${style})`, 'action');

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postContent: post.content,
        style: styleMap[style],
      }),
    });

    if (!response.ok) throw new Error(`API error ${response.status}`);
    const data = await response.json();
    const comment = data.comment || data.text || '';

    document.getElementById(`comment-${postId}`).value = comment;
    state.actions[postId].commentText = comment;
    state.stats.aiGenerated++;
    updateStats();
    addLog(`AI comment generated (${style}): "${comment.slice(0, 50)}..."`, 'success');
    toast('Comment đã được tạo!', 'success');
  } catch (e) {
    // Fallback mock if API not configured
    const fallbacks = {
      natural: ['Bài viết hay quá! Cảm ơn bạn đã chia sẻ 😊', 'Thú vị đó, mình cũng đang tìm hiểu thêm về cái này', 'Ủng hộ nhiệt tình! Keep it up!'],
      seeding: ['Cho mình hỏi thêm thông tin được không ạ? Mình đang cần cái này!', 'Sản phẩm này chất lượng thật sự không? Mình đang phân vân', 'Bạn ơi, order ở đâu vậy? Muốn thử quá!'],
      viral: ['Trời ơi đỉnh quá vậy!! 🔥🔥', 'Tag ngay mấy đứa bạn để xem cái này 😂😂', 'Mình cần cái này trong cuộc đời!! Ai đồng ý thả tim 💯'],
    };
    const arr = fallbacks[style];
    const comment = arr[Math.floor(Math.random() * arr.length)];
    document.getElementById(`comment-${postId}`).value = comment;
    state.actions[postId].commentText = comment;
    state.stats.aiGenerated++;
    updateStats();
    addLog(`[Demo] Comment generated (API not configured): "${comment}"`, 'warn');
    toast('Comment demo (API chưa cấu hình)', 'warn');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> AI Generate`;
  }
}

// ─── SMART EXECUTION ─────────────────────────────────────────────────────────
async function runExecution() {
  if (state.running) { toast('Đang chạy rồi!', 'warn'); return; }
  if (!state.posts.length) { toast('Chưa có posts. Fetch posts trước!', 'warn'); showSection('dashboard'); return; }

  const selectedPosts = state.posts.filter(p => {
    const a = state.actions[p.id];
    return a && (a.like || a.comment || a.share);
  });

  if (!selectedPosts.length) {
    toast('Chưa chọn action nào!', 'warn');
    showSection('posts');
    return;
  }

  state.running = true;
  state.stats.done = 0;
  const runBtn = document.getElementById('run-btn');
  const badge = document.getElementById('run-status-badge');
  runBtn.innerHTML = `<svg class="w-4 h-4 spinner" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="25 75" stroke-linecap="round"/></svg> Running`;
  runBtn.disabled = true;
  badge.classList.remove('hidden');
  badge.classList.add('flex');

  const dot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  dot.className = 'w-2 h-2 rounded-full bg-emerald-400 badge-live';
  statusText.textContent = 'Running...';

  showSection('logs');
  addLog(`═══ Execution started: ${selectedPosts.length} posts selected ═══`, 'action');

  const delayMin = parseInt(document.getElementById('delay-min').value) || 7;
  const delayMax = parseInt(document.getElementById('delay-max').value) || 20;

  for (let i = 0; i < selectedPosts.length; i++) {
    const post = selectedPosts[i];
    const a = state.actions[post.id];
    const postUrl = post.url && post.url.includes('facebook.com') ? post.url : null;
    const displayUrl = postUrl || state.pageUrl || 'https://www.facebook.com';

    addLog(`─────────────────────────────────────`, 'info');
    addLog(`[${i + 1}/${selectedPosts.length}] Bài viết: ${post.content ? `"${post.content.slice(0,50)}..."` : `Slot #${i+1}`}`, 'info');

    // Update card status
    const cardStatus = document.getElementById(`card-status-${post.id}`);
    if (cardStatus) { cardStatus.textContent = '⚙️ Processing...'; cardStatus.className = 'text-xs text-yellow-400'; }

    // Warn if no specific post URL
    if (!postUrl) {
      addLog(`⚠ Slot #${i+1} chưa có URL bài cụ thể → mở trang Page chính`, 'warn');
      addLog(`   Hãy tìm bài viết trên Page và thao tác thủ công`, 'warn');
    }

    // Open URL
    addLog(`⚡ Mở tab: ${displayUrl}`, 'action');
    window.open(displayUrl, '_blank');

    // Actions guidance
    if (a.like) addLog(`  → Hãy bấm LIKE trên bài viết`, 'info');
    if (a.share) addLog(`  → Hãy bấm SHARE trên bài viết`, 'info');
    if (a.comment && a.commentText) {
      try {
        await navigator.clipboard.writeText(a.commentText);
        addLog(`  → ✓ Comment đã copy vào clipboard — Paste (Ctrl+V) vào ô comment`, 'success');
        toast(`[Bài ${i + 1}] Comment copied! Paste vào Facebook`, 'success');
      } catch {
        addLog(`  → Comment: "${a.commentText}"`, 'warn');
        addLog(`  → Copy thủ công đoạn trên vào ô comment`, 'warn');
        toast(`[Bài ${i + 1}] Clipboard thất bại — xem Logs`, 'warn');
      }
    } else if (a.comment && !a.commentText) {
      addLog(`  → ⚠ Comment được chọn nhưng chưa có nội dung`, 'warn');
    }

    // Delay countdown
    const delay = randomBetween(delayMin, delayMax);
    addLog(`  ⏱ Chờ ${delay}s trước bài tiếp theo...`, 'info');
    for (let t = delay; t > 0; t--) {
      statusText.textContent = `Bài ${i+1}/${selectedPosts.length} — next in ${t}s`;
      await sleep(1000);
    }

    state.stats.done++;
    updateStats();
    if (cardStatus) { cardStatus.textContent = '✓ Done'; cardStatus.className = 'text-xs text-emerald-400'; }
    addLog(`✓ Bài ${i + 1} hoàn tất`, 'success');
  }

  // Finish
  state.running = false;
  runBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> RUN`;
  runBtn.disabled = false;
  badge.classList.add('hidden');
  badge.classList.remove('flex');
  dot.className = 'w-2 h-2 rounded-full bg-slate-500';
  statusText.textContent = 'Idle';

  addLog(`═══ Execution complete! ${state.stats.done} posts processed ═══`, 'success');
  toast(`Hoàn thành! Đã xử lý ${state.stats.done} bài viết`, 'success');
  updateStats();
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
