/**
 * 기사 분석 기반 AI 이미지 생성 (DALL-E 3)
 * - 카드뉴스 1~6장별로 서로 다른 이미지 생성 (각 카드 콘텐츠 기반)
 * - 생성된 이미지 URL 배열을 seven-card-to-segye에서 카드별로 할당
 */
const axios = require('axios');

const OPENAI_IMAGE_URL = 'https://api.openai.com/v1/images/generations';

/** 카드 이미지가 없을 때 빈 공간 없이 채우는 placeholder (7장 항상 채움) */
const PLACEHOLDER_IMAGE_DATA_URL = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#e2e8f0"/><stop offset="100%" style="stop-color:#cbd5e1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>'
);

/** 카드별 이미지 프롬프트 (1~7장, 카드 타입에 맞는 시각) */
function buildCardPrompts(article, sevenCard) {
    const title = (article && article.title) || '';
    const headline = (sevenCard && sevenCard.headline) || title;
    const quote = (sevenCard && sevenCard.quote) || '';
    const quoteSpeaker = (sevenCard && sevenCard.quoteSpeaker) || '';
    const quoteContext = (sevenCard && sevenCard.quoteContext) || '';
    const coreProblem = (sevenCard && sevenCard.coreProblem) || '';
    const card4KeySentence = (sevenCard && sevenCard.card4KeySentence) || coreProblem;
    const whyImportant = (sevenCard && sevenCard.whyImportant) || '';
    const prosCons = sevenCard && sevenCard.prosCons ? sevenCard.prosCons : {};
    const pros = prosCons.pros || '';
    const cons = prosCons.cons || '';
    const readerQuestion = (sevenCard && sevenCard.readerQuestion) || '';
    const cap = (s, len) => (s || '').toString().slice(0, len);

    return [
        `Professional news headline photo, photojournalism: ${cap(headline, 80)}. Editorial, high quality, realistic, no text overlay.`,
        `Editorial portrait or speaking moment, news style: ${cap(quote, 60)} ${cap(quoteSpeaker, 30)}. Atmospheric, realistic, no text.`,
        `News context scene, documentary style: ${cap(quoteContext, 80)}. Realistic, editorial, no text overlay.`,
        `News problem or issue scene, editorial style: ${cap(card4KeySentence, 60)}. Realistic, documentary, no text overlay.`,
        `Why it matters - impact scene, news documentary: ${cap(whyImportant, 100)}. Realistic, editorial, no text.`,
        `Debate or two sides, editorial news style: ${cap(pros, 40)} versus ${cap(cons, 40)}. Symbolic or scene, no text overlay.`,
        `Premium newspaper closing, reader engagement: ${cap(readerQuestion, 60)}. Trustworthy, professional news brand atmosphere, no text overlay.`
    ];
}

/**
 * DALL-E 3로 이미지 1장 생성
 * @param {string} apiKey - OpenAI API 키
 * @param {string} prompt - 이미지 설명
 * @returns {Promise<string|null>} - 이미지 URL 또는 null
 */
async function generateOneImage(apiKey, prompt) {
    try {
        const response = await axios.post(
            OPENAI_IMAGE_URL,
            {
                model: 'dall-e-3',
                prompt: prompt.slice(0, 4000),
                n: 1,
                size: '1024x1024',
                quality: 'standard',
                style: 'natural'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 60000
            }
        );
        const url = response.data && response.data.data && response.data.data[0] && response.data.data[0].url;
        return url || null;
    } catch (err) {
        const status = err.response?.status;
        const data = err.response?.data;
        const code = data?.error?.code || data?.error?.type;
        const msg = data?.error?.message || err.message;
        if (status === 401) {
            console.error('[ImageGenerator] OpenAI API 키가 잘못되었거나 만료됨 (401). .env의 OPENAI_API_KEY를 확인하세요.');
        } else if (status === 429) {
            console.error('[ImageGenerator] OpenAI 사용량 한도 초과 (429). 잠시 후 다시 시도하세요.');
        } else if (status === 400 && (code === 'invalid_api_key' || msg?.toLowerCase?.().includes('api key'))) {
            console.error('[ImageGenerator] OpenAI API 키 형식 오류. 키가 sk- 또는 sk-proj- 로 시작하는지 확인하세요.');
        } else {
            console.error('[ImageGenerator] DALL-E 3 error:', status || '', code || '', msg);
        }
        return null;
    }
}

/**
 * 카드 1~7장 이미지 배열 구성.
 * - 카드1: URL(기사)에 첨부된 이미지를 우선 사용, 없을 때만 AI 생성 이미지 사용.
 * - 카드2~7: API 키가 있으면 카드별 AI 이미지 생성, 실패 시 기사 이미지/풀으로 채움.
 * @param {Object} article - 크롤링된 기사 { title, content, images }
 * @param {Object} sevenCard - AI 생성 7장 카드 콘텐츠
 * @param {Object} options - { openaiApiKey, existingImages }
 * @param {string[]} [options.existingImages] - 기사 페이지에서 추출한 이미지 URL 배열 (카드1 우선, 나머지 폴백)
 * @returns {Promise<string[]>} - 7장 분량 이미지 URL 배열
 */
async function generateImagesFromArticle(article, sevenCard, options = {}) {
    const existingImages = Array.isArray(options.existingImages) ? options.existingImages.slice(0, 7) : [];
    const merged = [];
    for (let i = 0; i < 7; i++) {
        const url = (existingImages[i] && String(existingImages[i]).trim()) || '';
        merged.push(url);
    }

    const apiKey = options.openaiApiKey || process.env.OPENAI_API_KEY;
    const keyTrim = (apiKey || '').trim();
    const canGenerate = keyTrim && !/^(sk-)?your[-_]?openai|sk-your|sk-proj-your/i.test(keyTrim) && (keyTrim.startsWith('sk-') || keyTrim.startsWith('sk-proj-'));

    const isRealUrl = (u) => u && String(u).trim() && !String(u).trim().startsWith('data:');

    if (!canGenerate) {
        console.warn('[ImageGenerator] OPENAI_API_KEY 미설정/비유효 → 기사 이미지로 순환 채움.');
        return fillEmptyWithAvailableImages(merged);
    }

    // 카드1(인덱스 0): 기사 이미지가 있으면 유지, 없을 때만 AI 생성 대상에 포함
    const needGenerate = [0, 1, 2, 3, 4, 5, 6].filter((i) => !isRealUrl(merged[i]));
    if (merged[0] && isRealUrl(merged[0])) {
        console.log('[ImageGenerator] 카드1 메인 이미지: URL 첨부 이미지 사용');
    }
    const prompts = buildCardPrompts(article, sevenCard);
    console.log('[ImageGenerator] 부족한 카드만 AI 이미지 생성:', needGenerate.length + '장 (카드 ' + (needGenerate.map((i) => i + 1).join(', ')) + ')');

    for (const i of needGenerate) {
        const url = await generateOneImage(keyTrim, prompts[i]);
        if (url) {
            merged[i] = url;
            console.log(`[ImageGenerator] 카드 ${i + 1}장 AI 이미지 생성 완료`);
        } else {
            console.warn(`[ImageGenerator] 카드 ${i + 1}장 AI 이미지 생성 실패 → 기사 이미지/풀 사용`);
        }
        await new Promise((r) => setTimeout(r, 800));
    }

    return fillEmptyWithAvailableImages(merged);
}

/** 실제 이미지(URL/AI) 풀을 만들어 빈 슬롯에 순환 배치 → 모든 카드에 URL 또는 AI 이미지가 보이도록 */
function fillEmptyWithAvailableImages(arr) {
    const out = arr.slice(0, 7);
    const pool = out.filter((u) => u && String(u).trim() && !String(u).trim().startsWith('data:'));
    if (pool.length > 0) {
        for (let i = 0; i < 7; i++) {
            if (!out[i] || !String(out[i]).trim() || String(out[i]).trim().startsWith('data:')) {
                out[i] = pool[i % pool.length];
            }
        }
    }
    for (let i = 0; i < 7; i++) {
        if (!out[i] || !String(out[i]).trim()) out[i] = PLACEHOLDER_IMAGE_DATA_URL;
    }
    return out;
}

function fillEmptySlotsWithPlaceholder(arr) {
    return fillEmptyWithAvailableImages(arr);
}

module.exports = {
    generateImagesFromArticle,
    generateOneImage,
    buildCardPrompts,
    PLACEHOLDER_IMAGE_DATA_URL
};
