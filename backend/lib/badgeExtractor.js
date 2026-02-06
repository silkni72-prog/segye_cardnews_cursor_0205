/**
 * 기사 제목 뱃지 추출 (one-click-news/lib/badgeExtractor.ts 기반)
 */

function extractBadgeFromTitle(title) {
    if (!title) return null;
    const match = title.match(/\[([^\]]+)\]/);
    if (!match) return null;

    const cornerText = match[1].trim();
    const specialBadges = {
        '단독': { bgColor: '#dc2626', color: '#ffffff', displayText: 'EXCLUSIVE' },
        '심층기획': { bgColor: '#2563eb', color: '#ffffff', displayText: 'IN-DEPTH' },
        '속보': { bgColor: '#ea580c', color: '#ffffff', displayText: 'BREAKING' },
        '특집': { bgColor: '#7c3aed', color: '#ffffff', displayText: 'SPECIAL' },
        '포토': { bgColor: '#059669', color: '#ffffff' },
        '영상': { bgColor: '#0891b2', color: '#ffffff' },
        '인터뷰': { bgColor: '#d97706', color: '#ffffff' }
    };
    const badgeConfig = specialBadges[cornerText] || { bgColor: '#6b7280', color: '#ffffff' };

    return {
        type: cornerText,
        text: badgeConfig.displayText || cornerText,
        color: badgeConfig.color,
        bgColor: badgeConfig.bgColor
    };
}

function removeBadgeFromTitle(title) {
    if (!title) return '';
    return title.replace(/\[[^\]]+\]\s*/g, '').trim();
}

module.exports = { extractBadgeFromTitle, removeBadgeFromTitle };
