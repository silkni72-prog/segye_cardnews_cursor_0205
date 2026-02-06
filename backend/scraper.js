/**
 * 기사 크롤링 모듈 (one-click-news 로직 기반)
 * Cheerio + Axios로 실제 웹페이지에서 기사 내용 추출
 */
const cheerio = require('cheerio');
const axios = require('axios');
const { extractBadgeFromTitle, removeBadgeFromTitle } = require('./lib/badgeExtractor');

/**
 * URL에서 기사 크롤링
 * @param {string} url - 기사 URL
 * @returns {Promise<{title: string, content: string, image: string, url: string, category?: string}>}
 */
async function scrapeArticle(url) {
    const { data } = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000,
        maxContentLength: 5 * 1024 * 1024 // 5MB
    });

    const $ = cheerio.load(data);

    // 제목 추출 (one-click-news와 동일: 뱃지 추출 후 제목 정리)
    const rawTitle =
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('title').text() ||
        $('h1').first().text() ||
        '제목 없음';

    const badge = extractBadgeFromTitle(rawTitle);
    const title = removeBadgeFromTitle(rawTitle)?.trim().slice(0, 100);

    // 기사 본문 추출
    let articleBody = '';

    // 세계일보 전용 파싱
    if (url.includes('segye.com')) {
        const segyeSelectors = ['.article_txt', '.view_txt_con', '#article_txt', '.news_cnt'];

        for (const selector of segyeSelectors) {
            const element = $(selector);
            if (element.length > 0) {
                articleBody = element.find('p').map((_, el) => $(el).text().trim()).get().join(' ');
                if (!articleBody || articleBody.length < 100) {
                    articleBody = element.text().trim();
                }
                if (articleBody.length > 100) break;
            }
        }

        if (!articleBody || articleBody.length < 100) {
            const paragraphs = $('p').map((_, el) => {
                const text = $(el).text().trim();
                if (text.length > 50 && !text.includes('Copyright') && !text.includes('무단 전재')) {
                    return text;
                }
            }).get().join(' ');
            if (paragraphs.length > 100) articleBody = paragraphs;
        }
    }

    // article 태그
    if (!articleBody || articleBody.length < 100) {
        if ($('article').length > 0) {
            articleBody = $('article p').map((_, el) => $(el).text().trim()).get().join(' ');
        }
    }

    // 일반 본문 클래스
    if (!articleBody || articleBody.length < 100) {
        const contentSelectors = [
            '.article-body', '.article-content', '.post-content',
            '.entry-content', '.content', '.story-body',
            '#article-body', '#content', '.news-content'
        ];
        for (const selector of contentSelectors) {
            if ($(selector).length > 0) {
                articleBody = $(selector).find('p').map((_, el) => $(el).text().trim()).get().join(' ');
                if (articleBody && articleBody.length > 100) break;
            }
        }
    }

    // 모든 p 태그
    if (!articleBody || articleBody.length < 100) {
        const allParagraphs = $('p').map((_, el) => $(el).text().trim()).get()
            .filter(text => text.length > 50);
        if (allParagraphs.length > 0) {
            articleBody = allParagraphs.join(' ');
        }
    }

    // 폴백: 메타 description
    const metaDescription =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        '';

    const content = (articleBody || metaDescription || $('p').first().text() || '').trim().slice(0, 10000);

    // 이미지: og:image 우선, 이후 본문/기사 영역 img 수집 (최대 7장)
    const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '';
    const imgSrcs = [];
    if (ogImage) imgSrcs.push(ogImage);

    // 본문/기사 영역 내 img 추출
    const articleSelectors = ['.article_txt', '.view_txt_con', '#article_txt', '.news_cnt', 'article', '.article-body', '.content', '.post-content'];
    for (const sel of articleSelectors) {
        $(sel).find('img[src]').each((_, el) => {
            const src = $(el).attr('src');
            if (src && src.startsWith('http') && !imgSrcs.includes(src) && imgSrcs.length < 7) {
                imgSrcs.push(src);
            }
        });
        if (imgSrcs.length >= 7) break;
    }
    // 전체 페이지 img (상대 URL 절대 URL로)
    if (imgSrcs.length < 7) {
        const baseUrl = new URL(url);
        $('img[src]').each((_, el) => {
            if (imgSrcs.length >= 7) return false;
            let src = $(el).attr('src');
            if (!src) return;
            try {
                if (src.startsWith('//')) src = baseUrl.protocol + src;
                else if (src.startsWith('/')) src = baseUrl.origin + src;
                else if (!src.startsWith('http')) return;
                if (!imgSrcs.includes(src)) imgSrcs.push(src);
            } catch (e) {}
        });
    }
    const image = imgSrcs[0] || '';
    const images = imgSrcs.slice(0, 7);

    // 카테고리 추측 (URL 또는 본문 기반)
    let category = '일반';
    if (url.includes('segye.com')) {
        const match = url.match(/\/(politics|economy|society|culture|sports|international)\//);
        const categoryMap = {
            politics: '정치', economy: '경제', society: '사회',
            culture: '문화', sports: '스포츠', international: '국제'
        };
        if (match) category = categoryMap[match[1]] || '일반';
    }

    return {
        title,
        content,
        image,
        images,
        url,
        category,
        author: '세계일보',
        date: new Date().toISOString(),
        badge
    };
}

module.exports = {
    scrapeArticle,
    removeBadgeFromTitle,
    extractBadgeFromTitle
};
