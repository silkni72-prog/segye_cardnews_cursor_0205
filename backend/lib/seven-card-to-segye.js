/**
 * SevenCardCopy → segye 카드뉴스 형식 변환 (고품격 시사 스타일)
 * - 카드1: HEADLINE (보도사진+다크그라데이션, 포인트컬러)
 * - 카드2: 핵심 인용 (상단 생성 이미지 + 하단 인용/관련 텍스트)
 * - 카드3: 상황 정리
 * - 카드4: 문제점 요약 (색 바탕, 텍스트 카드 중앙)
 * - 카드5~6: WHY IT MATTERS, THE DEBATE
 * - 카드7: 마무리 (QR 제거, 원문 링크 유도)
 * 비율 4:5 (1080x1350), Pretendard
 */

const { detectCategory, getCategoryLabel } = require('./backgroundGenerator');

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function imageProxyUrl(rawUrl, baseUrl) {
    if (!rawUrl) return '';
    if (String(rawUrl).startsWith('data:')) return rawUrl;
    const encoded = encodeURIComponent(rawUrl);
    if (baseUrl && String(baseUrl).trim()) {
        const base = String(baseUrl).trim().replace(/\/$/, '');
        return base + '/api/image-proxy?url=' + encoded;
    }
    return '/api/image-proxy?url=' + encoded;
}
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#e2e8f0"/><stop offset="100%" style="stop-color:#cbd5e1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>');
function getImageSrc(imageUrl, baseUrl) {
    if (!imageUrl) return PLACEHOLDER_IMAGE;
    if (String(imageUrl).startsWith('data:')) return imageUrl;
    return imageProxyUrl(imageUrl, baseUrl) || PLACEHOLDER_IMAGE;
}

/** 모든 카드 공통: 우측 하단 카드 번호 제거 (비움) */
function footerHtml(cardNumber, totalCards, sourceReporter, isDark) {
    return '';
}

function segyeLogoAndPageNum(light, cardNumber, totalCards, baseUrl) {
    const textColor = light ? '#0f172a' : '#fff';
    return `<div class="card-header" style="position:absolute;top:0;left:0;right:0;padding:44px 56px;display:flex;align-items:center;justify-content:flex-start;z-index:10;background:transparent;">
        <span style="font-family:'Pretendard',sans-serif;font-size:31px;font-weight:800;letter-spacing:0.06em;color:${textColor};"><span style="color:inherit;">SEGYE.</span><span style="color:#7c3aed;">On</span></span>
    </div>`;
}

const textureOverlay = `
.card-texture{position:absolute;inset:0;pointer-events:none;z-index:0;opacity:0.04;}
.card-texture::before{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
.card-texture::after{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);background-size:32px 32px;}
`;

function getBaseStyles(cardWidth, cardHeight) {
    return `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Pretendard','Noto Sans KR',-apple-system,sans-serif;width:${cardWidth}px;height:${cardHeight}px;position:relative;overflow:hidden}
img{object-fit:cover}
${textureOverlay}
`;
}

function createCard1Cover(data, cardNumber, totalCards, catLabel, imageUrl, baseUrl, sourceReporter, cardWidth, cardHeight) {
    const w = cardWidth || CARD_WIDTH;
    const h = cardHeight || CARD_HEIGHT;
    const imgSrc = getImageSrc(imageUrl, baseUrl);
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>카드 ${cardNumber}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${getBaseStyles(w, h)}</style>
</head>
<body data-card-type="cover" style="background:#fff;display:flex;flex-direction:column;padding:0;position:relative;">
${segyeLogoAndPageNum(true, cardNumber, totalCards, baseUrl)}
<div style="position:relative;z-index:1;display:flex;flex-direction:column;flex:1;min-height:0;">
    <div data-editable="cover-image-wrap" style="width:100%;height:632px;flex-shrink:0;overflow:hidden;background:#e2e8f0;"><img data-editable="bg-image" src="${imgSrc}" alt="" style="width:100%;height:100%;object-fit:cover;object-position:center;" /></div>
    <div style="flex:1;background:#fff;padding:48px 56px 80px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;font-size:112px;">
        <div style="margin-bottom:24px;">
            <span style="display:inline-block;background:#dc2626;color:#fff;padding:14px 28px;border-radius:999px;font-size:32px;font-weight:800;letter-spacing:0.08em;">HEADLINE</span>
        </div>
        <h1 data-editable="headline" style="font-family:'Pretendard',sans-serif;font-size:90%;font-weight:900;line-height:1.35;color:#0f172a;text-align:center;word-break:keep-all;margin:0;width:100%;max-width:100%;">${(function() { const raw = (data.title || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n'); const lines = raw.split('\n').map(function(s) { return s.trim(); }).filter(Boolean).slice(0, 2).map(function(s) { return escapeHtml(s.length > 10 ? s.slice(0, 10) : s); }); return lines.join('<br/>'); })()}</h1>
    </div>
</div>
${footerHtml(cardNumber, totalCards, sourceReporter, true)}
</body>
</html>`;
}

function createCard2Quote(data, cardNumber, totalCards, catLabel, imageUrl, baseUrl, sourceReporter, cardWidth, cardHeight) {
    const w = cardWidth || CARD_WIDTH;
    const h = cardHeight || CARD_HEIGHT;
    const lines = (data.text || '').split('\n\n');
    const quoteLine = (lines[0] || '').replace(/^[""]|[""]$/g, '').trim().replace(/\./g, '');
    const authorLine = (lines[1] || '').replace(/^—\s*/, '').trim();
    const subLine = (lines.slice(2).join(' ').replace(/—\s*/g, '') || '').trim().replace(/\./g, '');
    const bgStyle = 'background: linear-gradient(165deg, #0f172a 0%, #1e3a5f 45%, #0c4a6e 100%);';
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>카드 ${cardNumber}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${getBaseStyles(w, h)}</style>
</head>
<body data-card-type="quote" style="${bgStyle} display:flex;flex-direction:column;padding:0;position:relative;min-height:100%;">
${segyeLogoAndPageNum(false, cardNumber, totalCards, baseUrl)}
<div style="position:relative;z-index:2;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:56px 56px 80px;">
    <div style="width:100%;max-width:100%;margin-bottom:48px;text-align:center;">
        <p data-editable="quote" style="font-family:'Pretendard',sans-serif;font-size:104px;font-weight:800;line-height:1.5;color:#fff;word-break:keep-all;margin:0;text-align:center;">&ldquo;${escapeHtml(quoteLine)}&rdquo;</p>
    </div>
    <div style="width:70%;max-width:70%;margin:0 auto;text-align:center;">
        ${authorLine ? `<div style="width:288px;height:4px;background:rgba(255,255,255,0.6);margin:0 auto 48px;"></div><p data-editable="author" style="font-size:43px;font-weight:600;color:#fcd34d;margin:0 0 48px 0;text-shadow:0 0 20px rgba(252,211,77,0.4);text-align:center;">${escapeHtml(authorLine)}</p>` : ''}
        ${subLine ? `<p data-editable="context" style="font-size:42px;color:rgba(255,255,255,0.85);line-height:1.55;margin:0;text-align:center;">${escapeHtml(subLine)}</p>` : ''}
    </div>
</div>
${footerHtml(cardNumber, totalCards, sourceReporter, false)}
</body>
</html>`;
}

function createCard3Context(data, cardNumber, totalCards, catLabel, imageUrl, baseUrl, sourceReporter, cardWidth, cardHeight, fallbackImageUrl) {
    const w = cardWidth || CARD_WIDTH;
    const h = cardHeight || CARD_HEIGHT;
    const isPlaceholder = (u) => !u || !String(u).trim() || String(u).trim().startsWith('data:');
    const primaryUrl = isPlaceholder(imageUrl) && fallbackImageUrl ? fallbackImageUrl : imageUrl;
    const imgSrc = getImageSrc(primaryUrl, baseUrl);
    const fallbackSrc = (fallbackImageUrl && !isPlaceholder(fallbackImageUrl) && getImageSrc(fallbackImageUrl, baseUrl)) || '';
    const fallbackAttr = fallbackSrc && primaryUrl !== fallbackImageUrl ? ` data-fallback-src="${String(fallbackSrc).replace(/"/g, '&quot;')}" onerror="if(this.getAttribute('data-fallback-src')){this.onerror=null;this.src=this.getAttribute('data-fallback-src')}"` : '';
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>카드 ${cardNumber}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${getBaseStyles(w, h)}</style>
</head>
<body data-card-type="context" style="background:#fff;display:flex;flex-direction:column;padding:0;position:relative;">
${segyeLogoAndPageNum(true, cardNumber, totalCards, baseUrl)}
<div style="position:relative;z-index:1;display:flex;flex-direction:column;flex:1;min-height:0;">
    <div data-editable="context-image-wrap" style="width:100%;height:630px;flex-shrink:0;overflow:hidden;background:#e2e8f0;"><img data-editable="bg-image" src="${imgSrc}" alt="" style="width:100%;height:100%;object-fit:cover;"${fallbackAttr} /></div>
    <div style="flex:1;min-height:0;overflow-y:auto;background:#fff;padding:40px 56px 80px;display:flex;flex-direction:column;align-items:stretch;">
        <div style="width:90%;max-width:90%;margin:0 auto;text-align:center;">
            <div style="color:#64748b;font-size:41px;font-weight:800;letter-spacing:0.14em;margin-bottom:48px;text-align:center;padding-bottom:12px;border-bottom:3px solid #e2e8f0;">CONTEXT</div>
            <p data-editable="context-keyline" style="font-family:'Pretendard',sans-serif;font-size:52px;font-weight:500;line-height:1.65;color:#1e293b;word-break:keep-all;width:100%;max-width:100%;text-align:center;margin:0;">${(function() { const raw = (data.contextKeyLine || data.text || '').trim().slice(0, 300); let out = raw; if (out && !/[.。]$/.test(out) && !/다$|했다$|였다$|있다$|한다$|니다$/.test(out)) { const lastDot = out.lastIndexOf('.'); if (lastDot > 0) out = out.slice(0, lastDot + 1).trim(); } return escapeHtml(out || '').replace(/\n/g, '<br/>'); })()}</p>
        </div>
    </div>
</div>
${footerHtml(cardNumber, totalCards, sourceReporter, true)}
</body>
</html>`;
}

function parseBarValues(beforeVal, afterVal) {
    const numBefore = parseFloat(String(beforeVal).replace(/[^0-9.-]/g, '')) || 0;
    const numAfter = parseFloat(String(afterVal).replace(/[^0-9.-]/g, '')) || 0;
    if (numBefore !== 0 || numAfter !== 0) {
        const max = Math.max(numBefore, numAfter, 1);
        return { beforePct: Math.min(100, (numBefore / max) * 100), afterPct: Math.min(100, (numAfter / max) * 100) };
    }
    return { beforePct: 40, afterPct: 100 };
}

/** beforeAfter 텍스트에서 라벨/값/제목 파싱 (카드4 상단 그래프 생성용) */
function parseBeforeAfterFromText(raw, defaultTitle) {
    const text = (raw || '').trim();
    let beforeLabel = 'BEFORE';
    let afterLabel = 'AFTER';
    let beforeVal = '—';
    let afterVal = '—';
    let displayTitle = defaultTitle || '변화 요약';
    const match = text.match(/BEFORE:\s*([^|]+)\s*\|\s*AFTER:\s*([^|]+)(?:\s*\|\s*(.+))?/i);
    if (match) {
        beforeVal = match[1].replace(/BEFORE:\s*/i, '').trim();
        afterVal = match[2].replace(/AFTER:\s*/i, '').trim();
        if (match[3]) displayTitle = match[3].trim();
    } else {
        const parts = text.split(/\s*\|\s*/);
        if (parts.length >= 2) {
            beforeVal = parts[0].trim();
            afterVal = parts[1].trim();
            if (parts[2]) displayTitle = parts[2].trim();
        }
    }
    return { beforeLabel, afterLabel, beforeVal, afterVal, displayTitle };
}

function escapeXmlText(s) {
    if (!s) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** BEFORE/AFTER 막대 그래프 SVG를 data URL로 생성 (카드4 상단 이미지용) */
function createBeforeAfterChartDataUrl(cardWidth, chartHeight, beforeVal, afterVal, beforeLabel, afterLabel, displayTitle) {
    const barValues = parseBarValues(beforeVal, afterVal);
    const pad = 80;
    const barH = 56;
    const gap = 40;
    const titleY = 52;
    const bar1Y = 120;
    const bar2Y = bar1Y + barH + gap;
    const barW = cardWidth - pad * 2;
    const beforeW = (barValues.beforePct / 100) * (barW - 60);
    const afterW = (barValues.afterPct / 100) * (barW - 60);
    const title = escapeXmlText(displayTitle).slice(0, 40);
    const bLabel = escapeXmlText(beforeLabel);
    const aLabel = escapeXmlText(afterLabel);
    const bVal = escapeXmlText(String(beforeVal).slice(0, 20));
    const aVal = escapeXmlText(String(afterVal).slice(0, 20));
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${chartHeight}" viewBox="0 0 ${cardWidth} ${chartHeight}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8fafc"/><stop offset="1" stop-color="#f1f5f9"/></linearGradient>
    <linearGradient id="barBefore" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#64748b"/><stop offset="1" stop-color="#94a3b8"/></linearGradient>
    <linearGradient id="barAfter" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#3b82f6"/></linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="${cardWidth/2}" y="${titleY}" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="36" font-weight="800" fill="#0f172a">${title}</text>
  <text x="${pad}" y="${bar1Y - 8}" font-family="Pretendard, sans-serif" font-size="24" font-weight="700" fill="#475569">${bLabel}</text>
  <rect x="${pad}" y="${bar1Y}" width="${barW}" height="${barH}" rx="10" fill="#e2e8f0"/>
  <rect x="${pad}" y="${bar1Y}" width="${beforeW}" height="${barH}" rx="10" fill="url(#barBefore)"/>
  <text x="${pad + barW - 8}" y="${bar1Y + barH/2 + 8}" text-anchor="end" font-family="Pretendard, sans-serif" font-size="22" font-weight="700" fill="#334155">${bVal}</text>
  <text x="${pad}" y="${bar2Y - 8}" font-family="Pretendard, sans-serif" font-size="24" font-weight="700" fill="#1e40af">${aLabel}</text>
  <rect x="${pad}" y="${bar2Y}" width="${barW}" height="${barH}" rx="10" fill="#dbeafe"/>
  <rect x="${pad}" y="${bar2Y}" width="${afterW}" height="${barH}" rx="10" fill="url(#barAfter)"/>
  <text x="${pad + barW - 8}" y="${bar2Y + barH/2 + 8}" text-anchor="end" font-family="Pretendard, sans-serif" font-size="22" font-weight="700" fill="#1e3a8a">${aVal}</text>
</svg>`;
    const base64 = Buffer.from(svg, 'utf8').toString('base64');
    return 'data:image/svg+xml;base64,' + base64;
}

/** 카드4: 문제점 요약 — 색 바탕, 텍스트만 카드 중앙 배치 (상단 이미지 없음) */
function createCard4Problem(data, cardNumber, totalCards, catLabel, imageUrl, baseUrl, sourceReporter, cardWidth, cardHeight) {
    const w = cardWidth || CARD_WIDTH;
    const h = cardHeight || CARD_HEIGHT;
    const keySentenceRaw = (data.keySentence || data.card4KeySentence || '').trim() || '기사에서 드러나는 문제를 요약합니다';
    const explanationRaw = (data.explanation || data.card4Explanation || '').trim() || '상세한 설명은 기사를 참조하세요';
    const keySentence = keySentenceRaw.replace(/\./g, '');
    const explanationStripped = explanationRaw.replace(/\./g, '');
    const explanation = explanationStripped ? (explanationStripped + (explanationStripped.endsWith('.') ? '' : '.')) : '';
    const cardBg = 'linear-gradient(165deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)';
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>카드 ${cardNumber}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${getBaseStyles(w, h)}</style>
</head>
<body data-card-type="problem" style="background:${cardBg};display:flex;flex-direction:column;padding:0;position:relative;">
${segyeLogoAndPageNum(true, cardNumber, totalCards, baseUrl)}
<div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:56px;">
    <div style="width:100%;max-width:900px;margin-bottom:28px;">
        <div style="color:#64748b;font-size:41px;font-weight:800;letter-spacing:0.14em;text-align:center;padding-bottom:12px;border-bottom:3px solid #cbd5e1;">KEY POINT</div>
    </div>
    <h2 data-editable="card4-key-sentence" style="font-family:'Pretendard',sans-serif;font-size:58px;font-weight:800;line-height:1.4;color:#0f172a;word-break:keep-all;margin:0 0 24px 0;max-width:900px;">${escapeHtml(keySentence)}</h2>
    <p data-editable="card4-explanation" style="font-family:'Pretendard',sans-serif;font-size:42px;font-weight:500;line-height:1.6;color:#475569;word-break:keep-all;margin:0;max-width:880px;">${escapeHtml(explanation)}</p>
</div>
${footerHtml(cardNumber, totalCards, sourceReporter, true)}
</body>
</html>`;
}

function createCard5WhyMatters(data, cardNumber, totalCards, catLabel, imageUrl, baseUrl, sourceReporter, cardWidth, cardHeight, fallbackImageUrl) {
    const w = cardWidth || CARD_WIDTH;
    const h = cardHeight || CARD_HEIGHT;
    const imgSrc = getImageSrc(imageUrl, baseUrl);
    const fallbackSrc = (fallbackImageUrl && getImageSrc(fallbackImageUrl, baseUrl)) || '';
    const safeImgSrc = imgSrc.replace(/"/g, '&quot;').replace(/'/g, '%27');
    const safeFallback = fallbackSrc ? String(fallbackSrc).replace(/"/g, '&quot;').replace(/'/g, '%27') : '';
    const fallbackAttr = safeFallback ? ` data-fallback-src="${safeFallback}" onerror="if(this.getAttribute('data-fallback-src')){this.onerror=null;this.src=this.getAttribute('data-fallback-src')}"` : '';
    const centralImgHtml = `<div data-editable="central-image-wrap" style="width:100%;max-width:884px;min-height:380px;height:420px;margin:0 auto 40px;border-radius:12px;overflow:hidden;border:3px solid #e2e8f0;box-shadow:0 16px 48px rgba(0,0,0,0.12);background:#e2e8f0;"><img data-editable="central-image" src="${safeImgSrc}" alt="" style="width:100%;height:100%;object-fit:cover;"${fallbackAttr} /></div>`;
    const keywords = Array.isArray(data.keywords) ? data.keywords : [];
    const keywordLine = keywords.length
        ? keywords.map(k => escapeHtml(String(k).trim())).filter(Boolean).map(k => `#${k}`).join(' ')
        : '';
    const keywordsHtml = keywordLine
        ? `<div data-editable="why-keywords" style="font-family:'Pretendard',sans-serif;font-size:32px;font-weight:700;color:#475569;letter-spacing:0.04em;margin-bottom:28px;line-height:1.5;word-break:keep-all;">${keywordLine}</div>`
        : '';
    const descriptionText = (data.text || '').trim();
    const descriptionHtml = descriptionText
        ? `<div data-editable="why-desc" style="font-family:'Pretendard',sans-serif;font-size:54px;font-weight:500;line-height:1.6;color:#1e293b;word-break:keep-all;margin:0;max-width:880px;margin:0 auto;">${escapeHtml(descriptionText).replace(/\n/g, '<br/>')}</div>`
        : '';
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>카드 ${cardNumber}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${getBaseStyles(w, h)}</style>
</head>
<body data-card-type="why" style="background:#f5f4f0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 56px 100px;position:relative;">
${segyeLogoAndPageNum(true, cardNumber, totalCards, baseUrl)}
<div style="position:relative;z-index:2;text-align:center;width:100%;max-width:900px;">
    <div style="font-size:48px;font-weight:800;color:#334155;letter-spacing:0.16em;margin-bottom:40px;">WHY IT MATTERS</div>
    ${centralImgHtml}
    ${keywordsHtml}
    ${descriptionHtml}
</div>
${footerHtml(cardNumber, totalCards, sourceReporter, true)}
</body>
</html>`;
}

function createCard6ProsCons(data, cardNumber, totalCards, catLabel, imageUrl, baseUrl, sourceReporter, cardWidth, cardHeight) {
    const w = cardWidth || CARD_WIDTH;
    const h = cardHeight || CARD_HEIGHT;
    const lines = (data.text || '').split('\n').filter(Boolean);
    const question = data.title || lines[0] || '장단점';
    const prosLine = lines.find(l => l.includes('👍') || l.startsWith('PRO')) || lines[0] || '긍정적 관점';
    const consLine = lines.find(l => l.includes('👎') || l.startsWith('CON')) || lines[1] || '대조되는 관점';
    const pros = (prosLine || '').replace(/^👍\s*|^PRO\s*/i, '').trim();
    const cons = (consLine || '').replace(/^👎\s*|^CON\s*/i, '').trim();
    const bgStyle = 'background: linear-gradient(165deg, #1e293b 0%, #334155 40%, #475569 100%);';
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>카드 ${cardNumber}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${getBaseStyles(w, h)}</style>
</head>
<body data-card-type="debate" style="${bgStyle} display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 56px 100px;position:relative;">
${segyeLogoAndPageNum(false, cardNumber, totalCards, baseUrl)}
<div style="position:relative;z-index:2;width:100%;max-width:900px;">
    <div style="width:50%;max-width:50%;min-width:280px;margin:0 auto 32px;">
        <div style="font-size:40px;font-weight:800;color:rgba(255,255,255,0.95);letter-spacing:0.12em;text-align:center;">THE DEBATE</div>
    </div>
    <div style="width:100%;max-width:100%;">
        <div style="font-size:88px;font-weight:800;color:#fff;margin-bottom:48px;text-align:center;line-height:1.4;">${escapeHtml(question)}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:24px;">
        <div style="padding:32px 40px;background:#ecfdf5;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.12);border-left:6px solid #16a34a;display:flex;gap:20px;align-items:flex-start;">
            <span style="flex-shrink:0;width:40px;height:40px;display:flex;align-items:center;justify-content:center;color:#15803d;font-size:28px;font-weight:bold;">✓</span>
            <div style="flex:1;text-align:left;">
                <div style="font-size:45px;font-weight:500;color:#15803d;margin-bottom:12px;letter-spacing:0.06em;">PRO</div>
                <p style="font-size:58px;font-weight:500;color:#0c1222;line-height:1.5;margin:0;text-align:left;">${escapeHtml(pros)}</p>
            </div>
        </div>
        <div style="padding:32px 40px;background:#fff1f2;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.12);border-left:6px solid #dc2626;display:flex;gap:20px;align-items:flex-start;">
            <span style="flex-shrink:0;width:40px;height:40px;display:flex;align-items:center;justify-content:center;color:#b91c1c;font-size:28px;font-weight:bold;">✕</span>
            <div style="flex:1;text-align:left;">
                <div style="font-size:45px;font-weight:500;color:#b91c1c;margin-bottom:12px;letter-spacing:0.06em;">CON</div>
                <p style="font-size:58px;font-weight:500;color:#0c1222;line-height:1.5;margin:0;text-align:left;">${escapeHtml(cons)}</p>
            </div>
        </div>
    </div>
</div>
${footerHtml(cardNumber, totalCards, sourceReporter, false)}
</body>
</html>`;
}

function createCard7Closing(data, cardNumber, totalCards, catLabel, articleUrl, sourceReporter, baseUrl, imageUrl, cardWidth, cardHeight) {
    const w = cardWidth || CARD_WIDTH;
    const h = cardHeight || CARD_HEIGHT;
    const sloganOffset = Math.round(h * 0.05);
    const segyeHome = 'https://www.segye.com';
    const articleLink = articleUrl || segyeHome;
    const logoUrl = baseUrl ? (String(baseUrl).replace(/\/$/, '') + '/assets/segye-on-logo.png') : '/assets/segye-on-logo.png';
    // 7번 카드는 이미지 없이 배경색만 사용 (다크 그라디언트)
    const bgStyle = 'background: linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #0c1222 100%);';
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>카드 ${cardNumber}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${getBaseStyles(w, h)}</style>
</head>
<body data-card-type="closing" style="${bgStyle} display:flex;flex-direction:column;align-items:center;padding:80px 56px 100px;position:relative;">
${segyeLogoAndPageNum(false, cardNumber, totalCards, baseUrl)}
<div style="position:relative;z-index:2;flex:1;display:flex;flex-direction:column;align-items:center;width:100%;max-width:900px;min-height:0;">
    <div style="flex-shrink:0;text-align:center;padding-bottom:40px;margin-top:${sloganOffset}px;">
        <p style="font-family:'Pretendard',sans-serif;font-size:42px;font-weight:800;color:#fff;letter-spacing:0.08em;margin:0 0 8px 0;line-height:1.3;">First to report,</p>
        <p style="font-family:'Pretendard',sans-serif;font-size:42px;font-weight:800;color:#fff;letter-spacing:0.08em;margin:0;line-height:1.3;">Last to cover</p>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
        <p data-editable="closing-cta" style="font-family:'Pretendard',sans-serif;font-size:76px;font-weight:700;color:rgba(255,255,255,0.95);line-height:1.5;margin:0 0 48px 0;word-break:keep-all;">${escapeHtml((data.readerQuestion || data.text || '더 많은 기사가 세계일보에 있습니다.').trim())}</p>
        <a href="${escapeHtml(articleLink)}" target="_blank" rel="noopener" style="display:inline-block;padding:24px 48px;background:#fff;color:#000;font-size:36px;font-weight:800;border-radius:12px;text-decoration:none;border:3px solid #fff;">원문 이동</a>
    </div>
    <div style="flex-shrink:0;text-align:center;margin-top:auto;padding-top:48px;">
        <p style="font-family:'Pretendard',sans-serif;font-size:32px;font-weight:800;color:#fff;margin:0;">출처 | 세계일보</p>
        <a href="${escapeHtml(segyeHome)}" target="_blank" rel="noopener" style="display:inline-block;margin-top:24px;font-size:24px;color:rgba(255,255,255,0.7);text-decoration:underline;">www.segye.com</a>
    </div>
</div>
${footerHtml(cardNumber, totalCards, sourceReporter, false)}
</body>
</html>`;
}

/**
 * 7장 구성: 1. headline  2. quote  3. context  4. 문제점(핵심·해설)  5. whyImportant  6. prosCons  7. closing(세계일보 유입)
 */
function convertToSegyeFormat(sevenCard, article, options = {}) {
    const baseUrl = options.baseUrl || '';
    const cat = detectCategory(article);
    const catLabel = getCategoryLabel(cat);
    const sourceReporter = article.author || article.reporter || '세계일보';
    const requestedCount = [5, 7, 9].includes(Number(options.cardCount)) ? Number(options.cardCount) : 7;
    const TOTAL_CARDS = 7;
    const snsArr = Array.isArray(options.snsFormats) ? options.snsFormats : [];
    const primaryFormat = snsArr.includes('1:1') ? '1:1' : snsArr.includes('9:16') ? '9:16' : '4:5';
    const cardWidth = 1080;
    const cardHeight = primaryFormat === '1:1' ? 1080 : primaryFormat === '9:16' ? 1920 : 1350;

    // 이미지: URL 기사 사진 우선 할당 후 부족분 AI 생성된 7장 배열 사용. placeholder(회색)인 슬롯은 실제 이미지 풀에서 순환 배치해 회색 구역 없이 채움.
    const rawImgs = article.generatedImages && article.generatedImages.length > 0
        ? article.generatedImages
        : (article.images && article.images.length > 0 ? article.images : (article.image ? [article.image] : []));
    const imgs = Array.isArray(rawImgs) ? rawImgs.slice(0, 7) : [];
    const isRealImage = (u) => u && String(u).trim() && !String(u).trim().startsWith('data:');
    const realPool = imgs.filter(isRealImage);
    const pick = (idx) => (imgs[idx] && isRealImage(imgs[idx]) ? imgs[idx] : (realPool.length ? realPool[idx % realPool.length] : ''));
    const img1 = pick(0);
    const img2 = pick(1);
    // 카드3·카드5: 해당 슬롯에 실제 이미지가 없으면 반드시 풀의 첫 번째 실제 이미지 사용(회색 방지)
    const firstRealImg = realPool.length ? realPool[0] : img1;
    const img3 = (imgs[2] && isRealImage(imgs[2])) ? imgs[2] : firstRealImg;
    const img4 = pick(3);
    const card4Image = img4;
    const card5Image = (imgs[4] && isRealImage(imgs[4])) ? imgs[4] : firstRealImg;
    const img6 = pick(5);
    const img7 = pick(6);

    const card1Data = { title: sevenCard.headline || article.title };
    const card2Data = {
        text: [sevenCard.quote, sevenCard.quoteSpeaker, sevenCard.quoteContext].filter(Boolean).join('\n\n')
    };
    const card3Data = {
        text: (article.content || article.description || '').slice(0, 600),
        contextKeyLine: sevenCard.contextKeyLine,
        coreProblem: sevenCard.coreProblem
    };
    const card4Data = {
        keySentence: sevenCard.card4KeySentence || sevenCard.coreProblem || '기사에서 드러나는 문제를 요약합니다.',
        explanation: sevenCard.card4Explanation || sevenCard.coreProblem || '상세한 설명은 기사를 참조하세요.'
    };
    const card5Keywords = Array.isArray(article.keywords) ? article.keywords.slice(0, 5) : [];
    const card5Data = { title: '왜 중요한가', text: sevenCard.whyImportant, keywords: card5Keywords };
    const card6Data = {
        title: sevenCard.prosCons?.question || '쟁점',
        text: [sevenCard.prosCons?.pros, sevenCard.prosCons?.cons].filter(Boolean).join('\n')
    };
    const card7Data = { text: sevenCard.readerQuestion, readerQuestion: sevenCard.readerQuestion };

    const cards = [
        {
            type: 'cover',
            title: sevenCard.headline,
            text: '',
            visualConcept: `${catLabel} · 헤드라인`,
            cardNumber: 1,
            html: createCard1Cover(card1Data, 1, TOTAL_CARDS, catLabel, img1, baseUrl, sourceReporter, cardWidth, cardHeight)
        },
        {
            type: 'content',
            title: '핵심 인용',
            text: sevenCard.quote,
            visualConcept: '인용',
            cardNumber: 2,
            html: createCard2Quote(card2Data, 2, TOTAL_CARDS, catLabel, img2, baseUrl, sourceReporter, cardWidth, cardHeight)
        },
        {
            type: 'content',
            title: '상황 정리',
            text: card3Data.text,
            visualConcept: 'CONTEXT',
            cardNumber: 3,
            html: createCard3Context(card3Data, 3, TOTAL_CARDS, catLabel, img3, baseUrl, sourceReporter, cardWidth, cardHeight, firstRealImg)
        },
        {
            type: 'content',
            title: '문제점 요약',
            text: (sevenCard.card4KeySentence || '') + '\n' + (sevenCard.card4Explanation || ''),
            visualConcept: '문제점',
            cardNumber: 4,
            html: createCard4Problem(card4Data, 4, TOTAL_CARDS, catLabel, card4Image, baseUrl, sourceReporter, cardWidth, cardHeight)
        },
        {
            type: 'content',
            title: 'WHY IT MATTERS',
            text: sevenCard.whyImportant,
            visualConcept: '왜 중요한가',
            cardNumber: 5,
            html: createCard5WhyMatters(card5Data, 5, TOTAL_CARDS, catLabel, card5Image, baseUrl, sourceReporter, cardWidth, cardHeight, firstRealImg)
        },
        {
            type: 'content',
            title: card6Data.title,
            text: card6Data.text,
            visualConcept: 'THE DEBATE',
            cardNumber: 6,
            html: createCard6ProsCons(card6Data, 6, TOTAL_CARDS, catLabel, img6, baseUrl, sourceReporter, cardWidth, cardHeight)
        },
        {
            type: 'closing',
            title: '마무리',
            text: sevenCard.readerQuestion,
            visualConcept: '세계일보 유입',
            cardNumber: 7,
            html: createCard7Closing(card7Data, 7, TOTAL_CARDS, catLabel, article.url || article.link, sourceReporter, baseUrl, img7, cardWidth, cardHeight)
        }
    ];

    let finalCards = cards;
    if (requestedCount === 5) {
        // 5장 구성: 7장에서 카드3(상황 정리), 카드4(BEFORE/AFTER) 제외 → 1, 2, 5, 6, 7
        const fiveCardSet = [cards[0], cards[1], cards[4], cards[5], cards[6]];
        finalCards = fiveCardSet.map((c, i) => {
            const newNum = i + 1;
            const totalForCard = 5;
            const htmlWithNum = c.html.replace(/(card-page-num[^>]*>)\s*\d+\s*(<\/div>)/gi, (_, pre, post) => pre + newNum + post);
            return { ...c, cardNumber: newNum, html: htmlWithNum };
        });
    } else if (requestedCount === 9) {
        const card8 = { ...cards[3], cardNumber: 8, html: cards[3].html.replace(/(card-page-num[^>]*>)\s*4\s*(<\/div>)/gi, '$18$2') };
        const card9 = { ...cards[4], cardNumber: 9, html: cards[4].html.replace(/(card-page-num[^>]*>)\s*5\s*(<\/div>)/gi, '$19$2') };
        finalCards = [...cards, card8, card9];
    }

    const summary = [sevenCard.headline, sevenCard.whyImportant].filter(Boolean).join(' ').slice(0, 200);

    return {
        templateType: requestedCount === 5 ? '시사 5장' : requestedCount === 9 ? '시사 9장' : '시사 7장',
        cardCount: finalCards.length,
        summary,
        cards: finalCards
    };
}

module.exports = {
    convertToSegyeFormat,
    createCard1Cover,
    createCard2Quote,
    createCard3Context,
    createCard4Problem,
    createCard5WhyMatters,
    createCard6ProsCons,
    createCard7Closing
};
