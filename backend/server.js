// 세계일보 카드뉴스 생성 시스템 - 백엔드 서버
// one-click-news_cursor 로직 기반
// API + 프론트엔드 정적 파일 통합 서버
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { scrapeArticle } = require('./scraper');
const { generateSevenCardCopy, generateArticleKeywords } = require('./lib/card-generator');
const { convertToSegyeFormat } = require('./lib/seven-card-to-segye');
const { generateImagesFromArticle, PLACEHOLDER_IMAGE_DATA_URL } = require('./lib/imageGenerator');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '..');

// AI API 키 확인 (Gemini 또는 OpenAI, one-click 로직 사용)
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY?.trim();
const isValidOpenAI = openaiKey && !/^(sk-)?your[-_]?openai[-_]?key|sk-your|sk-proj-your/i.test(openaiKey);
const hasValidAIKey = geminiKey || isValidOpenAI;
if (!hasValidAIKey) {
    console.warn('\n⚠️  AI API 키가 설정되지 않았습니다. (GEMINI_API_KEY 또는 OPENAI_API_KEY)');
    console.warn('   폴백 모드로 동작합니다. .env 파일에 API 키를 추가하세요.\n');
}

// 미들웨어
const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(cors({
    origin: corsOrigins,
    credentials: true
}));
app.use(express.json({ limit: '5mb' }));

// /backend 폴더 노출 방지
app.use((req, res, next) => {
    if (req.path.startsWith('/backend')) {
        return res.status(404).json({ success: false, error: 'Not found' });
    }
    next();
});

// 프론트엔드 정적 파일 서빙
app.use(express.static(ROOT_DIR, { index: 'index.html' }));

// 로깅 미들웨어
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ========================================
// 1. 헬스 체크 엔드포인트
// ========================================
app.get('/api/health', (req, res) => {
    const openaiRaw = process.env.OPENAI_API_KEY || '';
    const openaiTrim = openaiRaw.trim();
    const openaiSet = openaiTrim.length > 0;
    const openaiPlaceholder = /^(sk-)?your[-_]?openai|sk-your|sk-proj-your/i.test(openaiTrim);
    const imageGenOk = openaiSet && !openaiPlaceholder && (openaiTrim.startsWith('sk-') || openaiTrim.startsWith('sk-proj-'));
    res.json({
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        imageGenerationAvailable: imageGenOk,
        message: !openaiSet ? 'OPENAI_API_KEY 없음' : openaiPlaceholder ? 'OPENAI_API_KEY 예시 값임' : imageGenOk ? 'AI 이미지 생성 가능' : 'OPENAI_API_KEY 형식 확인',
        endpoints: {
            health: 'GET /api/health',
            checkKeys: 'GET /api/check-keys',
            scrape: 'POST /api/scrape',
            generate: 'POST /api/generate (SevenCardCopy)',
            cardnewsGenerate: 'POST /api/cardnews/generate (URL→6장 HTML)',
            analyze: 'POST /api/analyze',
            extract: 'POST /api/images/extract',
            imageProxy: 'GET /api/image-proxy?url=...'
        }
    });
});

// ========================================
// 1-1. API 키 상태 확인 (키 값 노출 없음, 이미지 생성 가능 여부)
// ========================================
app.get('/api/check-keys', (req, res) => {
    const openaiRaw = process.env.OPENAI_API_KEY || '';
    const openaiTrim = openaiRaw.trim();
    const openaiSet = openaiTrim.length > 0;
    const openaiPlaceholder = /^(sk-)?your[-_]?openai|sk-your|sk-proj-your/i.test(openaiTrim);
    const openaiValidFormat = openaiSet && !openaiPlaceholder && (openaiTrim.startsWith('sk-') || openaiTrim.startsWith('sk-proj-'));
    const imageGenerationAvailable = openaiValidFormat;

    res.json({
        openaiSet,
        openaiValidFormat,
        openaiPlaceholder: openaiSet && openaiPlaceholder,
        imageGenerationAvailable,
        message: !openaiSet
            ? 'OPENAI_API_KEY가 .env에 없습니다. 이미지 생성은 기사에서 추출한 이미지만 사용됩니다.'
            : openaiPlaceholder
                ? 'OPENAI_API_KEY가 예시 값입니다. 실제 키로 교체하세요. (OpenAI 대시보드 → API keys)'
                : !openaiValidFormat
                    ? 'OPENAI_API_KEY 형식이 올바른지 확인하세요. (sk- 또는 sk-proj- 로 시작)'
                    : 'AI 이미지 생성(DALL-E 3) 사용 가능합니다.'
    });
});

// ========================================
// 2. 기사 크롤링 엔드포인트 (실제 크롤링)
// ========================================
app.post('/api/scrape', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL이 필요합니다.'
        });
    }
    
    try {
        console.log('📰 기사 크롤링 시작:', url);
        const article = await scrapeArticle(url);
        article.images = article.image ? [article.image] : [];
        
        // API 문서 형식: description 필드 포함
        const payload = {
            ...article,
            description: article.content || article.description
        };
        res.json({
            success: true,
            data: payload
        });
        
    } catch (error) {
        console.error('크롤링 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message || '기사를 불러올 수 없습니다. URL을 확인해주세요.'
        });
    }
});

// ========================================
// 2-1. AI 콘텐츠 생성 (7장 카드뉴스 원문 - API 문서용)
// ========================================
// POST /api/generate → SevenCardCopy (headline, quote, beforeAfter, whyImportant, prosCons, readerQuestion)
app.post('/api/generate', async (req, res) => {
    const { article } = req.body;
    if (!article || (!article.title && !article.description)) {
        return res.status(400).json({
            error: 'article 객체에 title, description이 필요합니다.'
        });
    }
    try {
        const articleForAI = {
            title: article.title || '',
            description: article.description || article.content || '',
            content: article.description || article.content || ''
        };
        const sevenCard = await generateSevenCardCopy(articleForAI);
        res.json(sevenCard);
    } catch (error) {
        console.error('AI 생성 오류:', error.message);
        res.status(500).json({
            error: error.message || 'AI 콘텐츠 생성에 실패했습니다.'
        });
    }
});

// ========================================
// 3. AI 분석 엔드포인트
// ========================================
app.post('/api/analyze', async (req, res) => {
    const { title, content } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({
            success: false,
            error: '제목과 본문이 필요합니다.'
        });
    }
    
    try {
        // Mock 데이터 반환
        const mockAnalysis = {
            summary: 'AI 기술을 활용한 카드뉴스 자동 생성 시스템이 출시되어 기사 작성 효율이 크게 향상될 것으로 기대된다.',
            keyPoints: [
                'URL 입력만으로 자동 생성',
                '3-5초 만에 완성',
                'GPT-4 기반 AI 기술',
                '전문가 수준의 품질'
            ],
            category: '기술',
            sentiment: 'positive',
            cardCount: 6
        };
        
        res.json({
            success: true,
            data: mockAnalysis
        });
        
    } catch (error) {
        console.error('AI 분석 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// 4. 카드뉴스 생성 엔드포인트 (one-click 로직: Gemini/OpenAI)
// ========================================
app.post('/api/cardnews/generate', async (req, res) => {
    const { url, options: reqOptions } = req.body;
    
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL이 필요합니다.'
        });
    }
    
    const options = reqOptions && typeof reqOptions === 'object' ? reqOptions : {};
    
    try {
        console.log('\n🚀 카드뉴스 자동 생성 시작...');
        console.log('📰 URL:', url);
        if (Object.keys(options).length) {
            const safeOpts = { ...options };
            if (safeOpts.openaiApiKey) safeOpts.openaiApiKey = '(설정됨)';
            console.log('⚙️ 옵션:', safeOpts);
        }
        
        // 1단계: 실제 기사 크롤링
        console.log('\n1️⃣ 기사 크롤링 중...');
        let article;
        try {
            article = await scrapeArticle(url);
        } catch (scrapeError) {
            console.error('크롤링 실패:', scrapeError.message);
            throw new Error('기사를 불러올 수 없습니다. URL을 확인해주세요.');
        }
        
        if (!article.content || article.content.length < 50) {
            throw new Error('기사 본문을 추출할 수 없습니다. 다른 URL을 시도해주세요.');
        }
        console.log('✅ 기사 크롤링 완료:', article.title?.slice(0, 50) + '...');
        
        // 2단계: one-click 로직으로 7장 카드 콘텐츠 생성 (Gemini/OpenAI) + 옵션 반영
        console.log('\n2️⃣ AI로 7장 카드뉴스 콘텐츠 생성 중...');
        const articleForAI = {
            title: article.title,
            description: article.content,
            content: article.content,
            url
        };
        const sevenCard = await generateSevenCardCopy(articleForAI, options);
        
        // 2-1. 이미지: 기사 URL 페이지 이미지 우선 사용, 부족분만 AI 생성 (DALL-E 3)
        const articleImages = Array.isArray(article.images) ? article.images : (article.image ? [article.image] : []);
        const openaiKeyForImages = (options && options.openaiApiKey && String(options.openaiApiKey).trim()) || openaiKey;
        try {
            const mergedImages = await generateImagesFromArticle(article, sevenCard, {
                openaiApiKey: openaiKeyForImages,
                existingImages: articleImages
            });
            article.generatedImages = mergedImages;
            const fromPage = mergedImages.filter((u, i) => articleImages[i] === u).length;
            const fromAI = mergedImages.filter(Boolean).length - fromPage;
            if (fromPage) console.log('✅ 기사 페이지 이미지 사용:', fromPage + '장');
            if (fromAI) console.log('✅ 부족분 AI 이미지 생성:', fromAI + '장');
        } catch (imgErr) {
            console.warn('⚠️ 이미지 처리 실패:', imgErr.message);
            article.generatedImages = articleImages.slice(0, 7);
            while (article.generatedImages.length < 7) article.generatedImages.push(PLACEHOLDER_IMAGE_DATA_URL);
        }
        
        // 3단계: segye 형식으로 변환 + HTML 카드 생성 (옵션: 카드 장수, 굵기 등)
        console.log('\n3️⃣ segye 형식으로 변환 및 HTML 카드 생성 중...');
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host') || 'localhost:' + PORT}`;
        let cardnews = convertToSegyeFormat(sevenCard, article, { baseUrl, ...options });
        if (options.weightLevel != null) {
            const w = WEIGHT_MAP[Number(options.weightLevel)] || '500';
            cardnews = {
                ...cardnews,
                cards: cardnews.cards.map((c) => ({ ...c, html: applyFontWeightToCardHtml(c.html, Number(options.weightLevel)) }))
            };
        }
        
        console.log('✅ 전체 카드 생성 완료:', cardnews.cardCount + '장');
        
        // 태그용 핵심 키워드 4~5개 생성 (마지막 #세계일보는 프론트에서 고정 추가)
        let keywords = [];
        try {
            keywords = await generateArticleKeywords(article);
            if (keywords.length > 0) console.log('✅ 태그 키워드 생성:', keywords.length + '개');
        } catch (kwErr) {
            console.warn('⚠️ 태그 키워드 생성 건너뜀:', kwErr.message);
        }
        
        console.log('\n🎉 카드뉴스 자동 생성 완료!\n');
        
        res.json({
            success: true,
            data: {
                article: {
                    title: article.title,
                    category: article.category,
                    keywords: keywords
                },
                cardnews
            }
        });
        
    } catch (error) {
        console.error('\n❌ 카드뉴스 생성 오류:', error.message);
        
        // AI 오류인 경우
        if (error.message.includes('OpenAI') || error.message.includes('Gemini') || error.message.includes('API')) {
            return res.status(503).json({
                success: false,
                error: 'AI 서비스 오류가 발생했습니다. API 키를 확인해주세요.',
                details: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            error: '카드뉴스 생성 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// ========================================
// 4-0. 1차 적용: 헤더 설정을 카드 HTML에 반영 (굵기 등)
// ========================================
const cheerio = require('cheerio');
const WEIGHT_MAP = { 1: '300', 2: '400', 3: '500', 4: '700', 5: '900' };

function applyFontWeightToCardHtml(html, weightLevel) {
    const weight = WEIGHT_MAP[weightLevel] || '500';
    const $ = cheerio.load(html, { decodeEntities: false });
    $('[data-editable]').each((i, el) => {
        const $el = $(el);
        if ($el.prop('tagName') === 'IMG' || $el.is('img')) return;
        let style = $el.attr('style') || '';
        style = style.replace(/\bfont-weight:\s*[^;]+;?/gi, '');
        style = 'font-weight: ' + weight + '; ' + style;
        $el.attr('style', style.trim());
    });
    return $.html();
}

app.post('/api/cardnews/apply-defaults', (req, res) => {
    console.log('[apply-defaults] 요청 수신');
    const { cards, options } = req.body || {};
    if (!Array.isArray(cards) || !cards.length) {
        return res.status(400).json({ success: false, error: 'cards 배열이 필요합니다.' });
    }
    const weightLevel = (options && (options.weightLevel != null)) ? Number(options.weightLevel) : 3;
    const applied = cards.map((c) => {
        const html = typeof c === 'string' ? c : (c && c.html);
        if (!html) return c;
        const newHtml = applyFontWeightToCardHtml(html, weightLevel);
        return typeof c === 'object' && c !== null ? { ...c, html: newHtml } : newHtml;
    });
    console.log('[apply-defaults] 적용 완료, 카드 수:', applied.length);
    res.json({ success: true, cards: applied });
});

// ========================================
// 4-1. Mock 카드뉴스 (백업용)
// ========================================
app.post('/api/cardnews/generate-mock', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL이 필요합니다.'
        });
    }
    
    try {
        // Mock 데이터로 전체 카드뉴스 생성
        const mockCardNews = {
            category: '정치',
            articleData: {
                title: '세계일보 AI 카드뉴스 시스템',
                content: 'AI 기반 자동 카드뉴스 생성 시스템',
                author: 'AI프런티어팀',
                date: new Date().toISOString()
            },
            images: [
                'https://via.placeholder.com/1080x1920/0066cc/ffffff?text=Card+1',
                'https://via.placeholder.com/1080x1920/0099ff/ffffff?text=Card+2',
                'https://via.placeholder.com/1080x1920/00ccff/ffffff?text=Card+3'
            ],
            analysisData: {
                summary: 'AI 카드뉴스 자동 생성 시스템',
                keyPoints: [
                    'URL 입력만으로 자동 생성',
                    '3-5초 만에 완성',
                    '전문가 수준의 품질 보장'
                ],
                template: 'modern',
                cardCount: 6
            },
            cards: [
                {
                    number: 1,
                    type: 'cover',
                    title: 'AI 카드뉴스 시스템',
                    subtitle: '세계일보',
                    layout: 'cover',
                    bgColor: '#0066cc'
                },
                {
                    number: 2,
                    type: 'content',
                    title: '핵심 포인트 1',
                    text: 'URL만 입력하면 자동으로 카드뉴스가 생성됩니다.',
                    layout: 'text-center',
                    bgColor: '#0099ff'
                },
                {
                    number: 3,
                    type: 'content',
                    title: '핵심 포인트 2',
                    text: '3-5초 만에 완성되어 업무 효율이 크게 향상됩니다.',
                    layout: 'text-center',
                    bgColor: '#00ccff'
                },
                {
                    number: 4,
                    type: 'content',
                    title: '주요 기능',
                    text: '• 자동 크롤링\n• AI 분석\n• 카드뉴스 생성\n• 실시간 편집',
                    layout: 'text-left',
                    bgColor: '#3399ff'
                },
                {
                    number: 5,
                    type: 'quote',
                    text: '"AI 기술로 카드뉴스 제작 시간을 90% 단축했습니다"',
                    author: 'AI프런티어팀',
                    layout: 'quote',
                    bgColor: '#6699ff'
                },
                {
                    number: 6,
                    type: 'closing',
                    title: '세계일보',
                    subtitle: 'AI로 더 나은 뉴스를',
                    layout: 'closing',
                    bgColor: '#9999ff'
                }
            ]
        };
        
        res.json({
            success: true,
            data: mockCardNews
        });
        
    } catch (error) {
        console.error('카드뉴스 생성 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// 5. 이미지 추출 엔드포인트
// ========================================
app.post('/api/images/extract', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL이 필요합니다.'
        });
    }
    
    try {
        // Mock 데이터 반환
        const mockImages = [
            'https://via.placeholder.com/1080x1920/ff6b6b/ffffff?text=Image+1',
            'https://via.placeholder.com/1080x1920/4ecdc4/ffffff?text=Image+2',
            'https://via.placeholder.com/1080x1920/45b7d1/ffffff?text=Image+3'
        ];
        
        res.json({
            success: true,
            data: {
                images: mockImages
            }
        });
        
    } catch (error) {
        console.error('이미지 추출 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// 6. 이미지 프록시 (CORS 우회, one-click-news 기반)
// ========================================
const ALLOWED_IMAGE_DOMAINS = [
    'segye.com', 'www.segye.com', 'image.segye.com', 'img.segye.com', 'cdn.segye.com', 'photo.segye.com',
    'i.imgur.com', 'cdn.pixabay.com', 'via.placeholder.com',
    'img.hankyung.com', 'img.joins.com', 'img.donga.com', 'photo.jtbc.co.kr',
    't1.daumcdn.net', 'img1.daumcdn.net', 'post-phinf.pstatic.net', 'newsimg.hankookilbo.com',
    'pds.joongang.co.kr', 'img.sedaily.com', 'sportsworldi.com',
    'oaidalleapiprodscus.blob.core.windows.net',
    'cdn.dailyimpact.co.kr', 'img.khan.co.kr', 'img.hani.co.kr', 'img.mk.co.kr',
    'img.yna.co.kr', 'photo.yna.co.kr', 'img.nocutnews.co.kr', 'img.insight.co.kr',
    'img.sportalkorea.com', 'img.huffpost.kr', 'img.news1.kr', 'img.newspim.com',
    'img.etnews.com', 'img.chosun.com', 'photo.chosun.com', 'img.news.jtbc.co.kr',
    'img.kmib.co.kr', 'img.breaknews.com', 'img.danawa.com', 'img.rfi.fr',
    'img.ap.org', 'cdn.gettyimages.com', 'static.reuters.com', 's.yimg.com'
];

// 프록시 실패 시 이미지 구역이 비어 보이지 않도록 placeholder SVG 반환
const PLACEHOLDER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#e2e8f0"/><stop offset="100%" style="stop-color:#cbd5e1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>';

function sendPlaceholderImage(res) {
    res.set({ 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' });
    res.send(PLACEHOLDER_SVG);
}

app.get('/api/image-proxy', async (req, res) => {
    const imageUrl = req.query.url;

    if (!imageUrl) {
        return res.status(400).json({ success: false, error: 'Image URL is required' });
    }

    // data: URL은 프록시하지 않고 400 (카드에서는 getImageSrc가 data:는 그대로 반환하므로 여기 오지 않음)
    if (String(imageUrl).startsWith('data:')) {
        return res.status(400).json({ success: false, error: 'Data URL cannot be proxied' });
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(imageUrl);
    } catch {
        return res.status(400).json({ success: false, error: 'Invalid image URL' });
    }

    // OpenAI DALL-E 이미지는 리전별로 다른 blob 호스트 사용 (oaidalleapiprodscus, oaidalleapiprodeastus 등)
    const isOpenAIBlob = parsedUrl.hostname.endsWith('.blob.core.windows.net');
    const isAllowed = isOpenAIBlob || ALLOWED_IMAGE_DOMAINS.some(
        (d) => parsedUrl.hostname === d || parsedUrl.hostname.endsWith(`.${d}`)
    );
    if (!isAllowed) {
        console.warn('[Image Proxy] Domain not allowed:', parsedUrl.hostname, '→ placeholder 반환');
        return sendPlaceholderImage(res);
    }

    try {
        console.log('[Image Proxy] Fetching:', imageUrl);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/*,*/*;q=0.8',
                'Referer': 'https://www.segye.com/'
            },
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            console.error('[Image Proxy] Fetch failed:', response.status, imageUrl, '→ placeholder 반환');
            return sendPlaceholderImage(res);
        }

        const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
        const okType = contentType.startsWith('image/') || contentType === 'application/octet-stream';
        if (!okType) {
            console.warn('[Image Proxy] Not image content-type:', contentType, '→ placeholder 반환');
            return sendPlaceholderImage(res);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`[Image Proxy] ✅ Proxied: ${imageUrl} (${buffer.length} bytes)`);

        res.set({
            'Content-Type': contentType.startsWith('image/') ? contentType : 'image/jpeg',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=31536000, immutable'
        });
        res.send(buffer);
    } catch (error) {
        console.error('[Image Proxy] Error:', error.message, '→ placeholder 반환');
        sendPlaceholderImage(res);
    }
});

// 404 처리: API 요청은 JSON, 그 외는 index.html (SPA 폴백)
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, error: '요청한 엔드포인트를 찾을 수 없습니다.' });
    }
    res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

// 에러 처리
app.use((err, req, res, next) => {
    console.error('서버 오류:', err);
    res.status(500).json({
        success: false,
        error: '서버 내부 오류가 발생했습니다.'
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log('\n================================================');
    console.log('  ✅ 백엔드 서버 시작 완료!');
    console.log('================================================');
    console.log(`📡 서버 주소: http://localhost:${PORT}`);
    console.log(`🌐 CORS 허용: ${corsOrigins.join(', ')}`);
    console.log(`🤖 AI API: ${hasValidAIKey ? '설정됨 (Gemini/OpenAI)' : '미설정 (폴백 모드)'}`);
    const imgGenOk = openaiKey && !/^(sk-)?your[-_]?openai|sk-your|sk-proj-your/i.test(openaiKey.trim()) && (openaiKey.startsWith('sk-') || openaiKey.startsWith('sk-proj-'));
    console.log(`🖼️ AI 이미지 생성: ${imgGenOk ? '가능 (OPENAI_API_KEY)' : '비활성 (OPENAI_API_KEY 설정 시 DALL-E 3 사용)'}`);
    console.log('\n📚 사용 가능한 엔드포인트:');
    console.log('  GET  /api/health');
    console.log('  POST /api/scrape');
    console.log('  POST /api/analyze');
    console.log('  POST /api/cardnews/generate');
    console.log('  POST /api/images/extract');
    console.log('  GET  /api/image-proxy?url=...');
    console.log('  GET  /api/check-keys  (API 키 상태 확인)');
    console.log('\n🌐 웹사이트: http://localhost:' + PORT + ' 에서 접속하세요!');
    console.log('   기사 URL 입력 → AI로 생성하기 클릭');
    console.log('================================================\n');
});
