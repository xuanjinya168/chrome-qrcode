(function () {
  "use strict";

  if (window.ChromeQRCodeExtension) return;

  const OVERLAY_ID = "qrcode-overlay";
  const RENDER_DELAY = 120;
  const UI_FONT =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  let ui = null;
  let lastRenderKey = "";
  let copyRequestId = 0;
  const fixedQRCodes = [];
  const FIXED_STORAGE_PREFIX = "fixedQRCodes_";
  let selfSaving = false;

  function getFixedStorageKey() {
    return FIXED_STORAGE_PREFIX + location.origin;
  }

  function saveFixedToStorage() {
    if (!isContextValid()) return;
    selfSaving = true;
    const data = fixedQRCodes.map((el) => ({
      text: el.dataset.fixedText || "",
      left: parseInt(el.style.left) || 0,
      top: parseInt(el.style.top) || 0,
    }));
    chrome.storage.local.set({ [getFixedStorageKey()]: data }, () => {
      setTimeout(() => {
        selfSaving = false;
      }, 200);
    });
  }

  function isContextValid() {
    try {
      return !!chrome.runtime?.id;
    } catch (e) {
      return false;
    }
  }

  function loadFixedFromStorage() {
    return new Promise((resolve) => {
      if (!isContextValid()) return resolve([]);
      chrome.storage.local.get([getFixedStorageKey()], (result) => {
        if (chrome.runtime.lastError) return resolve([]);
        resolve(result[getFixedStorageKey()] || []);
      });
    });
  }

  async function restoreFixedQRCodes() {
    const data = await loadFixedFromStorage();
    if (data.length === 0) return;
    data.forEach((item) => {
      createFixedContainer(item.text, item.left, item.top, true);
    });
  }

  if (isContextValid()) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[getFixedStorageKey()] || selfSaving)
        return;
      fixedQRCodes.forEach((el) => el.remove());
      fixedQRCodes.length = 0;
      restoreFixedQRCodes();
    });
  }

  restoreFixedQRCodes().catch(() => {});

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      fixedQRCodes.forEach((el) => el.remove());
      fixedQRCodes.length = 0;
      restoreFixedQRCodes().catch(() => {});
    }
  });

  function toText(value) {
    return String(value == null ? "" : value);
  }

  function hasSpace(value) {
    return /[ \t\u00a0\u3000]/.test(value);
  }

  function setStyles(element, styles) {
    Object.assign(element.style, styles);
  }

  function debounce(callback, wait) {
    let timer = 0;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => callback.apply(this, args), wait);
    };
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    document.documentElement.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      return document.execCommand("copy");
    } finally {
      textarea.remove();
    }
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard
        .writeText(text)
        .catch(() => fallbackCopyText(text));
    }

    return Promise.resolve(fallbackCopyText(text));
  }

  function getSelectedText() {
    const selection = window.getSelection && window.getSelection().toString();
    if (selection) return selection;

    const active = document.activeElement;
    const hasTextSelection =
      active &&
      typeof active.value === "string" &&
      typeof active.selectionStart === "number" &&
      active.selectionStart !== active.selectionEnd;

    return hasTextSelection
      ? active.value.slice(active.selectionStart, active.selectionEnd)
      : "";
  }

  function closeOverlay() {
    if (ui && ui.overlay.isConnected) ui.overlay.remove();
  }

  function setStatus(text, color) {
    ui.statusDisplay.textContent = text;
    ui.statusDisplay.style.color = color || "#2f6f3e";
  }

  function updateSpaceWarning(text) {
    ui.spaceWarning.textContent = hasSpace(text)
      ? "检测到空格，二维码会保留空格"
      : "";
  }

  function getQRSize() {
    return Math.max(180, Math.min(280, window.innerWidth - 104));
  }

  function setQRBoxSize(size) {
    const pixels = size + "px";
    ui.qrcodeDiv.style.width = pixels;
    ui.qrcodeDiv.style.height = pixels;
  }

  function createPlaceholder(message) {
    const wrapper = document.createElement("div");
    setStyles(wrapper, {
      alignItems: "center",
      boxSizing: "border-box",
      color: "#777777",
      display: "flex",
      flexDirection: "column",
      fontSize: "13px",
      gap: "10px",
      height: "100%",
      justifyContent: "center",
      lineHeight: "18px",
      width: "100%",
    });

    const pattern = document.createElement("div");
    setStyles(pattern, {
      backgroundColor: "#ffffff",
      backgroundImage:
        "linear-gradient(90deg, #d8d8d8 25%, transparent 25%, transparent 50%, #d8d8d8 50%, #d8d8d8 75%, transparent 75%), linear-gradient(#d8d8d8 25%, transparent 25%, transparent 50%, #d8d8d8 50%, #d8d8d8 75%, transparent 75%)",
      backgroundSize: "22px 22px",
      border: "10px solid #eeeeee",
      borderRadius: "4px",
      boxSizing: "border-box",
      height: "112px",
      opacity: "0.8",
      width: "112px",
    });

    const label = document.createElement("div");
    label.textContent = message;

    wrapper.append(pattern, label);
    return wrapper;
  }

  function showPlaceholder(message) {
    ui.qrcodeDiv.replaceChildren(createPlaceholder(message));
  }

  function renderQR() {
    const text = toText(ui.textInput.value);
    const size = getQRSize();
    const renderKey = size + "\n" + text;
    setQRBoxSize(size);
    updateSpaceWarning(text);

    if (text.length === 0) {
      lastRenderKey = "";
      showPlaceholder("输入内容后生成二维码");
      return;
    }

    if (renderKey === lastRenderKey && ui.qrcodeDiv.firstChild) return;
    lastRenderKey = renderKey;

    try {
      QRCodeGenerator.render(ui.qrcodeDiv, text, {
        size,
        errorCorrectionLevel: "H",
      });
    } catch (error) {
      console.error("二维码生成失败:", error);
      showPlaceholder("二维码生成失败，文本可能过长");
    }
  }

  function createUI() {
    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.tabIndex = -1;
    setStyles(overlay, {
      position: "fixed",
      inset: "0",
      background: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "2147483647",
    });

    const container = document.createElement("div");
    setStyles(container, {
      background: "#ffffff",
      padding: "0 16px",
      borderRadius: "12px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      boxSizing: "border-box",
      cursor: "default",
      fontFamily: UI_FONT,
      maxWidth: "min(340px, calc(100vw - 48px))",
      position: "relative",
      textAlign: "center",
    });

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "x";
    closeBtn.setAttribute("aria-label", "关闭");
    setStyles(closeBtn, {
      alignItems: "center",
      background: "#333333",
      border: "0",
      borderRadius: "50%",
      color: "#ffffff",
      cursor: "pointer",
      display: "flex",
      fontSize: "18px",
      height: "30px",
      justifyContent: "center",
      position: "absolute",
      right: "-10px",
      top: "-10px",
      width: "30px",
    });

    const qrcodeDiv = document.createElement("div");
    qrcodeDiv.id = "qrcode-content";
    setStyles(qrcodeDiv, {
      alignItems: "center",
      display: "flex",
      justifyContent: "center",
      marginBottom: "12px",
      minHeight: "180px",
    });

    const textInput = document.createElement("textarea");
    textInput.placeholder = "输入文本内容...";
    setStyles(textInput, {
      border: "2px solid #e0e0e0",
      borderRadius: "6px",
      boxSizing: "border-box",
      fontFamily: UI_FONT,
      fontSize: "13px",
      height: "50px",
      lineHeight: "18px",
      marginBottom: "8px",
      padding: "8px",
      resize: "none",
      width: "100%",
    });

    const spaceWarning = document.createElement("div");
    setStyles(spaceWarning, {
      color: "#b42318",
      fontSize: "12px",
      lineHeight: "16px",
      margin: "0 0 4px 0",
      minHeight: "16px",
      textAlign: "left",
    });

    const statusDisplay = document.createElement("p");
    setStyles(statusDisplay, {
      color: "#2f6f3e",
      fontSize: "12px",
      lineHeight: "16px",
      margin: "0 0 8px 0",
      minHeight: "16px",
    });

    closeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      closeOverlay();
    });
    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeOverlay();
    });
    const debouncedRender = debounce(renderQR, RENDER_DELAY);
    textInput.addEventListener("input", () => {
      updateSpaceWarning(toText(textInput.value));
      debouncedRender();
    });

    const btnRow = document.createElement("div");
    setStyles(btnRow, {
      display: "flex",
      gap: "8px",
      marginBottom: "12px",
    });

    const fixedBtn = document.createElement("button");
    fixedBtn.type = "button";
    fixedBtn.textContent = "📌 固定";
    setStyles(fixedBtn, {
      background: "#1a73e8",
      border: "0",
      borderRadius: "6px",
      color: "#ffffff",
      cursor: "pointer",
      flex: "1",
      fontSize: "13px",
      lineHeight: "32px",
      padding: "0 12px",
    });
    fixedBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      pinCurrentQRCode();
    });

    const closeAfterPinKey = "qrcode-close-after-pin";
    const closeAfterPin = document.createElement("label");
    setStyles(closeAfterPin, {
      alignItems: "center",
      cursor: "pointer",
      display: "flex",
      fontSize: "12px",
      gap: "4px",
      whiteSpace: "nowrap",
    });
    const closeCheckbox = document.createElement("input");
    closeCheckbox.type = "checkbox";
    closeCheckbox.checked = localStorage.getItem(closeAfterPinKey) !== "false";
    closeCheckbox.addEventListener("change", () => {
      localStorage.setItem(closeAfterPinKey, String(closeCheckbox.checked));
    });
    const closeLabel = document.createElement("span");
    closeLabel.textContent = "固定后关闭";
    closeAfterPin.append(closeCheckbox, closeLabel);

    btnRow.append(fixedBtn, closeAfterPin);

    container.append(
      closeBtn,
      qrcodeDiv,
      spaceWarning,
      textInput,
      btnRow,
      statusDisplay,
    );
    overlay.appendChild(container);

    ui = {
      overlay,
      qrcodeDiv,
      spaceWarning,
      statusDisplay,
      textInput,
      closeCheckbox,
    };
    return ui;
  }

  function createFixedContainer(text, posX, posY, skipSave) {
    const container = document.createElement("div");
    const fixedSize = 220;
    const hasPosition = typeof posX === "number" && typeof posY === "number";
    const offsetX = hasPosition ? 0 : (fixedQRCodes.length % 5) * 30;
    const offsetY = hasPosition ? 0 : Math.floor(fixedQRCodes.length / 5) * 30;

    container.dataset.fixedText = text;

    setStyles(container, {
      background: "#ffffff",
      borderRadius: "10px",
      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
      boxSizing: "border-box",
      cursor: "move",
      fontFamily: UI_FONT,
      padding: "12px",
      position: "fixed",
      left: hasPosition ? posX + "px" : "auto",
      right: hasPosition ? "auto" : 20 + offsetX + "px",
      top: hasPosition ? posY + "px" : 20 + offsetY + "px",
      width: fixedSize + 24 + "px",
      zIndex: "2147483646",
      userSelect: "none",
    });

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "关闭");
    setStyles(closeBtn, {
      alignItems: "center",
      background: "#333333",
      border: "0",
      borderRadius: "50%",
      color: "#ffffff",
      cursor: "pointer",
      display: "flex",
      fontSize: "14px",
      height: "22px",
      justifyContent: "center",
      position: "absolute",
      right: "-8px",
      top: "-8px",
      width: "22px",
    });
    closeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      container.remove();
      const index = fixedQRCodes.indexOf(container);
      if (index >= 0) fixedQRCodes.splice(index, 1);
      saveFixedToStorage();
    });

    const qrDiv = document.createElement("div");
    setStyles(qrDiv, {
      alignItems: "center",
      display: "flex",
      justifyContent: "center",
      marginBottom: "6px",
      minHeight: fixedSize + "px",
    });

    const label = document.createElement("div");
    const displayText = text.length > 40 ? text.slice(0, 40) + "..." : text;
    label.textContent = displayText;
    label.title = text;
    setStyles(label, {
      color: "#555555",
      fontSize: "11px",
      lineHeight: "14px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      textAlign: "center",
    });

    container.append(closeBtn, qrDiv, label);
    document.documentElement.appendChild(container);
    fixedQRCodes.push(container);
    if (!skipSave) saveFixedToStorage();

    // 渲染二维码
    try {
      QRCodeGenerator.render(qrDiv, text, {
        size: fixedSize,
        errorCorrectionLevel: "H",
      });
    } catch (error) {
      console.error("固定二维码生成失败:", error);
      qrDiv.textContent = "生成失败";
    }

    // 拖拽
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let origX = 0;
    let origY = 0;

    container.addEventListener("mousedown", (event) => {
      if (event.target === closeBtn) return;
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      const rect = container.getBoundingClientRect();
      origX = rect.left;
      origY = rect.top;
      container.style.right = "auto";
      container.style.left = origX + "px";
      container.style.top = origY + "px";
      event.preventDefault();
    });

    document.addEventListener("mousemove", (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      container.style.left = origX + dx + "px";
      container.style.top = origY + dy + "px";
    });

    document.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      saveFixedToStorage();
    });

    return container;
  }

  function pinCurrentQRCode() {
    if (!ui) return;
    const text = toText(ui.textInput.value);
    if (text.length === 0) return;
    createFixedContainer(text);
    if (ui && ui.closeCheckbox && ui.closeCheckbox.checked) closeOverlay();
  }

  function showQRCode(text, options) {
    const current = ui || createUI();
    const value = toText(text);
    const requestId = ++copyRequestId;

    current.textInput.value = value;
    setStatus(options && options.copyText ? "正在复制..." : "");

    if (!current.overlay.isConnected) {
      document.documentElement.appendChild(current.overlay);
    }

    renderQR();
    current.textInput.focus();

    if (options && options.copyText) {
      copyText(value)
        .then((copied) => {
          if (requestId !== copyRequestId) return;
          const failed = copied === false;
          setStatus(
            failed ? "复制失败" : "已复制到剪贴板",
            failed ? "#b42318" : "#2f6f3e",
          );
        })
        .catch(() => {
          if (requestId === copyRequestId) setStatus("复制失败", "#b42318");
        });
    }
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request) return false;

    if (request.action === "showQRCode") {
      showQRCode(request.text, { copyText: Boolean(request.copyText) });
      sendResponse({ ok: true });
      return true;
    }

    if (request.action === "restoreFixedQRCodes") {
      fixedQRCodes.forEach((el) => el.remove());
      fixedQRCodes.length = 0;
      restoreFixedQRCodes();
      sendResponse({ ok: true });
      return true;
    }

    if (request.action === "getSelection") {
      sendResponse({ text: getSelectedText() });
      return true;
    }

    return false;
  });

  window.ChromeQRCodeExtension = {
    copyText,
    getSelectedText,
    showQRCode,
  };
})();
