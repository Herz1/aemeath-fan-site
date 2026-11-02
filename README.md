# 爱弥斯 应援站 · エイメス応援サイト · Aemeath Unofficial Fan Site

非官方《鸣潮》爱弥斯粉丝站（中文 / 日本語 / English）。界面语言与语音语言（◉）可分别切换。

## 在线访问

**[进入爱弥斯应援站](https://herz1.github.io/aemeath-fan-site/)**

## GitHub Pages 发布

本站通过 GitHub Pages 托管，发布源为 [`gh-pages` 分支](https://github.com/Herz1/aemeath-fan-site/tree/gh-pages)的根目录（`/`）。可在[仓库 Pages 设置](https://github.com/Herz1/aemeath-fan-site/settings/pages)查看发布配置。

项目是纯静态站点，无需安装依赖或执行构建。保留根目录的 `.nojekyll` 文件，将 `index.html` 与完整的 `assets/` 目录一起发布。

日常修改在 `main` 分支提交并推送后，可执行以下命令同步到发布分支：

```bash
git push origin main:gh-pages
```

只有推送到 `gh-pages` 的更新才会触发站点发布；仅更新 `main` 不会同步上线。部署状态可在 [Actions](https://github.com/Herz1/aemeath-fan-site/actions) 查看。

## 运行 / 起動 / Run

需要通过 http 打开（不能直接双击 `index.html`），否则 YouTube 与音频无法播放：

```bash
python -m http.server 8765
```

然后访问 http://localhost:8765 。

## 站内播放说明

| 内容 | 本地 / 自建站 | claude.ai Artifact 版 |
| --- | --- | --- |
| 中 / 日 / 英语音（`assets/audio/`） | ✅ | ✅ |
| 飞行雪绒 30 秒试听（Apple Music） | ✅ | ❌ 托管环境禁止外部音频 |
| YouTube 视频弹窗 | ✅ | ❌ 改为外链 |
| pixiv 分享卡片 / X 嵌入 | ✅ | ❌ 改为链接卡片 |

要让所有人都能在页面内播放，把整个文件夹部署到任意静态托管（GitHub Pages、Cloudflare Pages、Netlify 等）即可。

## 结构

- `index.html` — 页面骨架
- `assets/css/style.css` — 样式与动画
- `assets/js/i18n.js` — 三语文案
- `assets/js/data.js` — 影像、年表、故事、细节考据、画廊、出处
- `assets/js/voice.js` — 49 条语音的三语台词（由 Wiki 生成）
- `assets/js/itunes.js` — 飞行雪绒官方发行与 30 秒试听（iTunes Search API）
- `assets/js/fanart-pixiv.js` — pixiv 人气同人图（只存作品 ID，图片走 pixiv 官方分享卡片）
- `assets/js/fanart.js` — 本地同人图登记（需作者授权）
- `assets/audio/{zh,ja,en}/` — 语音（© Kuro Games）
- `assets/img/official/`、`assets/img/covers/` — 官方美术与专辑封面（© Kuro Games）

彩蛋：在页面任意处输入角色故事里的隐藏房间密码。
