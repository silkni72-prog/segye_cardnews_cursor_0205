/**
 * 헤드라인 후처리 (카드1 메인 텍스트)
 * - 2줄, 각 줄 8~10자 (핵심 요약 강화)
 * - 명사/구체어로 끝나도록 불완전한 어미·조사 제거
 */

const MAX_LENGTH = 10;
const MAX_LINES = 2;
const MIN_LENGTH = 2;

/** 불완전한 말끝 제거 반복 (명사형·핵심만 남기기) */
const TRIM_PATTERNS = [
    /[를한]$/g,
    /(만든|받을|의로|된지|하는|찾을|볼수|위한|대한|통한)$/g,
    /(?:하는|되는|이는|가는|오는|보는|위한|대한)$/g,
    /(?:으로|에서|부터|에게|에도|처럼|마저|조차)$/g,
    /[를와과에의도만큼]$/g,
    /(?:하데|지만|면서|이라도|이나마)$/g,
    /(?:이다|였다|다\.?|했다\.?)$/g,
    /(?:됐다|했다|있다|없다)\.?$/g,
    /[법적물적성적]$/g,
    /(?:이런|그런|저런|어떤)\s*$/g
];

/** 조사·불완전 어미로 끝나면 안 됨 */
const BAD_END = /[를한만든받을의로된에서와과도에만큼]$/;

function processOneLine(line, fallbackTitle) {
    let result = (line || '')
        .replace(/["""…\.]{2,}/g, '')
        .replace(/["']/g, '')
        .trim();
    if (result.length > MAX_LENGTH) result = result.substring(0, MAX_LENGTH);

    for (let i = 0; i < 25; i++) {
        const before = result;
        for (const re of TRIM_PATTERNS) {
            result = result.replace(re, '').trim();
        }
        if (result === before) break;
    }
    result = result.slice(0, MAX_LENGTH);

    if (BAD_END.test(result) || result.length < MIN_LENGTH) {
        const shortTitle = (fallbackTitle || '').toString().replace(/\s+/g, ' ').trim().substring(0, 12);
        if (shortTitle.length >= MIN_LENGTH) {
            let cleaned = shortTitle.replace(/[를한만든받을의로된에서와과도]$/g, '').trim().slice(0, MAX_LENGTH);
            if (cleaned.length >= MIN_LENGTH) result = cleaned;
            else result = shortTitle.slice(0, MAX_LENGTH);
        } else {
            result = shortTitle ? shortTitle + ' 이슈' : (result || '핵심 이슈');
        }
    }
    return result.slice(0, MAX_LENGTH);
}

function postProcessHeadline(headline, fallbackTitle) {
    if (!headline || typeof headline !== 'string') return fallbackTitle ? processOneLine(String(fallbackTitle).slice(0, 30), fallbackTitle) : '';

    const lines = headline
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, MAX_LINES);

    if (lines.length === 0) return processOneLine(fallbackTitle ? String(fallbackTitle).slice(0, 30) : '', fallbackTitle) || '핵심 이슈';
    const processed = lines.map((line) => processOneLine(line, fallbackTitle)).filter(Boolean);
    return processed.length ? processed.join('\n') : processOneLine(headline, fallbackTitle);
}

module.exports = { postProcessHeadline, MAX_LENGTH };
