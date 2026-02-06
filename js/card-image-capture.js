/**
 * Card Image Capture - html2canvas 기반 카드 PNG 다운로드
 * one-click-news lib/image-capture.ts 기반
 */

const CardImageCapture = {
    /**
     * html2canvas CDN 로드
     */
    async loadHtml2Canvas() {
        if (window.html2canvas) return window.html2canvas;

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = () => resolve(window.html2canvas);
            script.onerror = () => reject(new Error('html2canvas 로드 실패'));
            document.head.appendChild(script);
        });
    },

    /**
     * 카드 HTML을 iframe에서 렌더링 후 캡처
     */
    async captureCardFromHTML(cardHtml, width = 1080, height = 1350) {
        await this.loadHtml2Canvas();

        return new Promise((resolve, reject) => {
            // 숨겨진 iframe 생성
            const iframe = document.createElement('iframe');
            iframe.style.cssText = `position: fixed; left: -9999px; top: 0; width: ${width}px; height: ${height}px; border: none;`;
            document.body.appendChild(iframe);

            iframe.onload = async () => {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    doc.open();
                    doc.write(cardHtml);
                    doc.close();

                    // 폰트 및 스타일 로드 대기
                    await new Promise((r) => setTimeout(r, 500));

                    const canvas = await html2canvas(doc.body, {
                        width,
                        height,
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        logging: false,
                        backgroundColor: null
                    });

                    canvas.toBlob(
                        (blob) => {
                            document.body.removeChild(iframe);
                            if (blob) resolve(blob);
                            else reject(new Error('캔버스 변환 실패'));
                        },
                        'image/png',
                        1.0
                    );
                } catch (err) {
                    document.body.removeChild(iframe);
                    reject(err);
                }
            };

            // iframe 로드 트리거
            iframe.srcdoc = cardHtml;
        });
    },

    /**
     * 카드 PNG Blob 다운로드
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * 카드 HTML → PNG Blob 반환 (SNS 공유 등에서 사용)
     * @param {Object} card - 카드 객체
     * @param {number} cardNumber - 카드 번호 (파일명용)
     * @param {string} [currentHtml] - 수정 반영된 현재 HTML
     * @returns {Promise<Blob>}
     */
    async getCardAsPNGBlob(card, cardNumber, currentHtml) {
        const htmlToCapture = (typeof currentHtml === 'string' && currentHtml.length > 0) ? currentHtml : card.html;
        return this.captureCardFromHTML(htmlToCapture, 1080, 1350);
    },

    /**
     * 카드 HTML → PNG 다운로드 (메인 함수)
     * @param {Object} card - 카드 객체 (card.html은 수정 전 원본)
     * @param {number} cardNumber - 카드 번호 (파일명용)
     * @param {string} [currentHtml] - 수정 반영된 현재 HTML (있으면 이걸로 캡처, 없으면 card.html 사용)
     */
    async downloadCardAsPNG(card, cardNumber, currentHtml) {
        try {
            console.log(`🖼️ 카드 ${cardNumber} PNG 캡처 시작...`);
            const blob = await this.getCardAsPNGBlob(card, cardNumber, currentHtml);
            this.downloadBlob(blob, `segye_card_${cardNumber}.png`);

            this.showNotification(`✓ 카드 ${cardNumber} PNG 다운로드 완료!`);
            console.log(`✅ 카드 ${cardNumber} PNG 다운로드 완료`);
        } catch (error) {
            console.error(`❌ 카드 ${cardNumber} PNG 캡처 실패:`, error);
            alert('PNG 캡처에 실패했습니다. HTML 다운로드를 이용해주세요.');
        }
    },

    /**
     * 모든 카드 PNG 다운로드 (ZIP 없이 개별 다운로드)
     * @param {Array} cards - 카드 배열
     * @param {Function} [getHtmlForIndex] - (index) => 현재 HTML 문자열 또는 null. 있으면 수정 반영된 HTML 사용
     */
    async downloadAllCardsAsPNG(cards, getHtmlForIndex) {
        console.log(`📦 전체 ${cards.length}장 PNG 다운로드 시작...`);
        for (let i = 0; i < cards.length; i++) {
            const currentHtml = typeof getHtmlForIndex === 'function' ? getHtmlForIndex(i) : null;
            await this.downloadCardAsPNG(cards[i], i + 1, currentHtml);
            await new Promise((r) => setTimeout(r, 300));
        }
        this.showNotification(`✓ 전체 ${cards.length}장 PNG 다운로드 완료!`);
    },

    /**
     * 알림 표시
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem; background: linear-gradient(135deg, #10B981, #059669); color: white; border-radius: 12px; font-size: 0.95rem; font-weight: 600; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4); z-index: 10001; animation: slideUp 0.3s ease; display: flex; align-items: center; gap: 0.75rem;`;
        notification.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
};

// 전역 노출
window.CardImageCapture = CardImageCapture;
