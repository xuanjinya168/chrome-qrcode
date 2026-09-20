(function () {
  "use strict";

  if (window.QRCodeGenerator) return;

  const ERROR_LEVELS = ["H", "Q", "M", "L"];
  let libraryReady = false;

  function toQRText(value) {
    return String(value == null ? "" : value);
  }

  function prepareLibrary() {
    if (libraryReady) return;

    if (typeof qrcode !== "function") {
      throw new Error("QR encoder library is not loaded.");
    }

    const utf8 =
      qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs["UTF-8"];
    if (utf8) qrcode.stringToBytes = utf8;
    libraryReady = true;
  }

  function getPositiveInteger(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0
      ? Math.floor(number)
      : fallback;
  }

  function createModel(text, preferredLevel) {
    const startIndex = Math.max(0, ERROR_LEVELS.indexOf(preferredLevel));
    let lastError = null;

    for (let index = startIndex; index < ERROR_LEVELS.length; index += 1) {
      const errorCorrectionLevel = ERROR_LEVELS[index];

      try {
        const model = qrcode(0, errorCorrectionLevel);
        model.addData(text, "Byte");
        model.make();
        return { model, errorCorrectionLevel };
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error("Input is too large for a QR code. " + (lastError || ""));
  }

  function drawToSVG(model, options) {
    const moduleCount = model.getModuleCount();
    const requestedSize = getPositiveInteger(options.size, 256);
    const quietZoneModules = getPositiveInteger(options.quietZoneModules, 4);
    const totalModules = moduleCount + quietZoneModules * 2;
    const cellSize = Math.max(1, Math.floor(requestedSize / totalModules));
    const svgSize = totalModules * cellSize;
    const lightColor = options.lightColor || "#ffffff";
    const darkColor = options.darkColor || "#000000";

    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("xmlns", ns);
    svg.setAttribute("viewBox", "0 0 " + svgSize + " " + svgSize);
    svg.setAttribute("width", svgSize);
    svg.setAttribute("height", svgSize);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Generated QR code");
    svg.style.cssText =
      "display:block;width:" + svgSize + "px;height:" + svgSize + "px";

    // 背景
    const bg = document.createElementNS(ns, "rect");
    bg.setAttribute("x", "0");
    bg.setAttribute("y", "0");
    bg.setAttribute("width", svgSize);
    bg.setAttribute("height", svgSize);
    bg.setAttribute("fill", lightColor);
    svg.appendChild(bg);

    // 深色模块（合并同行连续模块为单个 rect）
    for (let row = 0; row < moduleCount; row += 1) {
      let runStart = -1;
      const y = (row + quietZoneModules) * cellSize;

      for (let col = 0; col <= moduleCount; col += 1) {
        const isDark = col < moduleCount && model.isDark(row, col);

        if (isDark && runStart < 0) {
          runStart = col;
        } else if (!isDark && runStart >= 0) {
          const rect = document.createElementNS(ns, "rect");
          rect.setAttribute("x", (runStart + quietZoneModules) * cellSize);
          rect.setAttribute("y", y);
          rect.setAttribute("width", (col - runStart) * cellSize);
          rect.setAttribute("height", cellSize);
          rect.setAttribute("fill", darkColor);
          svg.appendChild(rect);
          runStart = -1;
        }
      }
    }

    return svg;
  }

  function renderQRCode(container, value, options) {
    const text = toQRText(value);
    if (text.length === 0) throw new Error("QR code text is empty.");

    prepareLibrary();

    const result = createModel(
      text,
      (options && options.errorCorrectionLevel) || "H",
    );
    const svg = drawToSVG(result.model, options || {});
    container.replaceChildren(svg);

    return {
      canvas: svg,
      moduleCount: result.model.getModuleCount(),
      errorCorrectionLevel: result.errorCorrectionLevel,
    };
  }

  window.QRCodeGenerator = {
    render: renderQRCode,
  };
})();
