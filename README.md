# QR Code Generator

[中文](#中文) · [English](#english)

Chrome 扩展，把文本生成二维码。可在弹窗里输入，也可把网页中选中的文字显示在页面中央。

A Chrome extension that turns text into a QR code. Type in the popup, or show selected text from the current page in the center of the screen.

## 中文

### 功能

- 弹窗输入文本并生成二维码，可复制文本。文本含空格时会提示，空格会保留在二维码里。
- 选中网页文字后，用右键菜单「生成二维码」或「复制并生成二维码」。
- 快捷键：`Ctrl+Shift+Q`（macOS 为 `Command+Shift+Q`）打开弹窗；`Ctrl+Shift+E`（macOS 为 `Command+Shift+E`）把选中文本生成二维码。
- 页面中央浮层可编辑文本并实时刷新二维码。
- 「固定」后把二维码钉在页面上，可拖拽。位置和内容按站点来源保存，刷新后恢复。「固定后关闭」会记住你的选择。

二维码以 SVG 绘制，优先使用 H 级纠错；内容过长时会依次降到 Q、M、L。

### 安装

1. 打开 `chrome://extensions`。
2. 打开右上角的**开发者模式**。
3. 点击**加载已解压的扩展程序**。
4. 选择本仓库目录（目录内需包含 `manifest.json`）。

更新代码后，在扩展卡片上点刷新即可。

### 目录

| 文件 | 作用 |
| --- | --- |
| `manifest.json` | Manifest V3 配置 |
| `popup.html` / `popup.css` / `popup.js` | 工具栏弹窗 |
| `background.js` | 右键菜单、快捷键、向页面发送生成请求 |
| `content.js` | 页面浮层、固定二维码与本地保存 |
| `qrcode-generator.js` | QR 编码库 |
| `qr-renderer.js` | 把编码结果画成 SVG |
| `icons/` | 扩展图标 |

## English

### Features

- Type text in the popup to generate a QR code, and copy that text. If the text contains spaces, a notice explains that spaces are kept in the code.
- Select text on a page, then use the context menu **生成二维码** (generate) or **复制并生成二维码** (copy, then generate).
- Shortcuts: `Ctrl+Shift+Q` (`Command+Shift+Q` on macOS) opens the popup. `Ctrl+Shift+E` (`Command+Shift+E` on macOS) generates a QR code from the selection.
- The centered overlay lets you edit the text and refreshes the code as you type.
- **固定** pins a QR code on the page. Pinned codes can be dragged. Their text and position are saved per site origin and restored after refresh. **固定后关闭** remembers whether the overlay should close after pinning.

Codes are drawn as SVG. Error correction starts at level H and falls back to Q, M, then L when the text is too long.

### Install

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository folder (it must contain `manifest.json`).

After pulling updates, click the reload button on the extension card.

### Layout

| File | Role |
| --- | --- |
| `manifest.json` | Manifest V3 config |
| `popup.html` / `popup.css` / `popup.js` | Toolbar popup |
| `background.js` | Context menus, shortcuts, and messages to the page |
| `content.js` | On-page overlay, pinned codes, and local storage |
| `qrcode-generator.js` | QR encoder |
| `qr-renderer.js` | Renders the code as SVG |
| `icons/` | Extension icons |
