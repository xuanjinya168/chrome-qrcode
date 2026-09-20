document.addEventListener('DOMContentLoaded', () => {
  const inputText = document.getElementById('inputText');
  const generateBtn = document.getElementById('generateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const qrcodeContainer = document.getElementById('qrcode-container');
  const copyStatus = document.getElementById('copyStatus');
  const spaceWarning = document.getElementById('spaceWarning');
  let lastRenderText = '';
  let statusTimer = 0;

  function toText(value) {
    return String(value == null ? '' : value);
  }

  function hasSpace(value) {
    return /[ \t\u00a0\u3000]/.test(value);
  }

  function debounce(callback, wait) {
    let timer = 0;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => callback.apply(this, args), wait);
    };
  }

  function setStatus(text, color) {
    clearTimeout(statusTimer);
    copyStatus.textContent = text;
    copyStatus.style.color = color || '#28a745';

    if (text) {
      statusTimer = setTimeout(() => {
        copyStatus.textContent = '';
      }, 2000);
    }
  }

  function createPlaceholder(message) {
    const wrapper = document.createElement('div');
    wrapper.className = 'qr-placeholder';

    const pattern = document.createElement('div');
    pattern.className = 'qr-placeholder__pattern';

    const label = document.createElement('div');
    label.className = 'qr-placeholder__text';
    label.textContent = message;

    wrapper.append(pattern, label);
    return wrapper;
  }

  function showPlaceholder(message) {
    qrcodeContainer.replaceChildren(createPlaceholder(message));
  }

  function updateSpaceWarning(text) {
    spaceWarning.textContent = hasSpace(text) ? '检测到空格，二维码会保留空格' : '';
  }

  function renderQRCode(force) {
    const text = toText(inputText.value);
    updateSpaceWarning(text);

    if (text.length === 0) {
      lastRenderText = '';
      showPlaceholder('输入内容后生成二维码');
      return false;
    }

    if (!force && text === lastRenderText && qrcodeContainer.firstChild) return true;
    lastRenderText = text;

    try {
      QRCodeGenerator.render(qrcodeContainer, text, {
        size: 256,
        errorCorrectionLevel: 'H'
      });
      return true;
    } catch (error) {
      console.error('二维码生成失败:', error);
      showPlaceholder('二维码生成失败，文本可能过长');
      return false;
    }
  }

  async function copyCurrentText() {
    const text = toText(inputText.value);
    updateSpaceWarning(text);

    if (text.length === 0) {
      setStatus('请输入文本内容', '#dc3545');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus('复制成功');
    } catch (error) {
      console.error('复制失败:', error);
      setStatus('复制失败，请手动复制', '#dc3545');
    }
  }

  const debouncedRender = debounce(() => renderQRCode(false), 120);
  inputText.addEventListener('input', () => {
    updateSpaceWarning(toText(inputText.value));
    debouncedRender();
  });
  generateBtn.addEventListener('click', () => {
    const text = toText(inputText.value);
    updateSpaceWarning(text);

    if (text.length === 0) {
      lastRenderText = '';
      showPlaceholder('输入内容后生成二维码');
      setStatus('请输入文本内容', '#dc3545');
      return;
    }

    renderQRCode(true);
  });
  copyBtn.addEventListener('click', copyCurrentText);
  showPlaceholder('输入内容后生成二维码');
  updateSpaceWarning('');
});
