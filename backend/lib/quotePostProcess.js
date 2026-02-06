/**
 * 인용구 후처리 (one-click-news rewrite-quote 로직 기반)
 * - 기자 문체 제거
 * - 완결형 문장 보장
 * - 글자 수 제한 (30자, 카드뉴스 인용용)
 */

const MAX_LENGTH = 30;

function postProcessQuote(quote, fallback) {
    if (!quote || typeof quote !== 'string') return fallback || '핵심 내용을 확인하세요';

    let result = quote
        .replace(/^["'\"""'']/g, '')
        .replace(/["'\"""'']$/g, '')
        .replace(/["""…\.]{2,}/g, '')
        .trim();

    // 30자 제한 (카드뉴스 인용용)
    if (result.length > MAX_LENGTH) {
        result = result.substring(0, MAX_LENGTH);
    }

    // 기자 문체 제거
    result = result.replace(/(?:라고\s+(?:밝혔다|말했다|전했다|밝혔습니다))/g, '');
    result = result.replace(/(?:로\s+(?:나타났다|드러났다))/g, '');

    // 불완전한 종결 제거
    for (let i = 0; i < 3; i++) {
        result = result.replace(/(\.\.\.|\.\.|로\s*$|을\s*$|의\s*$|는\s*$)/, '');
        result = result.trim();
    }

    // 마침표가 없으면 추가
    if (result && !result.match(/[.!?]$/)) {
        result = result + '.';
    }

    return result.slice(0, MAX_LENGTH) || fallback || '핵심 내용을 확인하세요';
}

module.exports = { postProcessQuote, MAX_LENGTH };
