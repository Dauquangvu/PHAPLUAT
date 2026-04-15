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

  const btn = document.getElementById('fetch-btn');
  const icon = document.getElementById('fetch-icon');
  btn.disabled = true;
  icon.outerHTML = `<svg id="fetch-icon" class="w-4 h-4 spinner" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="25 75" stroke-linecap="round"/></svg>`;

  addLog(`Fetching posts from: ${url}`, 'info');

  try {
    // Extract page name from URL for demo
    const match = url.match(/facebook\.com\/([^/?]+)/);
    const pageName = match ? match[1] : 'page';

    // Since Facebook Graph API requires auth token, we generate realistic mock data
    // In production, replace with real FB Graph API call using user's access token
    await sleep(1200);
    state.posts = generateMockPosts(pageName, 10);
    state.actions = {};
    state.posts.forEach(p => {
      state.actions[p.id] = { like: false, comment: false, share: false, commentText: '' };
    });

    renderPosts();
    updateStats();
    addLog(`Loaded ${state.posts.length} posts successfully`, 'success');
    toast(`Đã load ${state.posts.length} bài viết!`, 'success');
    showSection('posts');
  } catch (e) {
    addLog(`Error: ${e.message}`, 'error');
    toast('Lỗi khi fetch posts', 'error');
  } finally {
    btn.disabled = false;
    document.getElementById('fetch-icon').outerHTML = `<svg id="fetch-icon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>`;
  }
}

function generateMockPosts(pageName, count) {
  const contents = [
    `🎉 Chúng tôi vừa ra mắt sản phẩm mới! Hãy trải nghiệm ngay hôm nay và chia sẻ cảm nhận của bạn. Link trong bio nhé! #newproduct #launch`,
    `Mùa hè này, cùng ${pageName} khám phá những điều thú vị nhất! Đừng bỏ lỡ chương trình ưu đãi đặc biệt dành cho khách hàng thân thiết 🔥`,
    `✨ Cảm ơn 100K followers đã đồng hành cùng chúng tôi! Để tri ân, chúng tôi có một surprise đặc biệt sắp được công bố...`,
    `Bạn đã thử công thức này chưa? Siêu đơn giản, siêu ngon! Comment "CÓ" nếu bạn muốn full recipe 👇`,
    `Hôm nay là ngày đặc biệt — kỷ niệm 5 năm thành lập. Hành trình từ 0 đến đây thật sự không dễ dàng. Cảm ơn tất cả! 💙`,
    `🚨 FLASH SALE 24H — Giảm đến 50% toàn bộ sản phẩm. Shop ngay trước khi hết hàng! Tag bạn bè để cùng mua nhé!`,
    `Tip nhỏ cho ngày mới: ${pageName} luôn tin rằng mỗi ngày là một cơ hội mới. Hãy bắt đầu ngày hôm nay với năng lượng tích cực! ☀️`,
    `Review thật từ khách hàng: "Tôi đã dùng sản phẩm này 3 tháng và kết quả thật sự ấn tượng!" — Minh Anh, HN. Cảm ơn bạn đã tin tưởng ❤️`,
    `Livestream tối nay lúc 8PM! Chúng tôi sẽ có Q&A, giveaway và nhiều điều bất ngờ. Set reminder ngay! 📺`,
    `Weekend vibes! Còn bạn, cuối tuần này làm gì? Comment chia sẻ cùng cộng đồng nhé 😊 #weekend #lifestyle`,
  ];

  const images = [
    'https://picsum.photos/seed/fb1/600/400',
    'https://picsum.photos/seed/fb2/600/400',
    'https://picsum.photos/seed/fb3/600/400',
    null,
    'https://picsum.photos/seed/fb5/600/400',
    'https://picsum.photos/seed/fb6/600/400',
    null,
    'https://picsum.photos/seed/fb8/600/400',
    'https://picsum.photos/seed/fb9/600/400',
    'https://picsum.photos/seed/fb10/600/400',
  ];

  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `post_${i + 1}`,
    content: contents[i] || `Bài viết số ${i + 1} từ ${pageName}`,
    image: images[i] || null,
    likes: Math.floor(Math.random() * 500) + 10,
    comments: Math.floor(Math.random() * 80) + 2,
    shares: Math.floor(Math.random() * 40),
    time: new Date(now - i * 3600000 * 4).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    url: `https://www.facebook.com/${pageName.replace('https://www.facebook.com/', '')}/posts/sample_${i + 1}`,
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
          <p class="text-sm text-slate-200 leading-relaxed mb-2 line-clamp-3">${escapeHtml(post.content)}</p>
          ${post.image ? `<img src="${post.image}" alt="" class="w-full max-h-48 object-cover rounded-lg mb-2 bg-slate-800" loading="lazy" />` : ''}
          <div class="flex items-center gap-3 text-xs text-slate-500 mb-3">
            <span>👍 ${post.likes}</span>
            <span>💬 ${post.comments}</span>
            <span>🔗 ${post.shares}</span>
            <span class="ml-auto">${post.time}</span>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-2 mb-3">
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
            </div>
            <textarea id="comment-${post.id}" rows="2" placeholder="Nhập comment hoặc dùng AI Generate..."
              oninput="updateComment('${post.id}',this.value)"
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none">${escapeHtml(a.commentText || '')}</textarea>
          </div>
        </div>
      </div>
      <!-- Card footer -->
      <div class="px-4 py-2.5 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <a href="${post.url}" target="_blank" class="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          Mở bài viết
        </a>
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

    addLog(`[${i + 1}/${selectedPosts.length}] Processing: "${post.content.slice(0, 40)}..."`, 'info');

    // Update card status
    const cardStatus = document.getElementById(`card-status-${post.id}`);
    if (cardStatus) cardStatus.textContent = '⚙️ Processing...';
    if (cardStatus) cardStatus.className = 'text-xs text-yellow-400';

    // Open post in new tab
    addLog(`Opening post URL in new tab...`, 'action');
    window.open(post.url, '_blank');

    // Log planned actions
    if (a.like) addLog(`Action: Like this post`, 'info');
    if (a.share) addLog(`Action: Share this post`, 'info');
    if (a.comment && a.commentText) {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(a.commentText);
        addLog(`✓ Comment copied to clipboard: "${a.commentText.slice(0, 60)}..."`, 'success');
        toast(`Đã copy comment cho bài ${i + 1}!`, 'success');
      } catch {
        addLog(`⚠ Could not auto-copy. Manual copy: "${a.commentText}"`, 'warn');
        toast(`Copy thủ công comment bài ${i + 1}`, 'warn');
      }
    } else if (a.comment && !a.commentText) {
      addLog(`⚠ Comment checked but no text — skipping copy`, 'warn');
    }

    // Delay
    const delay = randomBetween(delayMin, delayMax);
    addLog(`Waiting ${delay}s before next post...`, 'info');

    // Countdown
    for (let t = delay; t > 0; t--) {
      statusText.textContent = `Next in ${t}s...`;
      await sleep(1000);
    }

    state.stats.done++;
    updateStats();
    if (cardStatus) { cardStatus.textContent = '✓ Done'; cardStatus.className = 'text-xs text-emerald-400'; }
    addLog(`Post ${i + 1} done`, 'success');
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
