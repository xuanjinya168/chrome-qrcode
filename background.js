const CONTENT_FILES = ["qrcode-generator.js", "qr-renderer.js", "content.js"];
const MENU_ITEMS = [
  { id: "generateQRCode", title: "生成二维码", copyText: false },
  { id: "copyAndGenerateQRCode", title: "复制并生成二维码", copyText: true },
];

function toText(value) {
  return String(value == null ? "" : value);
}

function logError(message, error) {
  console.error(message, error && error.message ? error.message : error);
}

function queryActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab] = []) => {
      resolve(tab && tab.id ? tab : null);
    });
  });
}

function executeScript(options) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(options, (results) => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(results || []);
    });
  });
}

function sendMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(response);
    });
  });
}

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    MENU_ITEMS.forEach(({ id, title }) => {
      chrome.contextMenus.create({ id, title, contexts: ["selection"] });
    });
  });
}

async function getSelectedText(tabId) {
  const [frame] = await executeScript({
    target: { tabId },
    func: () => {
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
    },
  });

  return toText(frame && frame.result);
}

async function ensureContentScript(tabId) {
  const [frame] = await executeScript({
    target: { tabId },
    func: () => Boolean(window.ChromeQRCodeExtension),
  });

  if (frame && frame.result) return;

  await executeScript({
    target: { tabId },
    files: CONTENT_FILES,
  });
}

async function showQRCode(tabId, text, copyText) {
  const value = toText(text);
  if (value.length === 0) return;

  await ensureContentScript(tabId);

  const response = await sendMessage(tabId, {
    action: "showQRCode",
    text: value,
    copyText: Boolean(copyText),
  });

  if (!response || !response.ok) {
    throw new Error("Content script did not confirm rendering.");
  }
}

async function handleSelectionCommand() {
  const tab = await queryActiveTab();
  if (!tab) return;

  const text = await getSelectedText(tab.id);
  if (text.length === 0) return;

  await showQRCode(tab.id, text, false);
}

chrome.runtime.onInstalled.addListener(createContextMenus);
chrome.runtime.onStartup.addListener(createContextMenus);

chrome.commands.onCommand.addListener((command) => {
  if (command !== "generate-from-selection") return;
  handleSelectionCommand().catch((error) =>
    logError("快捷键生成二维码失败:", error),
  );
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const menuItem = MENU_ITEMS.find((item) => item.id === info.menuItemId);
  if (!menuItem || !tab || !tab.id) return;

  showQRCode(tab.id, info.selectionText, menuItem.copyText).catch((error) => {
    logError("右键生成二维码失败:", error);
  });
});
