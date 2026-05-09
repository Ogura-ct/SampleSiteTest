/**
 * プレイ卓 UI — ログイン・ヒントカード（所有者ごとの秘匿 + 他者公開）
 * ヒント状態は同一オリジンの localStorage に保存（将来 WS 差し替え想定）。
 */

const STORAGE_SESSION = "mm-play-session";
const STORAGE_HINTS = "mm-play-hint-state";
const STORAGE_SPECTATOR_LOCAL_OPEN = "mm-play-spectator-local-open";

const ROLE_OPTIONS = {
  PL1: { label: "PL1 神代 玲司", password: "table-kamishiro-01" },
  PL2: { label: "PL2 三枝 悠真", password: "table-saegusa-02" },
  PL3: { label: "PL3 深見 朱莉", password: "table-fukami-03" },
  PL4: { label: "PL4 戸倉 蓮", password: "table-tokura-04" },
  spectator: { label: "観戦者", password: null },
};

const HINT_COUNT = 12;
const CARD_OWNERS = [
  "PL1",
  "PL1",
  "PL1",
  "PL1",
  "PL2",
  "PL2",
  "PL2",
  "PL3",
  "PL3",
  "PL3",
  "PL4",
  "PL4",
];

/** GM が差し替える想定の本文（拡大表示・表面にそのまま出す） */
const HINT_BODIES = [
  "【ヒント1】GM差し替え用。検索ワードや画像URLをここに置く。",
  "【ヒント2】GM差し替え用。",
  "【ヒント3】GM差し替え用。",
  "【ヒント4】GM差し替え用。",
  "【ヒント5】GM差し替え用。",
  "【ヒント6】GM差し替え用。",
  "【ヒント7】GM差し替え用。",
  "【ヒント8】GM差し替え用。",
  "【ヒント9】GM差し替え用。",
  "【ヒント10】GM差し替え用。",
  "【ヒント11】GM差し替え用。",
  "【ヒント12】GM差し替え用。",
];

const mapSurface = document.getElementById("play-map-surface");
const mapTokens = document.getElementById("play-map-tokens");
const handles = document.querySelectorAll(".play-pl__handle");
const contextMenu = document.getElementById("play-context-menu");
const hintZoom = document.getElementById("play-hint-zoom");
const hintZoomBody = document.getElementById("play-hint-zoom-body");

const hintsLocked = document.getElementById("play-hints-locked");
const hintsGrid = document.getElementById("play-hints-grid");
const btnLogin = document.getElementById("play-btn-login");
const btnLogout = document.getElementById("play-btn-logout");
const sessionBadge = document.getElementById("play-session-badge");

const loginModal = document.getElementById("play-login-modal");
const loginRole = document.getElementById("play-login-role");
const loginPassword = document.getElementById("play-login-password");
const loginError = document.getElementById("play-login-error");
const loginSubmit = document.getElementById("play-login-submit");

const confirmModal = document.getElementById("play-login-confirm");
const confirmMsg = document.getElementById("play-login-confirm-msg");
const confirmYes = document.getElementById("play-login-confirm-yes");
const confirmNo = document.getElementById("play-login-confirm-no");
const shareModal = document.getElementById("play-share-modal");
const shareRoleList = document.getElementById("play-share-role-list");
const shareApply = document.getElementById("play-share-apply");

const chatInput = document.getElementById("play-chat-input");
const chatSend = document.getElementById("play-btn-send");
const chatLog = document.getElementById("play-chat-log");
const diceBtn = document.getElementById("play-btn-dice");
const diceResult = document.getElementById("play-dice-result");

/** @type {{ role: string, label: string } | null} */
let currentSession = null;
/** @type {{ role: string, label: string } | null} */
let pendingLogin = null;

/** @type {number | null} */
let contextTargetIndex = null;
let shareTargetIndex = null;
let tokenSeq = 0;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_SESSION);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (o && typeof o.role === "string" && ROLE_OPTIONS[o.role] && typeof o.label === "string") {
      return { role: o.role, label: o.label };
    }
  } catch (_) {
    /* ignore */
  }
  return null;
}

function writeSession(sess) {
  if (!sess) {
    sessionStorage.removeItem(STORAGE_SESSION);
    return;
  }
  sessionStorage.setItem(STORAGE_SESSION, JSON.stringify(sess));
}

function loadHintState() {
  const defaultState = CARD_OWNERS.map((owner) => ({
    owner,
    sharedTo: [],
  }));

  try {
    const raw = localStorage.getItem(STORAGE_HINTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        Array.isArray(parsed) &&
        parsed.length === HINT_COUNT &&
        parsed.every(
          (x) =>
            x &&
            typeof x.owner === "string" &&
            ROLE_OPTIONS[x.owner] &&
            x.owner !== "spectator" &&
            Array.isArray(x.sharedTo) &&
            x.sharedTo.every((v) => typeof v === "string" && ROLE_OPTIONS[v]),
        )
      ) {
        const migrated = parsed.map((x, i) => {
          const owner = CARD_OWNERS[i];
          return {
            owner,
            sharedTo: x.sharedTo.filter((v) => v !== owner && v !== "spectator"),
          };
        });
        saveHintState(migrated);
        return migrated;
      }
    }
  } catch (_) {
    /* ignore */
  }
  return defaultState;
}

function saveHintState(state) {
  localStorage.setItem(STORAGE_HINTS, JSON.stringify(state));
}

/** @param {string} role */
function viewerBadgeText(role) {
  if (role === "spectator") return "観";
  const m = /^PL(\d)$/.exec(role);
  return m ? m[1] : "?";
}

function loadSpectatorLocalOpen() {
  try {
    const raw = sessionStorage.getItem(STORAGE_SPECTATOR_LOCAL_OPEN);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((n) => Number(n))
        .filter((n) => Number.isInteger(n) && n >= 0 && n < HINT_COUNT);
    }
  } catch (_) {
    /* ignore */
  }
  return [];
}

function saveSpectatorLocalOpen(indices) {
  sessionStorage.setItem(STORAGE_SPECTATOR_LOCAL_OPEN, JSON.stringify(indices));
}

function addSpectatorLocalOpen(index) {
  const cur = loadSpectatorLocalOpen();
  if (!cur.includes(index)) {
    cur.push(index);
    saveSpectatorLocalOpen(cur);
  }
}

function removeSpectatorLocalOpen(index) {
  const cur = loadSpectatorLocalOpen().filter((n) => n !== index);
  saveSpectatorLocalOpen(cur);
}

function isSpectatorLocalOpen(index) {
  return loadSpectatorLocalOpen().includes(index);
}

function isOwner(index, role) {
  const state = loadHintState();
  const h = state[index];
  return !!h && !!role && h.owner === role;
}

function hideContextMenu() {
  if (!contextMenu) return;
  contextMenu.hidden = true;
  contextMenu.setAttribute("aria-hidden", "true");
  contextTargetIndex = null;
}

function showContextMenu(x, y) {
  if (!contextMenu) return;
  contextMenu.hidden = false;
  contextMenu.setAttribute("aria-hidden", "false");
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
}

/**
 * @param {number} index
 * @param {string | null} role
 */
function canSeeHintFace(index, role) {
  const state = loadHintState();
  const h = state[index];
  if (!h) return false;
  if (!role) return false;
  if (role === "spectator") {
    return h.sharedTo.includes("spectator") || isSpectatorLocalOpen(index);
  }
  return h.owner === role || h.sharedTo.includes(role);
}

function updateHintCardElement(cardEl, index) {
  const state = loadHintState();
  const h = state[index];
  const role = currentSession ? currentSession.role : null;
  const faceFront = canSeeHintFace(index, role);

  cardEl.classList.toggle("play-hint-card--published", h.sharedTo.length > 0);
  cardEl.classList.toggle("play-hint-card--face-front", faceFront);

  const viewersEl = cardEl.querySelector(".play-hint-card__viewers");
  if (!viewersEl) return;
  viewersEl.innerHTML = "";
  for (const vr of h.sharedTo) {
    const span = document.createElement("span");
    span.className = "play-hint-viewer-icon";
    span.textContent = viewerBadgeText(vr);
    span.title = ROLE_OPTIONS[vr] ? ROLE_OPTIONS[vr].label : vr;
    viewersEl.appendChild(span);
  }
}

function configureContextMenuForRole() {
  if (!contextMenu || !currentSession) return;
  const publicBtn = contextMenu.querySelector("[data-action='public']");
  const shareBtn = contextMenu.querySelector("[data-action='share']");
  const privateBtn = contextMenu.querySelector("[data-action='private']");

  if (!publicBtn || !shareBtn || !privateBtn) return;

  if (currentSession.role === "spectator") {
    publicBtn.hidden = true;
    privateBtn.textContent = "確認を解除する";
    shareBtn.textContent = "内容を確認する";
  } else {
    publicBtn.hidden = false;
    privateBtn.textContent = "非公開にする";
    shareBtn.textContent = "他者に公開";
  }
}

function renderHintCards() {
  if (!hintsGrid) return;
  hintsGrid.innerHTML = "";
  const role = currentSession ? currentSession.role : null;
  const state = loadHintState();
  let visibleCount = 0;

  for (let i = 0; i < HINT_COUNT; i += 1) {
    if (role !== "spectator" && !canSeeHintFace(i, role)) continue;
    visibleCount += 1;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "play-hint-card";
    btn.dataset.hintIndex = String(i);

    const viewers = document.createElement("div");
    viewers.className = "play-hint-card__viewers";

    const body = document.createElement("div");
    body.className = "play-hint-card__body";

    const back = document.createElement("div");
    back.className = "play-hint-card__back";
    back.textContent = "裏";

    const front = document.createElement("div");
    front.className = "play-hint-card__front";
    front.textContent = HINT_BODIES[i] || "";

    body.appendChild(back);
    body.appendChild(front);
    btn.appendChild(viewers);
    btn.appendChild(body);

    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (!currentSession) return;
      if (currentSession.role !== "spectator" && !isOwner(i, currentSession.role)) return;
      configureContextMenuForRole();
      contextTargetIndex = i;
      showContextMenu(e.clientX, e.clientY);
    });

    hintsGrid.appendChild(btn);
    updateHintCardElement(btn, i);
  }

  if (visibleCount === 0) {
    const empty = document.createElement("div");
    empty.className = "play-hints-locked";
    empty.innerHTML =
      '<p class="play-hints-locked__title">表示できるヒントなし</p><p class="play-hints-locked__text">この身分で閲覧可能なヒントはまだありません。他者から公開されたカードがあるとここに表示されます。</p>';
    hintsGrid.appendChild(empty);
  }
}

function refreshAllHintCards() {
  if (!currentSession || !hintsGrid || hintsGrid.hidden) return;
  renderHintCards();
}

function applySessionUI() {
  currentSession = readSession();
  const loggedIn = !!currentSession;

  if (hintsLocked) {
    hintsLocked.hidden = loggedIn;
  }
  if (hintsGrid) {
    hintsGrid.hidden = !loggedIn;
  }

  if (btnLogin) btnLogin.hidden = loggedIn;
  if (btnLogout) btnLogout.hidden = !loggedIn;
  if (sessionBadge) {
    if (loggedIn && currentSession) {
      sessionBadge.hidden = false;
      sessionBadge.textContent = currentSession.label;
    } else {
      sessionBadge.hidden = true;
      sessionBadge.textContent = "";
    }
  }

  if (loggedIn) {
    renderHintCards();
  } else {
    hideContextMenu();
    if (hintsGrid) hintsGrid.innerHTML = "";
  }
}

function showLoginModal() {
  if (!loginModal) return;
  if (loginError) {
    loginError.hidden = true;
    loginError.textContent = "";
  }
  loginModal.hidden = false;
  loginModal.setAttribute("aria-hidden", "false");
  syncPasswordFieldState();
  if (loginPassword && loginRole && loginRole.value !== "spectator") {
    loginPassword.focus();
  } else if (loginRole) {
    loginRole.focus();
  }
}

function hideLoginModal() {
  if (!loginModal) return;
  loginModal.hidden = true;
  loginModal.setAttribute("aria-hidden", "true");
}

function showConfirmModal() {
  if (!confirmModal || !pendingLogin) return;
  if (confirmMsg) {
    const { role, label } = pendingLogin;
    if (role === "spectator") {
      confirmMsg.textContent = "観戦者として入卓します。よろしいですか？";
    } else {
      confirmMsg.textContent = `${label} として入卓します。よろしいですか？`;
    }
  }
  confirmModal.hidden = false;
  confirmModal.setAttribute("aria-hidden", "false");
}

function hideConfirmModal() {
  if (!confirmModal) return;
  confirmModal.hidden = true;
  confirmModal.setAttribute("aria-hidden", "true");
}

function showShareModal(index) {
  if (!shareModal || !shareRoleList || !currentSession) return;
  const state = loadHintState();
  const h = state[index];
  if (!h || h.owner !== currentSession.role) return;

  shareTargetIndex = index;
  shareRoleList.innerHTML = "";
  const roles = Object.keys(ROLE_OPTIONS).filter((r) => r !== h.owner && r !== "spectator");
  for (const role of roles) {
    const wrap = document.createElement("label");
    wrap.className = "play-share-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = role;
    checkbox.checked = h.sharedTo.includes(role);
    checkbox.className = "play-share-item__check";

    const text = document.createElement("span");
    text.className = "play-share-item__label";
    text.textContent = ROLE_OPTIONS[role].label;

    wrap.appendChild(checkbox);
    wrap.appendChild(text);
    shareRoleList.appendChild(wrap);
  }

  shareModal.hidden = false;
  shareModal.setAttribute("aria-hidden", "false");
}

function hideShareModal() {
  if (!shareModal) return;
  shareModal.hidden = true;
  shareModal.setAttribute("aria-hidden", "true");
  shareTargetIndex = null;
}

function applyShareTargets() {
  if (shareTargetIndex === null || !shareRoleList || !currentSession) return;
  const state = loadHintState();
  const h = state[shareTargetIndex];
  if (!h || h.owner !== currentSession.role) return;

  const checks = shareRoleList.querySelectorAll("input[type='checkbox']");
  const selected = [];
  checks.forEach((el) => {
    if (el.checked && el.value !== h.owner && ROLE_OPTIONS[el.value]) {
      selected.push(el.value);
    }
  });
  h.sharedTo = selected;
  saveHintState(state);
  hideShareModal();
  refreshAllHintCards();
}

function syncPasswordFieldState() {
  if (!loginRole || !loginPassword) return;
  const spec = loginRole.value === "spectator";
  loginPassword.disabled = spec;
  loginPassword.required = !spec;
  if (spec) loginPassword.value = "";
}

function tryLoginStep() {
  if (!loginRole || !loginPassword || !loginError) return;
  loginError.hidden = true;
  loginError.textContent = "";

  const role = loginRole.value;
  const opt = ROLE_OPTIONS[role];
  if (!opt) {
    loginError.textContent = "参加身分が不正です。";
    loginError.hidden = false;
    return;
  }

  if (role !== "spectator") {
    const pw = loginPassword.value.trim();
    if (pw !== opt.password) {
      loginError.textContent = "パスワードが一致しません。HO に記載の仮パスワードを確認してください。";
      loginError.hidden = false;
      return;
    }
  }

  pendingLogin = { role, label: opt.label };
  hideLoginModal();
  showConfirmModal();
}

function commitLogin() {
  if (!pendingLogin) return;
  writeSession(pendingLogin);
  pendingLogin = null;
  hideConfirmModal();
  applySessionUI();
}

function cancelPendingLogin() {
  pendingLogin = null;
  hideConfirmModal();
  showLoginModal();
}

function logout() {
  writeSession(null);
  pendingLogin = null;
  hideLoginModal();
  hideConfirmModal();
  applySessionUI();
}

/* --- マップ・トークン（既存） --- */

handles.forEach((el) => {
  el.addEventListener("dragstart", (e) => {
    const pl = el.getAttribute("data-pl");
    const label = el.getAttribute("data-label") || `PL${pl}`;
    e.dataTransfer.setData("application/x-play-pl", pl);
    e.dataTransfer.setData("text/plain", label);
    e.dataTransfer.effectAllowed = "copy";
  });
});

if (mapSurface) {
  mapSurface.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    mapSurface.classList.add("play-table__map-surface--dragover");
  });

  mapSurface.addEventListener("dragleave", (e) => {
    if (!mapSurface.contains(e.relatedTarget)) {
      mapSurface.classList.remove("play-table__map-surface--dragover");
    }
  });

  mapSurface.addEventListener("drop", (e) => {
    e.preventDefault();
    mapSurface.classList.remove("play-table__map-surface--dragover");
    const pl = e.dataTransfer.getData("application/x-play-pl");
    const label = e.dataTransfer.getData("text/plain") || (pl ? `PL${pl}` : "");
    if (!pl && !label) return;
    const rect = mapSurface.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    addMapToken(pl || "", label || `PL${pl}`, xPct, yPct);
  });
}

function addMapToken(pl, label, xPct, yPct) {
  if (!mapTokens) return;
  tokenSeq += 1;
  const id = `token-${tokenSeq}`;
  const div = document.createElement("div");
  div.className = "play-map-token";
  div.id = id;
  div.textContent = pl || label.replace(/^PL/i, "") || "?";
  div.style.left = `${Math.max(0, Math.min(100, xPct))}%`;
  div.style.top = `${Math.max(0, Math.min(100, yPct))}%`;
  div.style.transform = "translate(-50%, -50%)";
  div.title = label || `PL${pl}`;
  div.dataset.pl = pl;
  div.dataset.label = label || `PL${pl}`;
  enableTokenDrag(div, mapSurface);
  mapTokens.appendChild(div);
}

function enableTokenDrag(token, surface) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;

  token.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging = true;
    const leftPct = parseFloat(token.style.left) || 0;
    const topPct = parseFloat(token.style.top) || 0;
    origLeft = leftPct;
    origTop = topPct;
    startX = e.clientX;
    startY = e.clientY;

    const onMove = (ev) => {
      if (!dragging) return;
      const r = surface.getBoundingClientRect();
      const dx = ((ev.clientX - startX) / r.width) * 100;
      const dy = ((ev.clientY - startY) / r.height) * 100;
      token.style.left = `${Math.max(0, Math.min(100, origLeft + dx))}%`;
      token.style.top = `${Math.max(0, Math.min(100, origTop + dy))}%`;
    };

    const onUp = () => {
      dragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}

/* --- コンテキストメニュー（ヒント） --- */

if (contextMenu) {
  contextMenu.querySelectorAll(".play-context-menu__item").forEach((item) => {
    item.addEventListener("click", () => {
      const action = item.getAttribute("data-action");
      const idx = contextTargetIndex;
      hideContextMenu();
      if (idx === null || idx < 0 || !currentSession) return;

      if (currentSession.role === "spectator") {
        if (action === "share") {
          addSpectatorLocalOpen(idx);
          refreshAllHintCards();
        } else if (action === "private") {
          removeSpectatorLocalOpen(idx);
          refreshAllHintCards();
        } else if (action === "zoom") {
          if (!canSeeHintFace(idx, currentSession.role)) return;
          if (hintZoomBody) {
            hintZoomBody.textContent = HINT_BODIES[idx] || "";
          }
          if (hintZoom) {
            hintZoom.hidden = false;
            hintZoom.setAttribute("aria-hidden", "false");
          }
        }
        return;
      }

      const state = loadHintState();
      const h = state[idx];
      if (!h || h.owner !== currentSession.role) return;

      if (action === "public") {
        h.sharedTo = Object.keys(ROLE_OPTIONS).filter((r) => r !== h.owner && r !== "spectator");
      } else if (action === "share") {
        showShareModal(idx);
        return;
      } else if (action === "private") {
        h.sharedTo = [];
      } else if (action === "zoom") {
        if (!canSeeHintFace(idx, currentSession.role)) {
          return;
        }
        if (hintZoomBody) {
          hintZoomBody.textContent = HINT_BODIES[idx] || "";
        }
        if (hintZoom) {
          hintZoom.hidden = false;
          hintZoom.setAttribute("aria-hidden", "false");
        }
        return;
      }

      saveHintState(state);
      refreshAllHintCards();
    });
  });
}

document.addEventListener("click", (e) => {
  if (contextMenu && !contextMenu.hidden && !contextMenu.contains(e.target)) {
    hideContextMenu();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideContextMenu();
    if (hintZoom && !hintZoom.hidden) {
      hintZoom.hidden = true;
      hintZoom.setAttribute("aria-hidden", "true");
    }
    if (loginModal && !loginModal.hidden) {
      hideLoginModal();
    }
    if (confirmModal && !confirmModal.hidden) {
      cancelPendingLogin();
    }
    if (shareModal && !shareModal.hidden) {
      hideShareModal();
    }
  }
});

document.querySelectorAll("[data-close-zoom]").forEach((el) => {
  el.addEventListener("click", () => {
    if (hintZoom) {
      hintZoom.hidden = true;
      hintZoom.setAttribute("aria-hidden", "true");
    }
  });
});

/* --- ログイン UI --- */

if (loginRole) {
  loginRole.addEventListener("change", () => {
    syncPasswordFieldState();
    if (loginError) {
      loginError.hidden = true;
      loginError.textContent = "";
    }
  });
}

if (loginSubmit) {
  loginSubmit.addEventListener("click", tryLoginStep);
}

if (loginPassword) {
  loginPassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryLoginStep();
  });
}

document.querySelectorAll("[data-close-login]").forEach((el) => {
  el.addEventListener("click", () => {
    hideLoginModal();
    pendingLogin = null;
  });
});

document.querySelectorAll("[data-close-confirm]").forEach((el) => {
  el.addEventListener("click", cancelPendingLogin);
});
document.querySelectorAll("[data-close-share]").forEach((el) => {
  el.addEventListener("click", hideShareModal);
});

if (confirmYes) confirmYes.addEventListener("click", commitLogin);
if (confirmNo) confirmNo.addEventListener("click", cancelPendingLogin);

if (btnLogin) btnLogin.addEventListener("click", showLoginModal);
if (btnLogout) btnLogout.addEventListener("click", logout);
if (shareApply) shareApply.addEventListener("click", applyShareTargets);

/* --- チャット・ダイス --- */

function sendPlayChatMessage() {
  if (!chatInput || !chatLog) return;
  const text = chatInput.value.trim();
  if (!text) return;
  const p = document.createElement("p");
  p.className = "play-table__msg";
  p.innerHTML = `<b>あなた</b> ${escapeHtml(text)}`;
  chatLog.appendChild(p);
  chatInput.value = "";
  chatLog.scrollTop = chatLog.scrollHeight;
}

if (chatSend && chatInput && chatLog) {
  chatSend.addEventListener("click", sendPlayChatMessage);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      sendPlayChatMessage();
    }
  });
}

if (diceBtn && diceResult) {
  diceBtn.addEventListener("click", () => {
    const v = Math.floor(Math.random() * 100) + 1;
    diceResult.textContent = `→ ${v}`;
  });
}

/* 別タブでヒント状態が変わったときに再描画 */
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_HINTS && currentSession && hintsGrid && !hintsGrid.hidden) {
    refreshAllHintCards();
  }
});

applySessionUI();
