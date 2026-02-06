/**
 * 3줄 요약 생성 (one-click-news lib/summaryGenerator.ts 복사)
 * 각 줄 정확히 10자 이내
 */

const MAX_LENGTH = 10;

/**
 * 기사 제목 기반 3줄 요약 (각 10자 이내)
 * @param {{ title: string, description?: string }} article
 * @returns {string[]}
 */
function generateThreeLineSummary(article) {
    let text = (article.title || '').trim();

    text = text
        .replace(/['"'""…•※★☆♡♥【】(){}]/g, '')
        .replace(/[·→←↓↑]/g, ' ')
        .replace(/[,、;:.?!]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const lines = [];
    let remaining = text;

    for (let i = 0; i < 3 && remaining.length > 0; i++) {
        if (remaining.length <= MAX_LENGTH) {
            lines.push(remaining);
            break;
        }

        let cutPoint = MAX_LENGTH;
        for (let j = MAX_LENGTH; j >= 6; j--) {
            if (remaining[j] === ' ') {
                cutPoint = j;
                break;
            }
        }

        const line = remaining.slice(0, Math.min(cutPoint, MAX_LENGTH)).trim();
        if (line.length > 0 && line.length <= MAX_LENGTH) {
            lines.push(line);
        }
        remaining = remaining.slice(cutPoint).trim();
    }

    if (lines.length === 0) {
        lines.push(text.slice(0, MAX_LENGTH));
    }

    return lines;
}

module.exports = {
    generateThreeLineSummary,
    MAX_LENGTH
};
