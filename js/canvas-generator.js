/**
 * Canvas Generator - 간소화 버전
 * UI 표시를 위한 최소 기능 구현
 */

const CanvasGenerator = {
    /**
     * 카드뉴스 생성 메인 함수
     */
    async generateCardNews(url, images, analysisData, articleData, cardContent) {
        try {
            console.log('🎨 카드뉴스 생성 시작');
            
            // 기본 검증
            if (!cardContent || !cardContent.cards || cardContent.cards.length === 0) {
                throw new Error('카드 콘텐츠가 없습니다.');
            }
            
            console.log('✅ 카드 생성 완료 (Mock)');
            
            // Mock 카드 반환
            return cardContent.cards.map((card, index) => ({
                id: index + 1,
                title: card.title || `카드 ${index + 1}`,
                content: card.content || '',
                image: images && images.allImages && images.allImages[index % images.allImages.length] || null,
                template: analysisData?.template || 'hero'
            }));
            
        } catch (error) {
            console.error('❌ 카드 생성 오류:', error);
            throw error;
        }
    },
    
    /**
     * 이미지 로드
     */
    async loadAllImages(imageUrls) {
        if (!imageUrls || !Array.isArray(imageUrls)) {
            return [];
        }
        
        console.log('📸 이미지 로드:', imageUrls.length + '개');
        return imageUrls;
    },
    
    /**
     * 단일 이미지 로드
     */
    async loadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            
            img.src = url;
        });
    },
    
    /**
     * 플레이스홀더 이미지
     */
    createPlaceholderImage() {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        
        const ctx = canvas.getContext('2d');
        
        // 그라데이션 배경
        const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
        gradient.addColorStop(0, '#6366F1');
        gradient.addColorStop(1, '#8B5CF6');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1920);
        
        // 텍스트
        ctx.fillStyle = 'white';
        ctx.font = 'bold 60px "Noto Sans KR"';
        ctx.textAlign = 'center';
        ctx.fillText('SEGYE.On', 540, 960);
        
        return canvas;
    },
    
    /**
     * 카드 생성
     */
    async generateCard(index, template, images, analysisData, articleData, cardData) {
        console.log(`📄 카드 ${index} 생성`);
        
        return {
            id: index,
            title: cardData.title || `카드 ${index}`,
            content: cardData.content || '',
            image: images[index % images.length] || null,
            template: template
        };
    },
    
    /**
     * 캔버스 생성
     */
    createCanvas(template, image, cardData, articleData, index, totalCards) {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        
        const ctx = canvas.getContext('2d');
        
        // 배경
        ctx.fillStyle = '#1A2942';
        ctx.fillRect(0, 0, 1080, 1920);
        
        // 이미지 (있으면)
        if (image) {
            try {
                ctx.drawImage(image, 0, 0, 1080, 1080);
            } catch (e) {
                console.warn('이미지 그리기 실패:', e);
            }
        }
        
        // 텍스트 영역
        ctx.fillStyle = 'rgba(15, 27, 45, 0.9)';
        ctx.fillRect(0, 1080, 1080, 840);
        
        // 제목
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px "Noto Sans KR"';
        ctx.textAlign = 'center';
        
        const title = cardData.title || `카드 ${index}`;
        this.wrapText(ctx, title, 540, 1200, 980, 60);
        
        // 내용
        ctx.font = '32px "Noto Sans KR"';
        const content = cardData.content || '';
        this.wrapText(ctx, content, 540, 1350, 980, 45);
        
        // 페이지 번호
        ctx.font = '24px "Noto Sans KR"';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(`${index} / ${totalCards}`, 540, 1850);
        
        return canvas;
    },
    
    /**
     * 텍스트 줄바꿈
     */
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line, x, currentY);
                line = words[i] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        
        ctx.fillText(line, x, currentY);
    },
    
    /**
     * 템플릿별 렌더링
     */
    renderHeroTemplate(ctx, canvas, image, cardData, articleData, index, totalCards) {
        // Hero 템플릿 (전체 이미지 배경)
        if (image) {
            ctx.drawImage(image, 0, 0, 1080, 1920);
        }
        
        // 그라데이션 오버레이
        const gradient = ctx.createLinearGradient(0, 1200, 0, 1920);
        gradient.addColorStop(0, 'rgba(15, 27, 45, 0)');
        gradient.addColorStop(1, 'rgba(15, 27, 45, 0.95)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1920);
        
        // 텍스트
        ctx.fillStyle = 'white';
        ctx.font = 'bold 56px "Noto Sans KR"';
        ctx.textAlign = 'center';
        this.wrapText(ctx, cardData.title, 540, 1500, 980, 70);
    },
    
    renderBreakingTemplate(ctx, canvas, image, cardData, articleData, index, totalCards) {
        // Breaking 템플릿 (속보 스타일)
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(0, 0, 1080, 200);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px "Noto Sans KR"';
        ctx.textAlign = 'center';
        ctx.fillText('속보', 540, 130);
        
        if (image) {
            ctx.drawImage(image, 0, 200, 1080, 1080);
        }
        
        ctx.fillStyle = '#0F1B2D';
        ctx.fillRect(0, 1280, 1080, 640);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 44px "Noto Sans KR"';
        this.wrapText(ctx, cardData.title, 540, 1400, 980, 60);
    },
    
    renderDataTemplate(ctx, canvas, image, cardData, articleData, index, totalCards) {
        // Data 템플릿 (데이터 시각화)
        ctx.fillStyle = '#10B981';
        ctx.fillRect(0, 0, 1080, 300);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px "Noto Sans KR"';
        ctx.textAlign = 'center';
        ctx.fillText('데이터 분석', 540, 180);
        
        if (image) {
            ctx.drawImage(image, 90, 350, 900, 900);
        }
        
        ctx.fillStyle = '#0F1B2D';
        ctx.fillRect(0, 1300, 1080, 620);
        
        ctx.fillStyle = 'white';
        ctx.font = '40px "Noto Sans KR"';
        this.wrapText(ctx, cardData.content, 540, 1450, 940, 55);
    },
    
    renderExplainerTemplate(ctx, canvas, image, cardData, articleData, index, totalCards) {
        // Explainer 템플릿 (설명 중심)
        ctx.fillStyle = '#1E3A8A';
        ctx.fillRect(0, 0, 1080, 1920);
        
        if (image) {
            ctx.drawImage(image, 140, 200, 800, 800);
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(90, 1100, 900, 700);
        
        ctx.fillStyle = '#1E3A8A';
        ctx.font = 'bold 46px "Noto Sans KR"';
        ctx.textAlign = 'center';
        this.wrapText(ctx, cardData.title, 540, 1250, 840, 60);
        
        ctx.font = '34px "Noto Sans KR"';
        ctx.fillStyle = '#334155';
        this.wrapText(ctx, cardData.content, 540, 1400, 840, 50);
    },
    
    renderStoryTemplate(ctx, canvas, image, cardData, articleData, index, totalCards) {
        // Story 템플릿 (스토리텔링)
        if (image) {
            ctx.drawImage(image, 0, 0, 1080, 1400);
        }
        
        const gradient = ctx.createLinearGradient(0, 1000, 0, 1920);
        gradient.addColorStop(0, 'rgba(236, 72, 153, 0)');
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0.9)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1920);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 52px "Noto Sans KR"';
        ctx.textAlign = 'center';
        this.wrapText(ctx, cardData.title, 540, 1550, 980, 65);
    },
    
    renderMemeTemplate(ctx, canvas, image, cardData, articleData, index, totalCards) {
        // Meme 템플릿 (밈 스타일)
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(0, 0, 1080, 1920);
        
        if (image) {
            ctx.drawImage(image, 90, 150, 900, 900);
        }
        
        // 상단 텍스트
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 8;
        ctx.font = 'bold 60px "Noto Sans KR"';
        ctx.textAlign = 'center';
        
        const lines = cardData.title.split('\n');
        ctx.strokeText(lines[0] || '', 540, 1150);
        ctx.fillText(lines[0] || '', 540, 1150);
        
        if (lines[1]) {
            ctx.strokeText(lines[1], 540, 1750);
            ctx.fillText(lines[1], 540, 1750);
        }
    }
};

// 전역 객체로 노출
window.CanvasGenerator = CanvasGenerator;
