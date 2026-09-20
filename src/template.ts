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
 * 构造用于 T2I 渲染的 1080x1920 今日运势海报 HTML
 */
export function renderFortunePosterHtml(fortune: FortuneResult): string {
  const { item, date, backgroundUrl, userName, userAvatarUrl } = fortune

  const safeUserName = escapeHtml(userName || '旅行者')
  const safeSummary = escapeHtml(item.fortuneSummary)
  const safeStars = escapeHtml(item.luckyStar)
  const safeSign = escapeHtml(item.signText)
  const safeUnsign = escapeHtml(item.unsignText)
  const safeDate = escapeHtml(date.displayDate)
  const safeBg = escapeHtml(backgroundUrl)
  const safeAvatar = escapeHtml(userAvatarUrl)

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1080, height=1920, initial-scale=1.0" />
  <title>今日运势</title>
  <style>
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
      background-color: #12121a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      color: #ffffff;
    }
    /* 背景大图及渐变暗角 */
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
    .bg-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 1080px;
      height: 1920px;
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.15) 0%,
        rgba(0, 0, 0, 0.3) 50%,
        rgba(10, 10, 18, 0.85) 100%
      );
      z-index: 2;
    }
    /* 顶部简约日期徽章 */
    .top-badge {
      position: absolute;
      top: 60px;
      left: 60px;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 28px;
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 40px;
      backdrop-filter: blur(16px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    .top-badge .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #ff758c;
      box-shadow: 0 0 10px #ff758c;
    }
    .top-badge .text {
      font-size: 26px;
      font-weight: 600;
      letter-spacing: 2px;
      color: #f0f0f5;
    }
    /* 底部核心运势玻璃卡片 */
    .fortune-card {
      position: absolute;
      left: 50px;
      right: 50px;
      bottom: 60px;
      z-index: 10;
      padding: 48px 50px;
      border-radius: 36px;
      background: rgba(18, 20, 32, 0.78);
      border: 1px solid rgba(255, 255, 255, 0.18);
      backdrop-filter: blur(28px);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
      display: flex;
      flex-direction: column;
      gap: 28px;
    }
    /* 头部用户与日期信息 */
    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .user-profile {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .avatar {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid rgba(255, 255, 255, 0.85);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      background-color: #2a2a38;
    }
    .user-meta .user-name {
      font-size: 34px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 6px;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    }
    .user-meta .sub-text {
      font-size: 24px;
      color: rgba(255, 255, 255, 0.7);
      letter-spacing: 1px;
    }
    .date-box {
      text-align: right;
    }
    .date-box .date-text {
      font-size: 38px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 2px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }
    .date-box .lunar-hint {
      font-size: 22px;
      color: #ff9a9e;
      margin-top: 4px;
    }
    /* 运势评定大标语 & 幸运星 */
    .rating-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 32px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
    }
    .rating-title {
      font-size: 58px;
      font-weight: 900;
      letter-spacing: 4px;
      background: linear-gradient(135deg, #ffffff 0%, #ffd1ff 50%, #fbd786 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 4px 20px rgba(255, 209, 255, 0.3);
    }
    .rating-stars {
      font-size: 42px;
      letter-spacing: 6px;
      background: linear-gradient(90deg, #ff9a9e 0%, #fecfef 40%, #a1c4fd 80%, #ffd166 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 2px 8px rgba(255, 154, 158, 0.4));
    }
    /* 诗签简句 */
    .sign-section {
      padding: 12px 18px;
      border-left: 6px solid #fbd786;
      background: rgba(251, 215, 134, 0.08);
      border-radius: 0 16px 16px 0;
    }
    .sign-quote {
      font-size: 32px;
      font-weight: 600;
      color: #fff4d2;
      line-height: 1.5;
      letter-spacing: 1px;
    }
    /* 详细解文 */
    .unsign-section {
      font-size: 26px;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.9);
      letter-spacing: 1px;
      text-align: justify;
      min-height: 110px;
    }
    /* 底部防迷信标语 */
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 22px;
      color: rgba(255, 255, 255, 0.55);
      letter-spacing: 4px;
    }
  </style>
</head>
<body>
  ${safeBg ? `<img class="bg-image" src="${safeBg}" alt="background" />` : '<div class="bg-image" style="background: radial-gradient(circle at center, #2b32b2 0%, #1488cc 100%);"></div>'}
  <div class="bg-overlay"></div>

  <div class="top-badge">
    <div class="dot"></div>
    <div class="text">TODAY\'S FORTUNE · 今日运势</div>
  </div>

  <div class="fortune-card">
    <div class="header-row">
      <div class="user-profile">
        ${safeAvatar ? `<img class="avatar" src="${safeAvatar}" alt="avatar" />` : '<div class="avatar"></div>'}
        <div class="user-meta">
          <div class="user-name">${safeUserName}</div>
          <div class="sub-text">今日签语档案</div>
        </div>
      </div>
      <div class="date-box">
        <div class="date-text">${safeDate}</div>
        <div class="lunar-hint">${fortune.isHoliday ? '✦ 节日加成触发 ✦' : '日常签运'}</div>
      </div>
    </div>

    <div class="rating-section">
      <div class="rating-title">${safeSummary}</div>
      <div class="rating-stars">${safeStars}</div>
    </div>

    <div class="sign-section">
      <div class="sign-quote">“${safeSign}”</div>
    </div>

    <div class="unsign-section">
      ${safeUnsign}
    </div>

    <div class="card-footer">
      <span>✦ 仅供娱乐 | 相信科学 | 请勿迷信 ✦</span>
    </div>
  </div>
</body>
</html>`
}
