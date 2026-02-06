/**
 * Mock Data System
 * 백엔드 없이 프론트엔드만으로 작동하는 Mock 데이터 시스템
 */

const MockData = {
    // 카테고리별 키워드
    categories: {
        politics: {
            name: '정치',
            keywords: ['정치', '국회', '법안', '정부', '대통령', '국민힘', '민주당'],
            template: 'breaking',
            color: '#DC2626',
            icon: '🏛️',
            hashtags: ['#정치', '#국회', '#정책', '#정치뉴스']
        },
        economy: {
            name: '경제',
            keywords: ['경제', '금리', '주식', '부동산', '증시', '기업', '채권'],
            template: 'data',
            color: '#10B981',
            icon: '💰',
            hashtags: ['#경제', '#금융', '#투자', '#부동산']
        },
        society: {
            name: '사회',
            keywords: ['사회', '교육', '복지', '환경', '사건', '사고', '재판'],
            template: 'explainer',
            color: '#1E3A8A',
            icon: '👥',
            hashtags: ['#사회', '#사회이슈', '#교육', '#환경']
        },
        entertainment: {
            name: '연예',
            keywords: ['연예', '스타', '드라마', '영화', 'K팝', '아이돌', '배우'],
            template: 'story',
            color: '#EC4899',
            icon: '🎭',
            hashtags: ['#연예', '#연예인', '#드라마', '#영화']
        },
        sports: {
            name: '스포츠',
            keywords: ['스포츠', '축구', '야구', '농구', '선수', '경기', '우승'],
            template: 'meme',
            color: '#F59E0B',
            icon: '⚽',
            hashtags: ['#스포칸', '#스포츠뉴스', '#경기', '#선수']
        }
    },

    // 카테고리별 고품질 샘플 이미지 (1080x1920 최적화)
    sampleImages: {
        politics: [
            'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1555093827-6ec0b82224a8?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1591290619762-d71b5fd5bde8?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1595152452543-e5fc28ebc2b8?w=1080&h=1920&fit=crop&q=80'
        ],
        economy: [
            'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=1080&h=1920&fit=crop&q=80'
        ],
        society: [
            'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1573164713619-24c711fe7878?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1509220969444-c2e4784dc08e?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1080&h=1920&fit=crop&q=80'
        ],
        entertainment: [
            'https://images.unsplash.com/photo-1598387993435-8b93a7bcf7cd?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1080&h=1920&fit=crop&q=80'
        ],
        sports: [
            'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=1080&h=1920&fit=crop&q=80',
            'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1080&h=1920&fit=crop&q=80'
        ]
    },

    // URL에서 카테고리 파악
    detectCategory(url) {
        const urlLower = url.toLowerCase();
        
        if (urlLower.includes('politics') || urlLower.includes('정치')) {
            return 'politics';
        } else if (urlLower.includes('economy') || urlLower.includes('경제')) {
            return 'economy';
        } else if (urlLower.includes('society') || urlLower.includes('사회')) {
            return 'society';
        } else if (urlLower.includes('entertainment') || urlLower.includes('연예') || urlLower.includes('culture')) {
            return 'entertainment';
        } else if (urlLower.includes('sports') || urlLower.includes('스포츠')) {
            return 'sports';
        }
        
        // 기본값
        return 'society';
    },

    // Mock AI 분석 데이터 생성
    generateAnalysis(url, category) {
        const cat = this.categories[category];
        
        return {
            category: cat.name,
            template: cat.template,
            keywords: cat.keywords.slice(0, 5),
            hashtags: cat.hashtags,
            sentiment: {
                positive: Math.random() * 0.3 + 0.2,
                negative: Math.random() * 0.3 + 0.1,
                neutral: Math.random() * 0.4 + 0.3,
                urgent: Math.random() * 0.5 + 0.3
            },
            mainPoints: [
                `${cat.name} 분야의 주요 이슈`,
                '국민들의 큰 관심사',
                '전문가 분석과 전망',
                '향후 발전 방향',
                '실생활 영향'
            ],
            cardCount: 6 + Math.floor(Math.random() * 3),
            estimatedCTR: (Math.random() * 2 + 3).toFixed(1) + '%'
        };
    },

    // 샘플 이미지 가져오기
    getRandomImages(category, count = 3) {
        const images = this.sampleImages[category] || this.sampleImages.society;
        const result = [];
        
        for (let i = 0; i < count; i++) {
            result.push(images[i % images.length]);
        }
        
        return result;
    },

    // Mock 기사 데이터 생성
    generateMockArticle(url, category) {
        const cat = this.categories[category];
        
        const titles = {
            politics: [
                '"국민의 민생을 최우선으로"',
                '새로운 정책의 핵심은?',
                '의회에서 열린 토론의 중심'
            ],
            economy: [
                '금리 인상이 경제에 미치는 영향',
                '투자자들이 주목하는 신호',
                '부동산 시장의 새로운 흐름'
            ],
            society: [
                '교육 현장의 변화를 읽다',
                '환경 보호를 위한 실천',
                '사회적 거리두기의 새로운 기준'
            ],
            entertainment: [
                '대히트를 기록한 신작 드라마',
                'K팝의 세계적 인기 비결',
                '영화계에 불고 있는 신선한 바람'
            ],
            sports: [
                '우승으로 이끌 역전의 순간',
                '선수들의 모습에서 본 열정',
                '경기 결과가 주는 교훈'
            ]
        };
        
        const categoryTitles = titles[category] || titles.society;
        
        return {
            title: categoryTitles[Math.floor(Math.random() * categoryTitles.length)],
            subtitle: `${cat.name} 분야의 핵심 이슈를 분석합니다`,
            summary: `세계일보가 전하는 ${cat.name} 분야의 최신 뉴스입니다. 전문가들의 분석과 함께 현장의 목소리를 담았습니다.`,
            category: cat.name,
            author: '세계일보 편집국',
            date: new Date().toLocaleDateString('ko-KR'),
            url: url
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockData;
}
