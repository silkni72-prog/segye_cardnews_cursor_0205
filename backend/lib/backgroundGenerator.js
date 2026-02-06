/**
 * 카테고리 감지 (one-click-news backgroundGenerator 기반)
 * 카드 visualConcept 등에 활용
 */

const CATEGORY_KEYWORDS = {
    business: ['경제', '기업', '주식', '투자', '금융', '부동산', '시장', '증권', '원화', '예산', '매출', '이익'],
    technology: ['기술', 'AI', '인공지능', '스마트폰', '앱', '소프트웨어', 'IT', '데이터', '클라우드', '5G', '반도체', '전자'],
    politics: ['정치', '선거', '국회', '대통령', '법안', '의원', '정책', '의회', '위원', '여당', '야당', '국정'],
    health: ['건강', '의학', '병원', '질병', '환자', '백신', '치료', '의사', '코로나', '감염', '보건'],
    culture: ['문화', '영화', '음악', '예술', '공연', '전시', '드라마', '예능', '배우', '가수', 'K팝', '축제'],
    sports: ['스포츠', '야구', '축구', '농구', '올림픽', '선수', '경기', '우승', '월드컵', '프로', '리그', '감독'],
    science: ['과학', '우주', '연구', '실험', '기후', '환경', '발견', '동물', '기술개발', 'NASA'],
};

const CATEGORY_LABELS = {
    business: '경제/비즈니스',
    technology: 'IT/기술',
    politics: '정치/시사',
    health: '건강/의료',
    culture: '문화/엔터',
    sports: '스포츠',
    science: '과학/환경',
    default: '일반',
};

/**
 * 기사 제목과 내용에서 카테고리 감지
 */
function detectCategory(article) {
    if (!article) return 'default';
    const text = `${article.title || ''} ${article.content || ''} ${article.description || ''}`.toLowerCase();

    let bestMatch = 'default';
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        const matchCount = keywords.filter((kw) => text.includes(kw.toLowerCase())).length;
        if (matchCount > maxMatches) {
            maxMatches = matchCount;
            bestMatch = category;
        }
    }

    return bestMatch;
}

/**
 * 카테고리에 맞는 한글 라벨 반환 (visualConcept 등에 사용)
 */
function getCategoryLabel(category) {
    return CATEGORY_LABELS[category] || CATEGORY_LABELS.default;
}

module.exports = {
    detectCategory,
    getCategoryLabel,
    CATEGORY_KEYWORDS,
    CATEGORY_LABELS,
};
