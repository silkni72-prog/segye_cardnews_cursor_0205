/**
 * Main Backend Integration
 * UI와 백엔드를 연결하는 메인 통합 스크립트
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 SEGYE.On 시스템 초기화 중...');
    
    // UI 요소
    const generateBtn = document.getElementById('generateBtn');
    const newsUrlInput = document.getElementById('newsUrl');
    
    if (!generateBtn || !newsUrlInput) {
        console.error('❌ 필수 UI 요소를 찾을 수 없습니다.');
        return;
    }
    
    console.log('✅ UI 요소 로드 완료');
    
    // 생성 버튼 클릭 이벤트
    generateBtn.addEventListener('click', handleGenerate);
    
    // Enter 키 이벤트
    newsUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleGenerate();
        }
    });
    
    /**
     * 카드뉴스 생성 핸들러
     */
    async function handleGenerate() {
        const url = newsUrlInput.value.trim();
        
        // URL 검증
        if (!url) {
            alert('기사 URL을 입력해주세요.');
            newsUrlInput.focus();
            return;
        }
        
        if (!url.startsWith('http')) {
            alert('올바른 URL 형식이 아닙니다. http:// 또는 https://로 시작하는 URL을 입력해주세요.');
            newsUrlInput.focus();
            return;
        }
        
        console.log('🎯 카드뉴스 생성 시작:', url);
        
        // 로딩 표시
        if (typeof ErrorHandler !== 'undefined') {
            ErrorHandler.showLoading('카드뉴스 생성 중...');
        }
        
        try {
            // Mock 모드 확인
            const isMockMode = BackendAPI.isMockMode();
            
            if (isMockMode) {
                console.log('💡 Mock 모드로 실행');
                await generateWithMockData(url);
            } else {
                console.log('🌐 백엔드 API 호출');
                await generateWithBackend(url);
            }
            
        } catch (error) {
            console.error('❌ 생성 실패:', error);
            
            if (typeof ErrorHandler !== 'undefined') {
                ErrorHandler.hideLoading();
                ErrorHandler.handleError(error, '카드뉴스 생성');
            } else {
                alert('카드뉴스 생성 중 오류가 발생했습니다: ' + error.message);
            }
        }
    }
    
    /**
     * Mock 데이터로 생성
     */
    async function generateWithMockData(url) {
        console.log('📦 Mock 데이터 생성 중...');
        
        // 카테고리 감지
        const category = MockData.detectCategory(url);
        console.log('📁 카테고리:', category);
        
        // Mock 데이터 생성
        const analysisData = MockData.generateAnalysis(url, category);
        const articleData = MockData.generateMockArticle(url, category);
        const images = {
            allImages: MockData.getRandomImages(category, 6)
        };
        
        // Mock 카드 콘텐츠
        const cardContent = {
            cards: [
                {
                    title: articleData.title,
                    content: articleData.summary
                },
                {
                    title: '주요 포인트 1',
                    content: analysisData.mainPoints[0]
                },
                {
                    title: '주요 포인트 2',
                    content: analysisData.mainPoints[1]
                },
                {
                    title: '주요 포인트 3',
                    content: analysisData.mainPoints[2]
                },
                {
                    title: '전문가 의견',
                    content: analysisData.mainPoints[3]
                },
                {
                    title: '향후 전망',
                    content: analysisData.mainPoints[4]
                }
            ]
        };
        
        console.log('✅ Mock 데이터 생성 완료');
        
        // 카드뉴스 생성
        const cards = await CanvasGenerator.generateCardNews(
            url,
            images,
            analysisData,
            articleData,
            cardContent
        );
        
        console.log('🎉 카드뉴스 생성 완료:', cards.length + '장');
        
        // 로딩 숨기기
        if (typeof ErrorHandler !== 'undefined') {
            ErrorHandler.hideLoading();
            ErrorHandler.showSuccess(`카드뉴스 ${cards.length}장이 생성되었습니다! (Demo 모드)`);
        }
        
        // 결과 표시
        displayResults(cards, analysisData, articleData);
    }
    
    /**
     * 백엔드 API로 생성
     */
    async function generateWithBackend(url) {
        console.log('🌐 백엔드 API 호출 중...');
        
        try {
            const result = await BackendAPI.generateCardNews(url);
            
            console.log('✅ 백엔드 응답:', result);
            
            // 로딩 숨기기
            if (typeof ErrorHandler !== 'undefined') {
                ErrorHandler.hideLoading();
                ErrorHandler.showSuccess(`카드뉴스 ${result.cards?.length || 0}장이 생성되었습니다!`);
            }
            
            // 결과 표시
            displayResults(result.cards, result.analysis, result.article);
            
        } catch (error) {
            console.error('❌ 백엔드 API 오류:', error);
            
            // Mock 모드로 폴백
            console.log('💡 Mock 모드로 전환하여 재시도');
            BackendAPI.toggleMockMode(true);
            
            if (typeof ErrorHandler !== 'undefined') {
                ErrorHandler.hideLoading();
            }
            
            await generateWithMockData(url);
        }
    }
    
    /**
     * 결과 표시
     */
    function displayResults(cards, analysisData, articleData) {
        console.log('📊 결과 표시:', {
            cards: cards?.length,
            analysis: analysisData,
            article: articleData
        });
        
        // 콘솔에만 표시 (UI는 향후 추가)
        console.log('✅ 생성 완료!');
        console.log('카드 수:', cards?.length);
        console.log('카테고리:', analysisData?.category);
        console.log('제목:', articleData?.title);
    }
    
    console.log('✅ SEGYE.On 시스템 초기화 완료');
});
