/**
 * 7장 카드뉴스 AI 생성 (백엔드 API 문서 기준)
 * Gemini 2.5-flash / OpenAI GPT-4o-mini 지원, 헤드라인·인용구 후처리 적용
 */

const { postProcessHeadline } = require('./headlinePostProcess');
const { postProcessQuote } = require('./quotePostProcess');

// ========== 카드뉴스 구성 기준 (API 문서와 동일) ==========
const CARD_RULES = {
    headline: { max: 22, desc: '2줄, 줄바꿈(\\n)으로 구분, 각 줄 8~10자 핵심 요약' },
    quote: { max: 30, desc: '30자 이내 인용구, 쌍따옴표 가능, 기자 문체 금지' },
    quoteSpeaker: { optional: true, desc: '발언자 이름 (선택)' },
    quoteContext: { max: 60, desc: '60자 이내 상황 설명 (선택)' },
    contextKeyLine: { max: 80, desc: '기사 핵심 멘트 요약 반드시 2문장 (카드3용)' },
    coreProblem: { max: 60, desc: '문제점 간략 요약 (카드3·카드4 테마용)' },
    card4KeySentence: { max: 45, desc: '카드4 핵심 문장 한 줄 (25-45자)' },
    card4Explanation: { max: 90, desc: '카드4 해설 문장 한 줄 (50-90자)' },
    beforeAfter: { format: 'BEFORE: [숫자] | AFTER: [숫자] | [설명]', desc: '숫자/기간/금액 중심 (참고용)' },
    whyImportant: { maxPerSentence: 35, sentences: 2, desc: '핵심을 함축적으로 요약한 2문장, 각 25-35자' },
    prosCons: {
        question: { max: 20, desc: '15~20자' },
        pros: { max: 20, desc: '장점·긍정적 내용 요약 15~20자' },
        cons: { max: 28, desc: 'PRO와 대조되는 내용 요약 15~28자' }
    },
    readerQuestion: { desc: '독자 연결 질문, 당신은? 형태' }
};

const GEMINI_PROMPT = `다음 기사를 분석하여 7장 카드뉴스 콘텐츠를 생성해주세요.

기사 제목: {{title}}
기사 내용: {{content}}

[헤드라인 핵심 요약 강화] 기사에서 가장 중요한 사실 1~2가지만 골라 2줄로 압축: (1) 제목+본문 앞부분에서 '누가/무엇이 + 무슨 일/결과'를 파악. (2) 첫 줄 = 주체·사건을 구체 명사로 8~10자(인물·기관·정책명·숫자 등). (3) 둘째 줄 = 결과·쟁점·수치·결정을 8~10자. (4) '이슈·문제·상황' 등 추상어 금지, 반드시 기사 키워드만 사용. 예: "국회 위원장 임기" + "한 달로 제한" (JSON에서 \\n으로 줄 구분)

[중요] 반드시 아래 JSON 형식으로만 응답하세요 (설명·주석 없이 JSON만):
{
  "headline": "첫 줄=주체·사건(8~10자)\\n둘째 줄=결과·쟁점·수치(8~10자)",
  "quote": "기사 내 실제 인용구 30자 이내",
  "quoteSpeaker": "발언자 이름 및 직책 (없으면 빈 문자열)",
  "quoteContext": "언제/무엇이 바뀌는지 60자 이내",
  "contextKeyLine": "기사 핵심 멘트를 반드시 2문장으로 요약 (60-80자). 각 문장은 반드시 완성형으로 끝낼 것(다/했다/이다 등, 마침표로 구분)",
  "coreProblem": "기사에서 드러나는 문제점을 간략히 요약 (40-60자)",
  "card4KeySentence": "카드4용 핵심 문장 한 줄, 문제점을 함축적으로 (25-45자)",
  "card4Explanation": "카드4용 해설 문장 한 줄, 문제점을 쉽게 설명 (50-90자)",
  "beforeAfter": "BEFORE: 12명 | AFTER: 150명 | 6개월간 12배 증가",
  "whyImportant": "기사 핵심을 함축적으로 요약한 2문장. 각 25-35자, 간결·핵심만.",
  "prosCons": {
    "question": "이 주제의 장단점은? (15~20자)",
    "pros": "장점·긍정적 내용을 요약한 한 문장 15~20자 (이점, 효과, 기대 등)",
    "cons": "PRO 내용과 대조되는 내용을 요약한 한 문장 15~28자 (PRO의 반대·상쇄되는 관점)"
  },
  "readerQuestion": "독자 연결 질문 (당신은? 형태)"
}

규칙 (API 문서 기준, 절대 엄수):
1. headline: 2줄만, 각 8~10자. 첫 줄=주체·사건(구체 명사·키워드), 둘째 줄=결과·쟁점·수치(기사 핵심만). 추상어 금지, 핵심 요약 강화
2. quote: 30자 이내, 기사 내 실제 인용구 우선, 기자 문체("~밝혔다" 등) 제거
3. quoteSpeaker: 실명 발언자 (없으면 빈 문자열)
4. quoteContext: 60자 이내
5. contextKeyLine: 기사 핵심 멘트 2문장 (60-80자), 각 문장 완성형 종결(다/했다/이다 등)
6. coreProblem: 문제점 간략 요약 (40-60자)
7. card4KeySentence: 카드4 핵심 문장 한 줄 (25-45자), card4Explanation: 카드4 해설 문장 한 줄 (50-90자)
8. beforeAfter: "BEFORE: [숫자만] | AFTER: [숫자만] | [설명]" 형식, 숫자·기간·금액 중심
9. whyImportant: 핵심을 함축적으로 요약한 2문장, 각 25-35자, 간결·핵심만, 추상어 금지
10. prosCons: question 15~20자. pros=장점·긍정 요약 15~20자. cons=PRO와 대조되는 내용 요약 15~28자
11. readerQuestion: 독자 삶과 연결되는 질문
12. contextKeyLine 2문장·coreProblem·card4KeySentence·card4Explanation 반드시 포함. 글자 수 초과 금지. JSON만 응답.`;

const OPENAI_PROMPT = `다음 기사를 분석하여 7장 카드뉴스 콘텐츠를 생성해주세요.

기사 제목: {{title}}
기사 내용: {{content}}

[헤드라인 핵심 요약] 기사에서 가장 중요한 사실만 2줄로: 첫 줄=주체·사건(8~10자, 구체 명사·인물·기관), 둘째 줄=결과·쟁점·수치(8~10자). 추상어 금지, 기사 키워드만 사용.

반드시 다음 JSON 형식으로만 응답 (설명 없이 JSON만):
{
  "headline": "주체·사건(8~10자)\\n결과·쟁점·수치(8~10자)",
  "quote": "30자 이내 인용구",
  "quoteSpeaker": "발언자 (없으면 빈 문자열)",
  "quoteContext": "60자 이내 상황",
  "contextKeyLine": "기사 핵심 멘트를 반드시 2문장으로 요약 (60-80자)",
  "coreProblem": "문제점 간략 요약 (40-60자)",
  "card4KeySentence": "카드4 핵심 문장 25-45자",
  "card4Explanation": "카드4 해설 문장 50-90자",
  "beforeAfter": "BEFORE: 숫자 | AFTER: 숫자 | 설명",
  "whyImportant": "핵심 함축 요약 2문장 각 25-35자",
  "prosCons": { "question": "15~20자", "pros": "장점·긍정 요약 15~20자", "cons": "PRO와 대조되는 내용 요약 15~28자" },
  "readerQuestion": "당신은? 형태"
}

규칙: headline 2줄 각 8~10자(첫 줄=주체·사건, 둘째 줄=결과·쟁점·수치, 핵심 요약 강화), quote 30자, contextKeyLine 2문장, coreProblem 40-60자, card4 2문장, beforeAfter 숫자형식, whyImportant 2문장 각 25-35자, prosCons question 15~20자·pros 장점 요약 15~20자·cons PRO와 대조되는 내용 요약 15~28자. JSON만.`;

/** 옵션에 따른 프롬프트 보조 지시문 (톤, 길이, 말투, 키워드 강조) */
function buildOptionsPromptSuffix(options) {
    if (!options || typeof options !== 'object') return '';
    const parts = [];
    const toneVal = Number(options.tone);
    if (!Number.isNaN(toneVal)) {
        if (toneVal <= 33) parts.push('전체 톤: 정보 전달 위주의 객관적·정보형으로 작성해주세요.');
        else if (toneVal <= 66) parts.push('전체 톤: 이슈와 논점을 드러내는 이슈형으로 작성해주세요.');
        else parts.push('전체 톤: 독자 공감과 감정을 살리는 감정형으로 작성해주세요.');
    }
    const lengthVal = options.lengthVal;
    if (lengthVal === '짧게') parts.push('문장은 짧고 핵심만 담아주세요.');
    if (lengthVal === '설명형') parts.push('설명을 보강해 이해하기 쉽게 작성해주세요.');
    const speechTone = options.speechTone;
    if (speechTone === '보도체') parts.push('말투: 보도 기사체(~다/~했다 등)를 유지해주세요.');
    if (speechTone === '카드뉴스체') parts.push('말투: 카드뉴스에 맞게 읽기 쉬운 구어체로 작성해주세요.');
    if (options.keywordEmphasis === true) parts.push('핵심 키워드는 강조할 수 있도록 명확한 표현으로 작성해주세요.');
    if (parts.length === 0) return '';
    return '\n\n[추가 지시]\n' + parts.join('\n');
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length <= maxLength ? text : text.slice(0, maxLength);
}

function truncateProsCons(str, maxLen) {
    if (!str || typeof str !== 'string') return str || '';
    const t = str.trim();
    return t.length <= maxLen ? t : t.slice(0, maxLen).trim();
}

function createFallback(article) {
    const content = article.content || article.description || '';
    const title = article.title || '';
    const sentences = content.split(/[.!?。！？]\s+/).filter((s) => s.trim().length > 5);
    const rawQuote = sentences[0] || title;
    return {
        headline: postProcessHeadline(truncateText(title, CARD_RULES.headline.max), title),
        quote: postProcessQuote(truncateText(rawQuote, CARD_RULES.quote.max), '핵심 내용을 확인하세요'),
        quoteSpeaker: undefined,
        quoteContext: undefined,
        contextKeyLine: truncateText(content.slice(0, 80) || title, CARD_RULES.contextKeyLine.max),
        coreProblem: truncateText(content.slice(0, 120) || '기사 내용을 확인하세요', CARD_RULES.coreProblem.max),
        card4KeySentence: truncateText(content.slice(0, 45) || title, CARD_RULES.card4KeySentence.max),
        card4Explanation: truncateText(content.slice(0, 90) || '상세한 설명은 기사를 참조하세요', CARD_RULES.card4Explanation.max),
        beforeAfter: 'BEFORE: 이전 | AFTER: 이후 | 변화 정보를 확인하세요',
        whyImportant: '상세 내용은 기사를 참조하세요',
        prosCons: {
            question: truncateProsCons('이 주제의 장단점은?', CARD_RULES.prosCons.question.max),
            pros: truncateProsCons('긍정적 관점', CARD_RULES.prosCons.pros.max),
            cons: truncateProsCons('대조되는 관점', CARD_RULES.prosCons.cons.max)
        },
        readerQuestion: '당신의 생각은 어떠신가요?'
    };
}

function parseJsonFromText(text) {
    const objMatch = text.match(/\{[\s\S]*?\}/);
    if (objMatch) {
        try { return JSON.parse(objMatch[0]); } catch (e) {}
    }
    const arrMatch = text.match(/\[[\s\S]*?\]/);
    if (arrMatch) {
        try {
            const arr = JSON.parse(arrMatch[0]);
            return Array.isArray(arr) ? arr[0] : arr;
        } catch (e) {}
    }
    return null;
}

function normalizeResult(parsed, article) {
    if (!parsed || !parsed.headline) return null;
    const title = article?.title || '';
    const rawHeadline = parsed.headline || title;
    const rawQuote = parsed.quote || title;

    const prosQuestionMax = CARD_RULES.prosCons.question.max;
    const prosConsProsMax = CARD_RULES.prosCons.pros.max;
    const prosConsConsMax = CARD_RULES.prosCons.cons.max;
    return {
        headline: postProcessHeadline(rawHeadline, title),
        quote: postProcessQuote(rawQuote, '핵심 내용을 확인하세요'),
        quoteSpeaker: parsed.quoteSpeaker && String(parsed.quoteSpeaker).trim() ? String(parsed.quoteSpeaker).trim() : undefined,
        quoteContext: parsed.quoteContext && String(parsed.quoteContext).trim() ? truncateText(parsed.quoteContext.trim(), CARD_RULES.quoteContext.max) : undefined,
        contextKeyLine: parsed.contextKeyLine && String(parsed.contextKeyLine).trim() ? truncateText(parsed.contextKeyLine.trim(), CARD_RULES.contextKeyLine.max) : undefined,
        coreProblem: parsed.coreProblem && String(parsed.coreProblem).trim() ? truncateText(parsed.coreProblem.trim(), CARD_RULES.coreProblem.max) : undefined,
        card4KeySentence: parsed.card4KeySentence && String(parsed.card4KeySentence).trim() ? truncateText(parsed.card4KeySentence.trim(), CARD_RULES.card4KeySentence.max) : (parsed.coreProblem && String(parsed.coreProblem).trim() ? truncateText(parsed.coreProblem.trim(), CARD_RULES.card4KeySentence.max) : '기사에서 드러나는 문제를 요약합니다.'),
        card4Explanation: parsed.card4Explanation && String(parsed.card4Explanation).trim() ? truncateText(parsed.card4Explanation.trim(), CARD_RULES.card4Explanation.max) : (parsed.coreProblem && String(parsed.coreProblem).trim() ? truncateText(parsed.coreProblem.trim(), CARD_RULES.card4Explanation.max) : '상세한 설명은 기사를 참조하세요.'),
        beforeAfter: parsed.beforeAfter && String(parsed.beforeAfter).trim() ? String(parsed.beforeAfter).trim() : 'BEFORE: 이전 | AFTER: 이후 | 변화 정보를 확인하세요',
        whyImportant: parsed.whyImportant && String(parsed.whyImportant).trim() ? truncateText(parsed.whyImportant.trim(), 120) : '상세 내용은 기사를 참조하세요',
        prosCons: {
            question: truncateProsCons(parsed.prosCons?.question || '이 주제의 장단점은?', prosQuestionMax),
            pros: truncateProsCons(parsed.prosCons?.pros || '긍정적 관점', prosConsProsMax),
            cons: truncateProsCons(parsed.prosCons?.cons || '대조되는 관점', prosConsConsMax)
        },
        readerQuestion: parsed.readerQuestion && String(parsed.readerQuestion).trim() ? String(parsed.readerQuestion).trim() : '당신의 생각은 어떠신가요?'
    };
}

/** 사용 가능한 Gemini 모델 목록 조회 (one-click-news generate/route.ts 동일) */
async function getAvailableGeminiModels(geminiKey) {
    try {
        const listResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`
        );
        if (!listResponse.ok) return null;
        const listData = await listResponse.json();
        const available = (listData.models || [])
            .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
            .map((m) => (m.name || '').replace('models/', ''));
        return available.length ? available.slice(0, 5) : null;
    } catch (e) {
        return null;
    }
}

async function generateWithGemini(article, geminiKey, options) {
    let models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    const content = article.content || article.description || '';
    const title = article.title || '';
    const promptSuffix = buildOptionsPromptSuffix(options || {});

    const available = await getAvailableGeminiModels(geminiKey);
    if (available && available.length > 0) {
        models = available.slice(0, 3);
        console.log('[card-generator] 사용 Gemini 모델:', models);
    }

    const fullPrompt = GEMINI_PROMPT.replace('{{title}}', title).replace('{{content}}', content.slice(0, 8000)) + promptSuffix;

    for (const modelName of models) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: fullPrompt }]
                        }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
                    })
                }
            );
            if (!response.ok) continue;
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const parsed = parseJsonFromText(text);
            const result = normalizeResult(parsed, article);
            if (result) return result;
        } catch (e) {
            console.warn(`[Gemini ${modelName}] 실패:`, e.message);
        }
    }
    return null;
}

async function generateWithOpenAI(article, openaiKey, options) {
    const content = article.content || article.description || '';
    const title = article.title || '';
    const promptSuffix = buildOptionsPromptSuffix(options || {});
    const userPrompt = OPENAI_PROMPT.replace('{{title}}', title).replace('{{content}}', content.slice(0, 8000)) + promptSuffix;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: '당신은 뉴스 기사를 7장 카드뉴스로 변환하는 전문가입니다.' },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.7,
                max_tokens: 1500
            })
        });
        if (!response.ok) return null;
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        const parsed = parseJsonFromText(text) || (text ? JSON.parse(text) : null);
        const result = normalizeResult(parsed, article);
        return result || null;
    } catch (e) {
        console.warn('[OpenAI] 실패:', e.message);
        return null;
    }
}

/**
 * 7장 카드 콘텐츠 생성 (Gemini 우선, OpenAI 폴백). options: tone, lengthVal, speechTone, keywordEmphasis
 */
async function generateSevenCardCopy(article, options) {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const opts = options && typeof options === 'object' ? options : {};

    if (geminiKey) {
        const result = await generateWithGemini(article, geminiKey, opts);
        if (result) return result;
    }
    if (openaiKey) {
        const result = await generateWithOpenAI(article, openaiKey, opts);
        if (result) return result;
    }

    return createFallback(article);
}

// ========== 기사 핵심 키워드 4~5개 생성 (태그용, # 없이 키워드만) ==========
const KEYWORD_PROMPT = `다음 기사에서 SNS 해시태그로 쓸 핵심 키워드를 4개 또는 5개만 추출하세요.
기사 제목: {{title}}
기사 내용 일부: {{content}}

규칙: 한 단어 또는 2~3단어 조합만. 뉴스 주제·인물·이슈·장소 등. 설명이나 문장 금지.
반드시 JSON 배열만 응답하세요. 예: ["멜로니", "이탈리아", "벽화논란", "총리"]`;

async function generateKeywordsWithGemini(article, geminiKey) {
    const title = article.title || '';
    const content = (article.content || article.description || '').slice(0, 1500);
    const prompt = KEYWORD_PROMPT.replace('{{title}}', title).replace('{{content}}', content);
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 200 }
                })
            }
        );
        if (!response.ok) return null;
        const data = await response.json();
        const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
        const parsed = parseJsonFromText(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, 5).map((s) => String(s).trim()).filter(Boolean);
        }
        const arrMatch = text.match(/\[[\s\S]*?\]/);
        if (arrMatch) {
            try {
                const arr = JSON.parse(arrMatch[0]);
                if (Array.isArray(arr)) return arr.slice(0, 5).map((s) => String(s).trim()).filter(Boolean);
            } catch (_) {}
        }
    } catch (e) {
        console.warn('[Keyword Gemini] 실패:', e.message);
    }
    return null;
}

async function generateKeywordsWithOpenAI(article, openaiKey) {
    const title = article.title || '';
    const content = (article.content || article.description || '').slice(0, 1500);
    const prompt = KEYWORD_PROMPT.replace('{{title}}', title).replace('{{content}}', content);
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: '기사에서 해시태그용 키워드만 JSON 배열로 추출합니다. 설명 없이 배열만 반환하세요.' },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3,
                max_tokens: 200
            })
        });
        if (!response.ok) return null;
        const data = await response.json();
        const text = (data.choices?.[0]?.message?.content || '').trim();
        const parsed = parseJsonFromText(text);
        const arr = Array.isArray(parsed) ? parsed : (parsed && parsed.keywords) ? parsed.keywords : null;
        if (Array.isArray(arr) && arr.length > 0) {
            return arr.slice(0, 5).map((s) => String(s).trim()).filter(Boolean);
        }
    } catch (e) {
        console.warn('[Keyword OpenAI] 실패:', e.message);
    }
    return null;
}

/** 기사 핵심 키워드 4~5개 생성. 마지막에 '세계일보'는 프론트에서 추가하므로 여기서는 4~5개만 반환 */
async function generateArticleKeywords(article) {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
    if (geminiKey) {
        const kw = await generateKeywordsWithGemini(article, geminiKey);
        if (kw && kw.length > 0) return kw;
    }
    if (openaiKey && !/^(sk-)?your[-_]?openai|sk-your|sk-proj-your/i.test(openaiKey)) {
        const kw = await generateKeywordsWithOpenAI(article, openaiKey);
        if (kw && kw.length > 0) return kw;
    }
    const title = (article.title || '').trim();
    if (title.length > 0) {
        const fallback = title.replace(/[^\w\s가-힣a-zA-Z0-9]/g, ' ').split(/\s+/).filter((s) => s.length > 1).slice(0, 5);
        if (fallback.length > 0) return fallback;
    }
    return [article.category || '뉴스'];
}

module.exports = {
    generateSevenCardCopy,
    generateArticleKeywords,
    createFallback,
    truncateText,
    CARD_RULES
};
