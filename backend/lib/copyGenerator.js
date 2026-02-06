/**
 * SNS 카피 생성 (one-click-news lib/copyGenerator.ts 복사)
 * Instagram / Facebook용 캐치프레이즈 및 카테고리별 해시태그
 */

const INSTAGRAM_CATCHPHRASES = [
    '오늘의 핵심 이슈 정리',
    '주목할 만한 뉴스 업데이트',
    '꼭 읽어야 할 트렌드',
    '트렌드의 중심 현장',
    '깊이 있는 분석 리포트',
    '시사 핵심 브리핑',
    '이슈의 리포트 정리',
    '전문 콘텐츠 제공',
    '전문가의 시선 분석',
    '이슈 브리핑 제공',
    '뉴스 업데이트 제공',
    '핵심만 정리 완료'
];

const FACEBOOK_CATCHPHRASES = [
    '정리된 주목할 만한 트렌드',
    '제공하는 오늘의 헤드라인',
    '확인해야 할 핵심 뉴스',
    '읽어보면 좋을 정보',
    '확인 가능한 이슈',
    '브리핑 제공 분석',
    '리포트 트렌드 정리',
    '현장 핵심 브리핑 제공'
];

/**
 * Instagram용 고품질 카피 생성
 * @param {{ title: string, description?: string, url: string }} article
 * @returns {string}
 */
function generateInstagramCopy(article) {
    const catchPhrase = INSTAGRAM_CATCHPHRASES[Math.floor(Math.random() * INSTAGRAM_CATCHPHRASES.length)];
    const shortTitle = (article.title && article.title.length > 30)
        ? article.title.slice(0, 30) + '...'
        : (article.title || '');
    const hashtags = ['#트렌드', '#뉴스', '#이슈분석', '#전문', '#오늘의뉴스'];
    return `${catchPhrase}

📰 ${shortTitle}

✨ 더 알아보기: Bio 링크

${hashtags.join(' ')}`;
}

/**
 * Facebook용 고품질 카피 생성
 * @param {{ title: string, description?: string, url: string }} article
 * @returns {string}
 */
function generateFacebookCopy(article) {
    const catchPhrase = FACEBOOK_CATCHPHRASES[Math.floor(Math.random() * FACEBOOK_CATCHPHRASES.length)];
    const summary = article.description
        ? article.description.slice(0, 100) + (article.description.length > 100 ? '...' : '')
        : '';
    return `${catchPhrase}

${article.title || ''}

${summary}

🔗 전문 읽기: ${article.url || ''}`;
}

/**
 * 카테고리별 맞춤 해시태그 (one-click-news 동일)
 * @param {string} category
 * @returns {string[]}
 */
function getCategoryHashtags(category) {
    const hashtagMap = {
        business: ['#경제', '#비즈니스', '#투자', '#시장분석', '#스타트업'],
        technology: ['#기술', '#IT', '#혁신', '#미래기술', '#테크트렌드'],
        politics: ['#정치', '#시사', '#정책', '#국정', '#이슈'],
        health: ['#건강', '#의학', '#헬스', '#피트니스', '#건강정보'],
        culture: ['#문화', '#예술', '#엔터', '#K컬처', '#문화생활'],
        sports: ['#스포츠', '#경기', '#선수', '#스포츠뉴스', '#게임'],
        science: ['#과학', '#우주', '#혁신', '#사이언스', '#기술개발'],
        default: ['#뉴스', '#트렌드', '#이슈', '#정보', '#오늘의뉴스']
    };
    return hashtagMap[category] || hashtagMap.default;
}

module.exports = {
    generateInstagramCopy,
    generateFacebookCopy,
    getCategoryHashtags
};
