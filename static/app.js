'use strict';

const MAX_BYTES = 2 * 1024 ** 3;
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v', 'ogv'];
const OPENED_KEY = 'yeongsang-pyeonji:opened';
const VIEWS = ['gift', 'letter', 'camera', 'hbd'];
const COLORS = ['#ff7aa2', '#ffd23f', '#5fd3a4', '#6ec3f4', '#b69cf2', '#ff9f43'];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// 손그림 느낌의 선물 상자. 뚜껑(.gift-lid)이 왼쪽 모서리를 축으로 열린다.
const GIFT_SVG = `
<svg class="gift-svg" viewBox="0 0 200 200" aria-hidden="true">
  <ellipse class="gift-shadow" cx="103" cy="191" rx="62" ry="7"/>
  <g class="gift-body">
    <path class="g-dark" d="M131 108 L160 97 L158 173 L130 187 Z"/>
    <path class="g-box" d="M47 103 L131 108 L130 187 Q88 191 49 184 Z"/>
    <path class="g-ribbon-dark" d="M143 103.5 L150 101 L149 177.5 L142 181 Z"/>
    <path class="g-ribbon" d="M82 105.5 L97 106.4 L96.5 189 L83 187.5 Z"/>
    <path class="g-shine" d="M57 116 V134 M57 142 V147"/>
  </g>
  <g class="gift-inside">
    <path class="g-inner" d="M47 103 L76 93 L160 97 L131 108 Z"/>
    <g class="gift-tissue">
      <path class="g-tissue" d="M54 104 L60 84 L70 96 L79 76 L90 94 L101 72 L112 92 L124 77 L132 95 L145 82 L151 101 L131 108 Z"/>
    </g>
  </g>
  <g class="gift-lid">
    <path class="g-light" d="M38 88 L69 76 L170 81 L141 93 Z"/>
    <path class="g-box" d="M38 88 L141 93 L140 114 L40 109.5 Z"/>
    <path class="g-dark" d="M141 93 L170 81 L169 101 L140 114 Z"/>
    <path class="g-ribbon" d="M81 90.3 L97 91 L97 111.8 L81.5 111 Z"/>
    <path class="g-ribbon-dark" d="M151 88.8 L158 85.9 L157.5 106.2 L150.5 109.4 Z"/>
    <path class="g-ribbon" d="M81 90.3 L97 91 L126 79 L110 78.3 Z"/>
    <path class="g-ribbon" d="M51 83 L56 81 L157.8 86 L153.2 88 Z"/>
    <path class="g-ribbon" d="M100 88 L91 104 L96.5 102 L99.5 107.5 L105 89 Z"/>
    <path class="g-ribbon" d="M108 88 L118 101.5 L112.5 101 L111 106.5 L104 89 Z"/>
    <path class="g-ribbon" d="M104 84 C92 66 70 64 74 78 C77 88 94 88 104 84 Z"/>
    <path class="g-ribbon" d="M104 84 C112 64 138 62 136 76 C134 88 114 88 104 84 Z"/>
    <path class="g-crease" d="M97 80 C90 74 83 73 80 77 M111 80 C118 73 126 72 129 75"/>
    <ellipse class="g-ribbon" cx="104" cy="84" rx="7.5" ry="6"/>
    <path class="g-shine" d="M47 95 V103"/>
  </g>
</svg>`;

const PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>';

// 케이크 주변 색종이: [x, y, 각도, 색 번호]
const SPRINKLES = [
  [16, 20, 30, 0], [38, 10, -20, 3], [58, 28, 60, 1], [12, 48, -45, 2], [34, 38, 15, 4], [52, 56, -70, 5],
  [20, 76, 40, 3], [42, 86, -15, 0], [60, 98, 75, 2], [14, 104, -30, 1], [34, 118, 20, 4],
  [216, 18, -35, 1], [196, 8, 25, 0], [180, 28, -60, 2], [220, 46, 50, 3], [200, 38, -10, 5], [184, 58, 70, 4],
  [214, 74, -40, 0], [194, 86, 15, 1], [178, 100, -75, 3], [220, 104, 30, 2], [200, 118, -20, 5],
  [86, 10, -25, 4], [150, 8, 35, 3], [70, 44, 50, 0], [168, 42, -40, 1],
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const els = {
  cake: $('#cake'),
  sprinkles: $('#sprinkles'),
  gifts: $('#gifts'),
  giftEmpty: $('#giftEmpty'),
  letters: $('#letters'),
  letterEmpty: $('#letterEmpty'),
  hbdTitle: $('#hbdTitle'),
  hbdBurst: $('#hbdBurst'),
  confettiLayer: $('#confettiLayer'),
  toast: $('#toast'),
  dropOverlay: $('#dropOverlay'),

  loginForm: $('#loginForm'),
  passwordInput: $('#passwordInput'),
  loginError: $('#loginError'),
  cameraPanel: $('#cameraPanel'),
  logoutBtn: $('#logoutBtn'),
  uploadForm: $('#uploadForm'),
  dropzone: $('#dropzone'),
  dzEmpty: $('#dzEmpty'),
  dzFile: $('#dzFile'),
  fileInput: $('#fileInput'),
  previewThumb: $('#previewThumb'),
  fileName: $('#fileName'),
  fileMeta: $('#fileMeta'),
  changeFile: $('#changeFile'),
  titleInput: $('#titleInput'),
  messageInput: $('#messageInput'),
  progress: $('#progress'),
  progressBar: $('#progressBar'),
  progressLabel: $('#progressLabel'),
  formError: $('#formError'),
  cancelUpload: $('#cancelUpload'),
  submitBtn: $('#submitBtn'),
  packList: $('#packList'),
  packEmpty: $('#packEmpty'),
  packCount: $('#packCount'),
  rewrapBtn: $('#rewrapBtn'),

  letterDialog: $('#letterDialog'),
  letterClose: $('#letterClose'),
  letterVideo: $('#letterVideo'),
  letterTitle: $('#letterTitle'),
  letterDate: $('#letterDate'),
  letterMessage: $('#letterMessage'),
};

const state = { videos: [], opened: loadOpened(), busy: false, activeGift: null, admin: false };
const upload = { file: null, thumbnail: null, duration: 0, previewUrl: null, ready: false, xhr: null, autoTitle: '' };

/* ---------- 포맷 ---------- */

const dateFormat = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
const shortDateFormat = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' });
const formatDate = (iso) => dateFormat.format(new Date(iso));

// 선물 태그용: 올해면 "10월 30일", 지난해 이전이면 연도까지
function formatShortDate(iso) {
  const date = new Date(iso);
  return date.getFullYear() === new Date().getFullYear() ? shortDateFormat.format(date) : dateFormat.format(date);
}
const joinMeta = (...parts) => parts.filter(Boolean).join(' · ');
const thumbUrl = (video) => (video.thumbnail ? `/media/thumbs/${video.thumbnail}` : null);

function formatBytes(bytes) {
  if (!bytes) return '0B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${i === 0 || value >= 100 ? Math.round(value) : value.toFixed(1)}${units[i]}`;
}

function formatDuration(seconds) {
  if (!seconds || !Number.isFinite(seconds)) return '';
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/* ---------- 열어 본 선물 기록 (이 브라우저에만 저장) ---------- */

function loadOpened() {
  try {
    return new Set(JSON.parse(localStorage.getItem(OPENED_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveOpened() {
  try {
    localStorage.setItem(OPENED_KEY, JSON.stringify([...state.opened]));
  } catch {
    // 저장이 막혀 있어도 이번 방문 동안은 동작한다.
  }
}

/* ---------- 렌더링 ---------- */

function renderAll() {
  renderGifts();
  renderLetters();
  renderPackList();
}

function renderGifts() {
  const { videos } = state;
  els.gifts.replaceChildren(...videos.map(createGift));
  els.gifts.hidden = videos.length === 0;
  els.giftEmpty.hidden = videos.length > 0;
}

function createGift(video, index) {
  const li = document.createElement('li');
  li.innerHTML = `
    <button type="button" class="gift">
      <span class="gift-float">
        <span class="gift-glow" aria-hidden="true"></span>
        <span class="gift-art">${GIFT_SVG}</span>
      </span>
      <span class="gift-date"></span>
      <span class="gift-label"></span>
    </button>`;
  const button = li.firstElementChild;
  button.style.setProperty('--i', index);
  updateGift(button, video, index);
  button.addEventListener('click', () => openGift(button, video, index));
  return li;
}

function updateGift(button, video, index) {
  const opened = state.opened.has(video.id);
  const date = formatShortDate(video.created_at);
  button.classList.toggle('is-opened', opened);
  button.querySelector('.gift-date').textContent = date;
  button.querySelector('.gift-label').textContent = opened ? video.title : '';
  button.setAttribute('aria-label', opened ? `${video.title} 다시 보기, ${date}` : `선물 ${index + 1} 열기, ${date}`);
}

function renderLetters() {
  const letters = state.videos.filter((video) => video.message);
  els.letters.replaceChildren(...letters.map(createLetterCard));
  els.letters.hidden = letters.length === 0;
  els.letterEmpty.hidden = letters.length > 0;
}

function createLetterCard(video, index) {
  const sealed = !state.opened.has(video.id);
  const li = document.createElement('li');
  li.className = sealed ? 'letter-card is-sealed' : 'letter-card';
  li.style.setProperty('--tilt', `${index % 2 ? 1.2 : -1.2}deg`);
  li.innerHTML = `
    <span class="tape" aria-hidden="true"></span>
    <h3 class="letter-card-title"></h3>
    <p class="letter-card-message"></p>
    <div class="letter-card-foot">
      <span class="letter-card-date"></span>
      <button type="button" class="link-btn"></button>
    </div>`;
  li.querySelector('.letter-card-title').textContent = video.title;
  li.querySelector('.letter-card-date').textContent = formatDate(video.created_at);

  const message = li.querySelector('.letter-card-message');
  message.textContent = video.message;

  const action = li.querySelector('.link-btn');
  if (sealed) {
    message.setAttribute('aria-hidden', 'true');
    action.textContent = '선물 열러 가기';
    action.addEventListener('click', () => { location.hash = '#gift'; });
  } else {
    action.textContent = '영상 보기 ▶';
    action.addEventListener('click', () => openLetter(video));
  }
  return li;
}

function renderPackList() {
  const { videos } = state;
  els.packList.replaceChildren(...videos.map(createPackItem));
  els.packList.hidden = videos.length === 0;
  els.packEmpty.hidden = videos.length > 0;
  els.packCount.textContent = videos.length || '';
  els.rewrapBtn.disabled = !videos.some((video) => state.opened.has(video.id));
}

function createPackItem(video) {
  const li = document.createElement('li');
  li.className = 'pack-item';
  li.innerHTML = `
    <button type="button" class="thumb pack-thumb"><span class="thumb-play">${PLAY_ICON}</span></button>
    <div class="pack-info"><p class="pack-title"></p><p class="pack-meta"></p></div>
    <button type="button" class="btn btn-sm btn-danger">삭제</button>`;

  const thumb = li.querySelector('.pack-thumb');
  setThumb(thumb, thumbUrl(video));
  thumb.setAttribute('aria-label', `${video.title} 재생`);
  thumb.addEventListener('click', () => openLetter(video));

  li.querySelector('.pack-title').textContent = video.title;
  li.querySelector('.pack-meta').textContent = joinMeta(
    formatDate(video.created_at), formatDuration(video.duration), formatBytes(video.size),
  );
  confirmable(li.querySelector('.btn-danger'), () => deleteVideo(video));
  return li;
}

function setThumb(thumbEl, src) {
  thumbEl.querySelectorAll('.thumb-bg, .thumb-img').forEach((el) => el.remove());
  if (!src) return;
  const bg = document.createElement('img');
  bg.className = 'thumb-bg';
  const img = document.createElement('img');
  img.className = 'thumb-img';
  for (const el of [bg, img]) {
    el.alt = '';
    el.loading = 'lazy';
    el.src = src;
  }
  thumbEl.prepend(bg, img);
}

/* ---------- 선물 열기 ---------- */

async function openGift(button, video, index) {
  if (state.busy) return;
  state.busy = true;
  primePlayer(video);

  if (!state.opened.has(video.id) && !reducedMotion.matches) {
    state.activeGift = button;
    els.gifts.classList.add('is-focusing');
    button.classList.add('is-active', 'is-shaking');
    await wait(700);

    button.classList.remove('is-shaking');
    button.classList.add('is-opening', 'is-opened');
    const art = button.querySelector('.gift-art').getBoundingClientRect();
    burstConfetti(art.left + art.width / 2, art.top + art.height * 0.45, { count: 70 });
    await wait(1100);
  }

  state.opened.add(video.id);
  saveOpened();
  updateGift(button, video, index);
  renderLetters();
  els.rewrapBtn.disabled = false;
  openLetter(video);
  state.busy = false;
}

function setPlayerSource(video) {
  const src = `/media/${encodeURIComponent(video.filename)}`;
  if (els.letterVideo.getAttribute('src') === src) return;
  const poster = thumbUrl(video);
  if (poster) els.letterVideo.poster = poster;
  else els.letterVideo.removeAttribute('poster');
  els.letterVideo.src = src;
}

// 모바일 브라우저는 소리 있는 재생을 '탭한 그 순간'에만 허락한다.
// 애니메이션 전에 미리 한 번 재생했다 멈춰 두면, 애니메이션이 끝난 뒤에도 소리와 함께 재생된다.
function primePlayer(video) {
  const player = els.letterVideo;
  setPlayerSource(video);
  player.muted = true;
  player.play().then(() => {
    if (els.letterDialog.open) return;
    player.pause();
    player.currentTime = 0;
  }).catch(() => {});
}

function openLetter(video) {
  setPlayerSource(video);
  els.letterTitle.textContent = video.title;
  els.letterDate.textContent = formatDate(video.created_at);
  els.letterMessage.textContent = video.message;
  els.letterMessage.hidden = !video.message;
  els.letterVideo.muted = false;
  els.letterDialog.showModal();
  els.letterVideo.play().catch(() => {});
}

els.letterClose.addEventListener('click', () => els.letterDialog.close());

els.letterDialog.addEventListener('close', () => {
  els.letterVideo.pause();
  els.letterVideo.removeAttribute('src');
  els.letterVideo.load();
  els.gifts.classList.remove('is-focusing');
  state.activeGift?.classList.remove('is-active', 'is-opening');
  state.activeGift = null;
});

// 바깥(배경)을 눌렀다 뗐을 때만 닫는다. 입력창에서 드래그하다 밖에서 뗀 경우는 무시.
let pressedBackdrop = false;
els.letterDialog.addEventListener('pointerdown', (event) => {
  pressedBackdrop = event.target === els.letterDialog;
});
els.letterDialog.addEventListener('click', (event) => {
  if (pressedBackdrop && event.target === els.letterDialog) els.letterDialog.close();
});

/* ---------- 삭제 / 다시 포장 ---------- */

function confirmable(button, action) {
  const label = button.textContent;
  let timer;
  const reset = () => {
    clearTimeout(timer);
    button.classList.remove('is-confirm');
    button.textContent = label;
  };
  button.addEventListener('click', async () => {
    if (!button.classList.contains('is-confirm')) {
      button.classList.add('is-confirm');
      button.textContent = '정말 삭제?';
      timer = setTimeout(reset, 3000);
      return;
    }
    reset();
    button.disabled = true;
    try {
      await action();
    } catch {
      showToast('삭제하지 못했어요');
      button.disabled = false;
    }
  });
}

async function deleteVideo(video) {
  const res = await fetch(`/api/videos/${video.id}`, { method: 'DELETE' });
  if (res.status === 401) {
    requireLogin();
    return;
  }
  if (!res.ok && res.status !== 404) throw new Error(res.statusText);
  state.videos = state.videos.filter((v) => v.id !== video.id);
  if (state.opened.delete(video.id)) saveOpened();
  renderAll();
  showToast('선물을 삭제했어요');
}

els.rewrapBtn.addEventListener('click', () => {
  state.opened.clear();
  saveOpened();
  renderAll();
  showToast('모든 선물을 다시 포장했어요');
});

/* ---------- 관리자 로그인 (CAMERA) ---------- */

function renderCamera() {
  els.loginForm.hidden = state.admin;
  els.cameraPanel.hidden = !state.admin;
}

async function loadSession() {
  try {
    const res = await fetch('/api/session');
    state.admin = res.ok && (await res.json()).admin;
  } catch {
    state.admin = false;
  }
  renderCamera();
}

function requireLogin() {
  state.admin = false;
  renderCamera();
  showToast('비밀번호를 다시 입력해 주세요');
}

els.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = els.loginForm.querySelector('[type="submit"]');
  button.disabled = true;
  els.loginError.hidden = true;
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: els.passwordInput.value }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || '로그인하지 못했어요.');
    }
    els.loginForm.reset();
    state.admin = true;
    renderCamera();
    renderPackList();
  } catch (error) {
    els.loginError.textContent = error instanceof TypeError ? '서버에 연결하지 못했어요.' : error.message;
    els.loginError.hidden = false;
  } finally {
    button.disabled = false;
  }
});

els.logoutBtn.addEventListener('click', async () => {
  upload.xhr?.abort();
  await fetch('/api/logout', { method: 'POST' }).catch(() => {});
  resetUploadForm();
  state.admin = false;
  renderCamera();
  showToast('로그아웃했어요');
});

/* ---------- 업로드 ---------- */

function showError(message) {
  els.formError.textContent = message;
  els.formError.hidden = !message;
}

function setProgress(ratio) {
  els.progress.hidden = ratio == null;
  if (ratio == null) return;
  const percent = Math.round(ratio * 100);
  els.progressBar.style.width = `${percent}%`;
  els.progressLabel.textContent = percent >= 100 ? '마무리 중' : `${percent}%`;
}

function setUploading(isUploading) {
  els.titleInput.disabled = isUploading;
  els.messageInput.disabled = isUploading;
  els.changeFile.disabled = isUploading;
  els.cancelUpload.hidden = !isUploading;
  els.submitBtn.disabled = isUploading || !upload.ready;
  els.submitBtn.textContent = isUploading ? '포장하는 중…' : '선물 포장하기';
  setProgress(isUploading ? 0 : null);
}

function clearSelectedFile() {
  if (upload.previewUrl) URL.revokeObjectURL(upload.previewUrl);
  Object.assign(upload, { file: null, thumbnail: null, duration: 0, previewUrl: null, ready: false });
  els.dzEmpty.hidden = false;
  els.dzFile.hidden = true;
  els.submitBtn.disabled = true;
}

function resetUploadForm() {
  els.uploadForm.reset();
  clearSelectedFile();
  showError('');
  upload.autoTitle = '';
}

async function selectFile(file) {
  if (upload.xhr) return;
  showError('');

  const ext = file.name.split('.').pop().toLowerCase();
  if (!VIDEO_EXTENSIONS.includes(ext)) {
    showError('MP4, WebM, MOV 형식의 영상만 올릴 수 있어요.');
    return;
  }
  if (file.size > MAX_BYTES) {
    showError('2GB 이하의 영상만 올릴 수 있어요.');
    return;
  }

  clearSelectedFile();
  upload.file = file;

  // 제목을 직접 고치지 않았다면 파일 이름으로 채워 둔다.
  const stem = file.name.replace(/\.[^.]+$/, '');
  const currentTitle = els.titleInput.value.trim();
  if (!currentTitle || currentTitle === upload.autoTitle) els.titleInput.value = stem;
  upload.autoTitle = stem;

  els.dzEmpty.hidden = true;
  els.dzFile.hidden = false;
  els.fileName.textContent = file.name;
  els.fileMeta.textContent = '영상 정보를 읽는 중…';
  els.previewThumb.classList.add('is-loading');
  setThumb(els.previewThumb, null);

  const meta = await readVideoMeta(file);
  if (upload.file !== file) return; // 그 사이 다른 파일을 골랐다

  upload.duration = meta.duration;
  upload.thumbnail = meta.thumbnail;
  upload.previewUrl = meta.thumbnail ? URL.createObjectURL(meta.thumbnail) : null;
  upload.ready = true;

  els.previewThumb.classList.remove('is-loading');
  setThumb(els.previewThumb, upload.previewUrl);
  els.fileMeta.textContent = joinMeta(formatBytes(file.size), formatDuration(meta.duration));
  els.submitBtn.disabled = false;
}

// 브라우저에서 영상 길이를 읽고 1초 지점 장면을 썸네일(JPEG)로 캡처한다.
function readVideoMeta(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    let duration = 0;
    let settled = false;

    const finish = (thumbnail = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      resolve({ duration, thumbnail });
    };
    const timer = setTimeout(() => finish(), 10000);

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.addEventListener('error', () => finish(), { once: true });
    video.addEventListener('loadedmetadata', () => {
      duration = Number.isFinite(video.duration) ? video.duration : 0;
      video.currentTime = duration ? Math.min(1, duration * 0.25) : 0.1;
    }, { once: true });
    video.addEventListener('seeked', () => {
      const { videoWidth: width, videoHeight: height } = video;
      if (!width || !height) {
        finish();
        return;
      }
      const scale = Math.min(1, 720 / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => finish(blob), 'image/jpeg', 0.85);
    }, { once: true });
    video.src = url;
  });
}

function sendUpload(formData) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    upload.xhr = xhr;
    xhr.open('POST', '/api/videos');
    xhr.responseType = 'json';
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) setProgress(event.loaded / event.total);
    });
    xhr.addEventListener('load', () => {
      upload.xhr = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
        return;
      }
      const error = new Error(xhr.response?.error || `업로드에 실패했어요. (${xhr.status})`);
      error.status = xhr.status;
      reject(error);
    });
    xhr.addEventListener('error', () => {
      upload.xhr = null;
      reject(new Error('네트워크 오류로 업로드에 실패했어요.'));
    });
    xhr.addEventListener('abort', () => {
      upload.xhr = null;
      reject(new DOMException('업로드 취소', 'AbortError'));
    });
    xhr.send(formData);
  });
}

els.uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!upload.ready || upload.xhr) return;

  const formData = new FormData();
  formData.append('video', upload.file);
  formData.append('title', els.titleInput.value.trim());
  formData.append('message', els.messageInput.value.trim());
  formData.append('duration', String(upload.duration || 0));
  if (upload.thumbnail) formData.append('thumbnail', upload.thumbnail, 'thumbnail.jpg');

  showError('');
  setUploading(true);
  let video;
  try {
    video = await sendUpload(formData);
  } catch (error) {
    if (error.status === 401) requireLogin();
    else if (error.name === 'AbortError') showToast('업로드를 취소했어요');
    else showError(error.message);
    return;
  } finally {
    setUploading(false);
  }

  state.videos.unshift(video);
  renderAll();
  resetUploadForm();
  const rect = els.submitBtn.getBoundingClientRect();
  burstConfetti(rect.left + rect.width / 2, rect.top, { count: 50 });
  showToast('선물 포장 완료! GIFT에서 열어 보세요');
});

els.cancelUpload.addEventListener('click', () => upload.xhr?.abort());
els.dzEmpty.addEventListener('click', () => els.fileInput.click());
els.changeFile.addEventListener('click', () => els.fileInput.click());
els.fileInput.addEventListener('change', () => {
  const [file] = els.fileInput.files;
  if (file) selectFile(file);
  els.fileInput.value = '';
});

window.addEventListener('beforeunload', (event) => {
  if (upload.xhr) event.preventDefault();
});

/* ---------- 드래그 앤 드롭 ---------- */

const hasFiles = (event) => [...(event.dataTransfer?.types || [])].includes('Files');
let pageDragDepth = 0;
let zoneDragDepth = 0;

window.addEventListener('dragenter', (event) => {
  if (!hasFiles(event)) return;
  event.preventDefault();
  pageDragDepth += 1;
  if (state.admin && !els.letterDialog.open) els.dropOverlay.hidden = false;
});

window.addEventListener('dragover', (event) => {
  if (!hasFiles(event)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
});

window.addEventListener('dragleave', (event) => {
  if (!hasFiles(event)) return;
  pageDragDepth = Math.max(0, pageDragDepth - 1);
  if (pageDragDepth === 0) els.dropOverlay.hidden = true;
});

window.addEventListener('drop', (event) => {
  if (!hasFiles(event)) return;
  event.preventDefault();
  pageDragDepth = 0;
  zoneDragDepth = 0;
  els.dropOverlay.hidden = true;
  els.dropzone.classList.remove('is-over');
  const [file] = event.dataTransfer.files;
  if (!file || els.letterDialog.open) return;
  location.hash = '#camera';
  if (state.admin) selectFile(file);
  else showToast('먼저 비밀번호를 입력해 주세요');
});

els.dropzone.addEventListener('dragenter', () => {
  zoneDragDepth += 1;
  els.dropzone.classList.add('is-over');
});

els.dropzone.addEventListener('dragleave', () => {
  zoneDragDepth = Math.max(0, zoneDragDepth - 1);
  if (zoneDragDepth === 0) els.dropzone.classList.remove('is-over');
});

/* ---------- 색종이 ---------- */

function burstConfetti(x, y, { count = 60, angle = -90, spread = 110, power = 1 } = {}) {
  if (reducedMotion.matches) return;
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement('span');
    const size = 6 + Math.random() * 6;
    const round = Math.random() < 0.3;
    piece.className = 'confetti';
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.width = `${size}px`;
    piece.style.height = `${round ? size : size * 0.45}px`;
    piece.style.borderRadius = round ? '50%' : '2px';
    piece.style.background = COLORS[i % COLORS.length];
    els.confettiLayer.append(piece);

    const direction = ((angle + (Math.random() - 0.5) * spread) * Math.PI) / 180;
    const speed = (240 + Math.random() * 320) * power;
    const dx = Math.cos(direction) * speed;
    const dy = Math.sin(direction) * speed;
    const fall = 260 + Math.random() * 320;
    const spin = (Math.random() - 0.5) * 1080;

    piece.animate([
      { transform: 'translate(-50%, -50%)', opacity: 1 },
      { transform: `translate(-50%, -50%) translate(${dx * 0.85}px, ${dy * 0.85}px) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.35 },
      { transform: `translate(-50%, -50%) translate(${dx}px, ${dy + fall}px) rotate(${spin}deg)`, opacity: 0 },
    ], {
      duration: 1400 + Math.random() * 900,
      easing: 'cubic-bezier(.15, .7, .4, 1)',
    }).addEventListener('finish', () => piece.remove());
  }
}

function celebrate() {
  burstConfetti(0, innerHeight, { angle: -60, count: 80, power: 1.4 });
  burstConfetti(innerWidth, innerHeight, { angle: -120, count: 80, power: 1.4 });
}

els.cake.addEventListener('click', () => {
  const rect = els.cake.getBoundingClientRect();
  burstConfetti(rect.left + rect.width / 2, rect.top + rect.height * 0.3, { count: 60, spread: 160 });
});

els.hbdBurst.addEventListener('click', celebrate);

/* ---------- 메뉴 ---------- */

function showView() {
  const hash = location.hash.slice(1);
  const name = VIEWS.includes(hash) ? hash : 'gift';
  $$('[data-view]').forEach((view) => { view.hidden = view.dataset.view !== name; });
  $$('[data-nav]').forEach((link) => {
    if (link.dataset.nav === name) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (name === 'hbd') setTimeout(celebrate, 150);
}

window.addEventListener('hashchange', showView);

/* ---------- 시작 ---------- */

function renderDecorations() {
  $$('[data-gift-art]').forEach((el) => { el.innerHTML = GIFT_SVG; });

  els.sprinkles.innerHTML = SPRINKLES.map(([x, y, rotate, color]) => (
    `<rect x="${x - 5}" y="${y - 1.75}" width="10" height="3.5" rx="1.75" fill="${COLORS[color]}" transform="rotate(${rotate} ${x} ${y})"/>`
  )).join('');

  let n = 0;
  els.hbdTitle.replaceChildren(...['HAPPY', 'BIRTHDAY'].map((word) => {
    const wordEl = document.createElement('span');
    wordEl.className = 'hbd-word';
    wordEl.setAttribute('aria-hidden', 'true');
    for (const char of word) {
      const letter = document.createElement('span');
      letter.className = 'hbd-letter';
      letter.textContent = char;
      letter.style.setProperty('--c', COLORS[n % COLORS.length]);
      letter.style.setProperty('--d', n);
      wordEl.append(letter);
      n += 1;
    }
    return wordEl;
  }));
}

async function loadVideos() {
  try {
    const res = await fetch('/api/videos');
    if (!res.ok) throw new Error(res.statusText);
    state.videos = await res.json();
  } catch {
    showToast('영상 목록을 불러오지 못했어요');
  }
  renderAll();
}

let toastTimer;
function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
}

renderDecorations();
showView();
loadSession();
loadVideos();
