import type { FortuneResult } from './types.js'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * 1:1 还原原版 astrbot_plugin_jrys 的 1080x1920 海报排版
 * 对标原版 painter.py 与 README.assets/1.jpg
 */
export function renderFortunePosterHtml(fortune: FortuneResult): string {
  const { item, date, backgroundUrl, userAvatarUrl } = fortune

  const safeSummary = escapeHtml(item.fortuneSummary)
  const safeStars = escapeHtml(item.luckyStar)
  const safeSign = escapeHtml(item.signText)
  const safeUnsign = escapeHtml(item.unsignText)
  const safeDate = `${date.year}/${Number.parseInt(date.month, 10)}/${Number.parseInt(date.day, 10)}`
  const safeBg = escapeHtml(backgroundUrl)
  const safeAvatar = escapeHtml(userAvatarUrl)

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1080, height=1920, initial-scale=1.0" />
  <title>今日运势</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      position: relative;
      background-color: #000000;
      font-family: 'ZCOOL KuaiLe', "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", cursive, sans-serif;
      color: #ffffff;
      -webkit-font-smoothing: antialiased;
    }
    /* 全屏背景大图 */
    .bg-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 1080px;
      height: 1920px;
      object-fit: cover;
      object-position: center;
      z-index: 1;
    }
    /* 原版半透明图层：从 y=1270 延伸到底部，顶部 50px 圆角 */
    .translucent-layer {
      position: absolute;
      top: 1270px;
      left: 0;
      width: 1080px;
      height: 650px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 50px 50px 0 0;
      z-index: 2;
    }
    /* 原版左侧圆形头像：位于 (60, 1350)，尺寸 150x150 */
    .avatar-img {
      position: absolute;
      top: 1350px;
      left: 60px;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(255, 255, 255, 0.95);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      z-index: 5;
    }
    /* 浅彩色渐变文字（对标原版 get_light_color 浅黄/浅蓝/浅紫/浅粉/浅青） */
    .gradient-text {
      background: linear-gradient(90deg, #fffacd 0%, #add8e6 25%, #dda0dd 50%, #ffb6c1 75%, #e0ffff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: inline-block;
    }
    /* 居中通用容器 */
    .center-text-block {
      position: absolute;
      left: 0;
      width: 1080px;
      text-align: center;
      z-index: 4;
    }
    /* 日期：y=1300，字号 50px */
    .date-text {
      top: 1300px;
      font-size: 50px;
      font-weight: bold;
      letter-spacing: 2px;
    }
    /* 运势总结：y=1400，字号 60px，纯白 */
    .summary-text {
      top: 1395px;
      font-size: 60px;
      font-weight: bold;
      color: #ffffff;
      letter-spacing: 3px;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }
    /* 幸运星：y=1500，字号 60px，渐变色 */
    .lucky-star {
      top: 1495px;
      font-size: 60px;
      letter-spacing: 8px;
    }
    /* 左对齐诗签：y=1600，字号 30px */
    .sign-text {
      position: absolute;
      top: 1595px;
      left: 30px;
      right: 30px;
      font-size: 30px;
      color: #ffffff;
      line-height: 45px;
      z-index: 4;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    }
    /* 左对齐详细解文：y=1700，字号 30px，行距 45px，最大宽 1000px 自动换行 */
    .unsign-text {
      position: absolute;
      top: 1680px;
      left: 30px;
      right: 30px;
      max-width: 1020px;
      font-size: 30px;
      line-height: 45px;
      color: #ffffff;
      z-index: 4;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    }
    /* 警示文本：y=1850，字号 30px，居中 */
    .warning-text {
      top: 1850px;
      font-size: 30px;
      color: #ffffff;
      letter-spacing: 2px;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    }
  </style>
</head>
<body>
  ${safeBg ? `<img class="bg-image" src="${safeBg}" alt="background" />` : '<div class="bg-image" style="background: #2b32b2;"></div>'}
  <div class="translucent-layer"></div>

  ${safeAvatar ? `<img class="avatar-img" src="${safeAvatar}" alt="avatar" />` : ''}

  <div class="center-text-block date-text">
    <span class="gradient-text">${safeDate}</span>
  </div>

  <div class="center-text-block summary-text">
    ${safeSummary}
  </div>

  <div class="center-text-block lucky-star">
    <span class="gradient-text">${safeStars}</span>
  </div>

  <div class="sign-text">
    ${safeSign}
  </div>

  <div class="unsign-text">
    ${safeUnsign}
  </div>

  <div class="center-text-block warning-text">
    仅供娱乐 | 相信科学 | 请勿迷信
  </div>
</body>
</html>`
}
