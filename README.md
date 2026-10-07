# Agenvas Pages

[Agenvas](https://github.com/grayrepo-byte/Agenvas) 的产品落地页，纯静态站点，托管在 GitHub Pages。

- 线上地址：https://grayrepo-byte.github.io/AgenvasPages/
- 原项目仓库：https://github.com/grayrepo-byte/Agenvas

## 结构

```
index.html                      单页站点
assets/css/styles.css           设计令牌与全部样式
assets/js/main.js               交互增强（滚动揭示、复制、标签页、画布连线、背景动效）
assets/img/                     品牌图标与公众号二维码
.nojekyll                       关闭 Jekyll 处理，直接发布静态文件
```

无构建步骤，无运行时依赖。修改后直接提交到 `main` 分支即可发布。

## 本地预览

```sh
python3 -m http.server 4321
# 打开 http://127.0.0.1:4321
```

## 设计约定

- 配色取自「Developer Tool / IDE」深色方案：背景 `#0F172A`、卡片 `#1B2336`、强调色 `#22C55E`、正文 `#F8FAFC`、次要文字 `#94A3B8`。
- 字体：JetBrains Mono（标题与代码）+ IBM Plex Sans（正文），中文回退到系统字体。
- 无障碍：正文对比度不低于 4.5:1、可见焦点环、44px 触控目标、`prefers-reduced-motion` 下关闭动效与滚动揭示。
- 响应式断点：1024px、860px、720px、600px。

## 部署

GitHub Pages 使用 `main` 分支根目录发布。在仓库 **Settings → Pages** 中确认 Source 为 `Deploy from a branch`，分支选择 `main` 与 `/ (root)`。

## 说明

本仓库仅包含落地页，Agenvas 的源代码、镜像发布与文档均在 [主仓库](https://github.com/grayrepo-byte/Agenvas)。
