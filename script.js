// =============================================
// FB Interaction Pro — script.js
// =============================================

let posts = [];
let logCount = 0;
let doneCount = 0;
let isRunning = false;

// ---- NAVIGATION ----
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');

  const items = document.querySelectorAll('.sidebar-item');
  const labels = ['dashboard', 'posts', 'logs', 'settings'];
  labels.forEach((l, i) => { if (l === name) items[i].classList.add('active'); });

  const titles = {
    dashboard: ['Dashboard', 'Tổng quan hoạt động'],
    posts: ['Posts', 'Quản lý bài viết'],
    logs: ['Logs', 'Nhật ký thực thi'],
    settings: ['Cài đặt', 'Cấu hình hệ thống'],
  };
  document.getElementById('page-title').textContent = titles[name][0];
  document.getElementById('page-sub').textContent = titles[name][1];
}

// ---- MOCK DATA ----
const MOCK_POSTS = [
  { id: 1, url: 'https://facebook.com/post/1001', content: '🎉 Chúng tôi vừa ra mắt sản phẩm mới hoàn toàn đột phá! Cảm ơn tất cả mọi người đã đồng hành cùng chúng tôi trong suốt hành trình này. Hãy like và share để ủng hộ nhé!', image: 'https://picsum.photos/seed/fb1/400/220', likes: 842, comments: 134, shares: 67, time: '2 giờ trước' },
  { id: 2, url: 'https://facebook.com/post/1002', content: '📊 Kết quả kinh doanh Q1 2025 vượt kỳ vọng! Doanh thu tăng 43% so với cùng kỳ năm ngoái. Đây là thành quả của cả đội ngũ 200+ thành viên.', image: 'https://picsum.photos/seed/fb2/400/220', likes: 1203, comments: 89, shares: 45, time: '5 giờ trước' },
  { id: 3, url: 'https://facebook.com/post/1003', content: '🌟 Tips quan trọng cho startup năm 2025: Đừng chỉ tập trung vào product mà quên đi community. Community mới là thứ tạo ra growth bền vững.', image: null, likes: 567, comments: 203, shares: 128, time: '8 giờ trước' },
  { id: 4, url: 'https://facebook.com/post/1004', content: '💡 Workshop miễn phí: "AI trong Marketing 2025" — Đăng ký ngay hôm nay! Chỉ còn 50 suất cuối cùng. Link đăng ký trong comment nhé.', image: 'https://picsum.photos/seed/fb4/400/220', likes: 2341, comments: 456, shares: 312, time: '1 ngày trước' },
  { id: 5, url: 'https://facebook.com/post/1005', content: '🔥 Flashsale 48h! Giảm đến 70% toàn bộ sản phẩm. Cơ hội cuối năm không thể bỏ lỡ. Tag bạn bè vào để không ai bỏ lỡ deal này nhé!', image: 'https://picsum.photos/seed/fb5/400/220', likes: 4892, comments: 1204, shares: 876, time: '2 ngày trước' },
  { id: 6, url: 'https://facebook.com/post/1006', content: '❤️ Cảm ơn 100,000 followers đã luôn tin tưởng và ủng hộ! Mỗi comment, like, share của các bạn đều là động lực để chúng tôi tiếp tục cống hiến.', image: 'https://picsum.photos/seed/fb6/400/220', likes: 8934, comments: 2341, shares: 1204, time: '3 ngày trước' },
  { id: 7, url: 'https://facebook.com/post/1007', content: '🚀 Chính thức mở văn phòng tại TP.HCM! Chúng tôi đang tuyển dụng nhiều vị trí hấp dẫn. Developer, Designer, Marketing... Inbox ngay!', image: null, likes: 1567, comments: 345, shares: 189, time: '4 ngày trước' },
  { id: 8, url: 'https://facebook.com/post/1008', content: '📱 Update mới nhất của app đã có trên Store! Giao diện hoàn toàn mới, tốc độ nhanh hơn 3x, thêm nhiều tính năng thú vị. Cập nhật ngay!', image: 'https://picsum.photos/seed/fb8/400/220', likes: 3421, comments: 789, shares: 234, time: '5 ngày trước' },
  { id: 9, url: 'https://facebook.com/post/1009', content: '🌈 Diversity & Inclusion tại công ty chúng tôi không chỉ là khẩu hiệu mà là văn hóa thực sự. Tự hào khi đội ngũ của chúng tôi đến từ 12 quốc gia!', image: 'https://picsum.photos/seed/fb9/400/220', likes: 2103, comments: 456, shares: 312, time: '6 ngày trước' },
  { id: 10, url: 'https://facebook.com/post/1010', content: '📣 QUAN TRỌNG: Thay đổi chính sách sử dụng dịch vụ từ 01/02/2025. Vui lòng đọc kỹ và xác nhận đồng ý trước ngày 31/01. Link trong bio.', image: null, likes: 456, comments: 234, shares: 567, time: '1 tuần trước' },
];

// ---- FETCH POSTS ----
async function fetchPosts() {
  const url = document.getElementById('page-url').value.trim();
  if (!url) { showToast('Vui lòng nhập URL page!', 'warning'); return; }

  const btn = document.getElementById('fetch-btn');
  const icon = document.getElementById('fetch-icon');
  const label = document.getElementById('fetch-label');

  btn.disabled = true;
  icon.innerHTML = '<div class="spinner"></div>';
  label.textContent = 'Đang tải...';

  // Simulate delay
  await delay(1200);

  posts = MOCK_POSTS.map(p => ({ ...p, like: false, comment: false, share: false, commentText: '', style: 'natural' }));
  renderPosts();
  updateStats();

  btn.disabled = false;
  icon.textContent = '⬇';
  label.textContent = 'Fetch Posts';

  document.getElementById('post-count-badge').textContent = posts.length;
  document.getElementById('post-count-badge').classList.remove('hidden');
  document.getElementById('run-btn').disabled = false;

  showToast(`Đã tải ${posts.length} bài viết!`, 'success');
  addLog('success', `Loaded ${posts.length} posts from: ${url}`);
  showSection('posts');
}

// ---- RENDER POSTS ----
function renderPosts() {
  const container = document.getElementById('posts-container');
  if (!posts.length) {
    container.innerHTML = `<div class="text-center py-16" style="color:var(--muted)"><div class="text-4xl mb-3">📭</div><p class="text-sm">Chưa có posts.</p></div>`;
    return;
  }

  container.innerHTML = posts.map((post, idx) => `
    <div class="post-card p-4 mb-4 slide-in ${post.like || post.comment || post.share ? 'selected' : ''}" id="post-card-${idx}">
      <div class="flex gap-4">
        ${post.image ? `<img src="${post.image}" class="w-28 h-20 rounded-lg object-cover flex-shrink-0" onerror="this.style.display='none'" />` : ''}
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2 mb-2">
            <p class="text-sm leading-relaxed" style="color:var(--text)">${post.content.substring(0, 140)}${post.content.length > 140 ? '...' : ''}</p>
            <span class="text-xs flex-shrink-0" style="color:var(--muted)">${post.time}</span>
          </div>
          <div class="flex gap-3 text-xs mb-3" style="color:var(--muted)">
            <span>👍 ${post.likes.toLocaleString()}</span>
            <span>💬 ${post.comments.toLocaleString()}</span>
            <span>🔄 ${post.shares.toLocaleString()}</span>
          </div>
          <!-- Actions -->
          <div class="flex flex-wrap gap-4 items-center">
            <label class="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" class="checkbox-custom" ${post.like ? 'checked' : ''} onchange="toggleAction(${idx},'like',this.checked)" />
              <span>👍 Like</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" class="checkbox-custom" ${post.comment ? 'checked' : ''} onchange="toggleAction(${idx},'comment',this.checked)" />
              <span>💬 Comment</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" class="checkbox-custom" ${post.share ? 'checked' : ''} onchange="toggleAction(${idx},'share',this.checked)" />
              <span>🔄 Share</span>
            </label>
            <a href="${post.url}" target="_blank" class="text-xs ml-auto" style="color:var(--accent)">Xem bài →</a>
          </div>
        </div>
      </div>

      <!-- Comment section -->
      ${post.comment ? `
        <div class="mt-3 pt-3 border-t" style="border-color:var(--border)">
          <div class="flex gap-2 mb-2 items-center">
            <span class="text-xs" style="color:var(--muted)">Style:</span>
            <select class="input text-xs py-1 px-2" style="max-width:140px;height:auto" onchange="updateStyle(${idx},this.value)">
              <option value="natural" ${post.style==='natural'?'selected':''}>🌿 Tự nhiên</option>
              <option value="seeding" ${post.style==='seeding'?'selected':''}>🌱 Seeding</option>
              <option value="viral" ${post.style==='viral'?'selected':''}>🔥 Viral</option>
            </select>
            <button class="btn btn-cyan text-xs py-1 px-3 ml-auto" id="ai-btn-${idx}" onclick="generateComment(${idx})">
              🤖 AI Generate
            </button>
          </div>
          <textarea class="input text-sm" rows="2" placeholder="Nhập comment hoặc generate bằng AI..."
            onchange="updateComment(${idx},this.value)">${post.commentText}</textarea>
          ${post.commentText ? `<div class="flex items-center gap-1 mt-1"><div class="pulse-dot" style="background:var(--success)"></div><span class="text-xs" style="color:var(--success)">Ready</span></div>` : ''}
        </div>
      ` : ''}
    </div>
  `).join('');
}

// ---- INTERACTION TOGGLES ----
function toggleAction(idx, action, val) {
  posts[idx][action] = val;
  updateStats();
  renderPosts();
}

function updateStyle(idx, val) { posts[idx].style = val; }
function updateComment(idx, val) { posts[idx].commentText = val; }

// ---- AI GENERATE ----
async function generateComment(idx) {
  const post = posts[idx];
  const btn = document.getElementById(`ai-btn-${idx}`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Đang tạo...'; }

  const styleLabels = { natural: 'tự nhiên, chân thật, thân thiện', seeding: 'marketing seeding tự nhiên, tạo tò mò', viral: 'viral mạnh, kêu gọi chia sẻ' };
  const prompt = `Tạo 1 comment Facebook ${styleLabels[post.style]} cho bài viết sau. Comment ngắn gọn 1-2 câu, tiếng Việt, không hashtag quá nhiều:\n\n"${post.content.substring(0, 200)}"`;

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text = data.result || data.content?.[0]?.text || 'Bài viết rất hay! Cảm ơn bạn đã chia sẻ 👍';

    posts[idx].commentText = text.trim();
    document.getElementById('stat-comments').textContent =
      parseInt(document.getElementById('stat-comments').textContent) + 1;
    addLog('success', `AI generated comment for post #${idx + 1} [${post.style}]`);
  } catch (err) {
    // Fallback comments
    const fallbacks = {
      natural: 'Bài viết rất hay và ý nghĩa! Cảm ơn bạn đã chia sẻ 😊',
      seeding: 'Thật sự ấn tượng! Mình đã thử và kết quả khá tốt, ai chưa biết nên tìm hiểu nhé 🌟',
      viral: '🔥 QUÁ ĐỈNH! Tag ngay bạn bè vào xem, đừng để bỏ lỡ! Share gấp!!!'
    };
    posts[idx].commentText = fallbacks[post.style];
    addLog('warning', `AI fallback used for post #${idx + 1}: ${err.message}`);
  }

  renderPosts();
  if (btn) { btn.disabled = false; btn.innerHTML = '🤖 AI Generate'; }
}

// ---- BULK ACTIONS ----
function selectAll() {
  posts.forEach(p => p.like = true);
  renderPosts(); updateStats();
  showToast('Đã chọn Like cho tất cả', 'success');
}

function selectAllComments() {
  posts.forEach(p => p.comment = true);
  renderPosts(); updateStats();
  showToast('Đã chọn Comment cho tất cả', 'success');
}

async function generateAllComments() {
  const defaultStyle = document.getElementById('default-style').value;
  const commentPosts = posts.filter(p => p.comment);
  if (!commentPosts.length) { showToast('Chưa chọn comment post nào!', 'warning'); return; }

  showToast(`Generating ${commentPosts.length} comments...`, 'info');
  for (let i = 0; i < posts.length; i++) {
    if (posts[i].comment) {
      posts[i].style = defaultStyle;
      await generateComment(i);
      await delay(400);
    }
  }
  showToast('Đã generate xong tất cả!', 'success');
}

function clearSelection() {
  posts.forEach(p => { p.like = false; p.comment = false; p.share = false; });
  renderPosts(); updateStats();
  showToast('Đã bỏ chọn tất cả', 'info');
}

// ---- EXECUTION ----
async function runExecution() {
  if (isRunning) return;
  const selected = posts.filter(p => p.like || p.comment || p.share);
  if (!selected.length) { showToast('Chưa chọn action nào!', 'warning'); return; }

  isRunning = true;
  doneCount = 0;
  document.getElementById('run-btn').disabled = true;
  document.getElementById('run-btn').innerHTML = '<div class="spinner"></div> Running...';
  setStatus('running', '🔄 Đang chạy...');

  document.getElementById('progress-bar-wrap').classList.remove('hidden');
  showSection('logs');
  addLog('info', `=== BẮT ĐẦU THỰC THI: ${selected.length} posts ===`);

  const minD = parseInt(document.getElementById('delay-min').value) * 1000;
  const maxD = parseInt(document.getElementById('delay-max').value) * 1000;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    if (!post.like && !post.comment && !post.share) continue;

    const actions = [];
    if (post.like) actions.push('👍 Like');
    if (post.comment) actions.push('💬 Comment');
    if (post.share) actions.push('🔄 Share');

    addLog('info', `[${i + 1}/${posts.length}] Mở bài: ${actions.join(', ')}`);

    // Open tab
    window.open(post.url, '_blank');
    await delay(800);

    // Copy comment to clipboard
    if (post.comment && post.commentText) {
      try {
        await navigator.clipboard.writeText(post.commentText);
        addLog('success', `Đã copy comment vào clipboard: "${post.commentText.substring(0, 50)}..."`);
      } catch {
        addLog('warning', `Không thể auto-copy. Comment: ${post.commentText.substring(0, 60)}`);
      }
    }

    doneCount++;
    const pct = Math.round((doneCount / selected.length) * 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('stat-done').textContent = doneCount;

    if (i < posts.length - 1) {
      const waitMs = Math.floor(Math.random() * (maxD - minD)) + minD;
      addLog('warning', `⏳ Chờ ${(waitMs / 1000).toFixed(1)}s trước bài tiếp theo...`);
      await delay(waitMs);
    }
  }

  addLog('success', `=== HOÀN THÀNH! ${doneCount} bài đã xử lý ===`);
  setStatus('idle', '✅ Done');
  showToast(`Hoàn thành ${doneCount} bài!`, 'success');

  isRunning = false;
  document.getElementById('run-btn').disabled = false;
  document.getElementById('run-btn').innerHTML = '<span>▶</span> RUN';
}

// ---- LOGS ----
function addLog(type, msg) {
  const container = document.getElementById('log-container');
  const time = new Date().toLocaleTimeString('vi-VN');
  const typeMap = { info: 'INFO', success: 'OK', warning: 'WARN', error: 'ERR' };
  const div = document.createElement('div');
  div.className = `log-entry log-${type} slide-in`;
  div.innerHTML = `<span style="color:var(--muted)">[${time}]</span> <span class="badge badge-${type === 'info' ? 'blue' : type === 'success' ? 'green' : type === 'warning' ? 'yellow' : 'red'}">${typeMap[type]}</span> ${msg}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  logCount++;
  const badge = document.getElementById('log-badge');
  badge.textContent = logCount;
  badge.classList.remove('hidden');
}

function clearLogs() {
  document.getElementById('log-container').innerHTML = '';
  logCount = 0;
  document.getElementById('log-badge').classList.add('hidden');
}

// ---- STATS ----
function updateStats() {
  document.getElementById('stat-posts').textContent = posts.length;
  const sel = posts.filter(p => p.like || p.comment || p.share).length;
  document.getElementById('stat-selected').textContent = sel;
}

// ---- STATUS ----
function setStatus(state, text) {
  const dot = document.getElementById('status-dot');
  const txt = document.getElementById('status-text');
  txt.textContent = text;
  const colors = { running: 'var(--accent)', idle: 'var(--muted)', done: 'var(--success)' };
  dot.style.background = colors[state] || colors.idle;
}

// ---- UTILS ----
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function showToast(msg, type = 'info') {
  const colors = { success: 'var(--success)', warning: 'var(--warning)', error: 'var(--danger)', info: 'var(--accent)' };
  const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `background:${colors[type]}22;border:1px solid ${colors[type]}44;color:var(--text)`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
