# QR Code Generator

[中文](#中文) · [English](#english)

Chrome 扩展，把文本生成二维码。可在弹窗里输入，也可把网页中选中的文字显示在页面中央。

A Chrome extension that turns text into a QR code. Type in the popup, or show selected text from the current page in the center of the screen.

---

## 中文

### 功能

- **弹窗输入**：在工具栏弹窗中输入文本并生成二维码，支持一键复制文本。文本含空格时会提示用户注意，空格会保留在二维码内容中。
- **右键菜单**：选中网页文字后，使用右键菜单「生成二维码」或「复制并生成二维码」快速生成。
- **快捷键**：
  - `Ctrl+Shift+Q`（macOS 为 `Command+Shift+Q`）打开弹窗
  - `Ctrl+Shift+E`（macOS 为 `Command+Shift+E`）把选中文本生成二维码
- **页面浮层**：在页面中央显示浮层，可编辑文本并实时刷新二维码。
- **固定功能**：将二维码固定在页面上，可自由拖拽定位。位置和内容按站点来源保存，刷新页面后自动恢复。「固定后关闭」选项会记住用户的偏好设置。
- **智能纠错**：二维码以 SVG 绘制，优先使用 H 级纠错；内容过长时会依次降到 Q、M、L 级别以确保生成成功。

### 安装

1. 打开 `chrome://extensions`。
2. 开启右上角的**开发者模式**。
3. 点击**加载已解压的扩展程序**。
4. 选择本仓库目录（目录内需包含 `manifest.json`）。

> 更新代码后，在扩展卡片上点击刷新按钮即可加载最新版本。

### 项目结构

| 文件 | 说明 |
|------|------|
| `manifest.json` | Manifest V3 扩展配置 |
| `popup.html` / `popup.css` / `popup.js` | 工具栏弹窗界面与逻辑 |
| `background.js` | 右键菜单、快捷键处理、向页面发送生成请求 |
| `content.js` | 页面浮层实现、固定二维码与本地存储 |
| `qrcode-generator.js` | QR 码编码库 |
| `qr-renderer.js` | 将编码结果渲染为 SVG |
| `icons/` | 扩展程序图标资源 |

### 许可

本项目采用 [MIT License](LICENSE)。

`qrcode-generator.js` 是 Kazuhiko Arase 的二维码编码库，版权归原作者所有，同样以 MIT 许可发布。

---

## English

### Features

- **Popup Input**: Type text in the toolbar popup to generate a QR code, with one-click text copy. If the text contains spaces, a notice explains that spaces are preserved in the code.
- **Context Menu**: Select text on a page, then use the context menu **生成二维码** (generate) or **复制并生成二维码** (copy, then generate).
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+Q` (`Command+Shift+Q` on macOS) opens the popup
  - `Ctrl+Shift+E` (`Command+Shift+E` on macOS) generates a QR code from the selection
- **Page Overlay**: Display a centered overlay on the page to edit text and refresh the code in real-time.
- **Pin Function**: Pin a QR code on the page and drag it to any position. Text and position are saved per site origin and automatically restored after refresh. **固定后关闭** remembers your preference for closing the overlay after pinning.
- **Smart Error Correction**: Codes are rendered as SVG. Error correction starts at level H and falls back to Q, M, then L when the text is too long to ensure successful generation.

### Install

1. Open `chrome://extensions`.
2. Turn on **Developer mode** in the top right.
3. Click **Load unpacked**.
4. Select this repository folder (it must contain `manifest.json`).

> After pulling updates, click the reload button on the extension card to load the latest version.

### Project Layout

| File | Description |
|------|-------------|
| `manifest.json` | Manifest V3 extension configuration |
| `popup.html` / `popup.css` / `popup.js` | Toolbar popup UI and logic |
| `background.js` | Context menu, keyboard shortcuts, and message handling to the page |
| `content.js` | Page overlay implementation, pinned codes, and local storage |
| `qrcode-generator.js` | QR code encoding library |
| `qr-renderer.js` | Renders encoded data as SVG |
| `icons/` | Extension icon assets |

### License

This project is released under the [MIT License](LICENSE).

`qrcode-generator.js` is Kazuhiko Arase's QR encoder. Its copyright remains with the original author, and it is also released under the MIT License.
