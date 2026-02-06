/**
 * Error Handler
 * 사용자 친화적인 에러 처리 시스템
 */

const ErrorHandler = {
    /**
     * 에러 메시지 표시
     */
    showError(title, message, details = null) {
        // 에러 모달 생성
        const modal = document.createElement('div');
        modal.className = 'error-modal';
        modal.innerHTML = `
            <div class="error-overlay"></div>
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <h3 class="error-title">${title}</h3>
                <p class="error-message">${message}</p>
                ${details ? `
                    <details class="error-details">
                        <summary>기술 정보 (개발자용)</summary>
                        <pre>${details}</pre>
                    </details>
                ` : ''}
                <div class="error-actions">
                    <button class="btn-primary error-close">확인</button>
                    <button class="btn-secondary error-reload">새로고침</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 애니메이션
        setTimeout(() => modal.classList.add('show'), 10);
        
        // 이벤트 리스너
        modal.querySelector('.error-close').addEventListener('click', () => {
            this.closeError(modal);
        });
        
        modal.querySelector('.error-reload').addEventListener('click', () => {
            location.reload();
        });
        
        modal.querySelector('.error-overlay').addEventListener('click', () => {
            this.closeError(modal);
        });
    },
    
    /**
     * 에러 모달 닫기
     */
    closeError(modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    },
    
    /**
     * 일반 에러 처리
     */
    handleError(error, context = '작업') {
        console.error(`❌ ${context} 오류:`, error);
        
        let title = '오류 발생';
        let message = '작업 중 오류가 발생했습니다.';
        let details = error.stack || error.toString();
        
        // 네트워크 에러 체크 (백엔드 서버 미실행)
        const isNetworkError = 
            error.message.includes('Failed to fetch') ||
            error.message.includes('Network') ||
            error.message.includes('fetch') ||
            error.name === 'TypeError' ||
            error.message.includes('서버') || 
            error.message.includes('연결');
        
        // 에러 유형별 처리
        if (isNetworkError) {
            title = '백엔드 서버 미실행';
            message = `백엔드 서버에 연결할 수 없습니다.

📌 해결 방법:

1️⃣ Mock 모드로 계속 사용 (데모 데이터)
   → 시스템이 자동으로 Mock 모드로 전환했습니다.

2️⃣ 백엔드 서버 실행 (실제 AI)
   → backend 폴더에서:
   • Node.js: npm install && npm start
   • Python: pip install -r requirements.txt && python server.py
   → 서버 실행 후 페이지 새로고침`;
            
            // 자동으로 창 닫기 (5초 후)
            setTimeout(() => {
                const modal = document.querySelector('.error-modal');
                if (modal) this.closeError(modal);
            }, 5000);
            
        } else if (error.message.includes('API 키')) {
            title = 'AI 설정 필요';
            message = 'AI API 키가 설정되지 않았습니다. 우측 상단 ⚙️ 버튼을 눌러 API 키를 입력해주세요.';
        } else if (error.message.includes('timeout') || error.message.includes('초과')) {
            title = '시간 초과';
            message = '요청 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.';
        } else if (error.message.includes('URL')) {
            title = 'URL 오류';
            message = '올바른 URL을 입력해주세요.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            title = '인증 오류';
            message = 'API 키가 유효하지 않습니다. AI 설정을 확인해주세요.';
        } else if (error.message.includes('429')) {
            title = '요청 한도 초과';
            message = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
            title = '서버 오류';
            message = '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
        
        this.showError(title, message, details);
    },
    
    /**
     * 백엔드 API 에러 처리
     */
    handleAPIError(error, endpoint) {
        console.error(`❌ API 오류 [${endpoint}]:`, error);
        
        const title = 'API 오류';
        let message = '서버 API 호출 중 오류가 발생했습니다.';
        
        if (error.message.includes('Network')) {
            message = '네트워크 연결을 확인해주세요.';
        } else if (error.message.includes('CORS')) {
            message = 'CORS 정책 문제가 발생했습니다. 서버 설정을 확인해주세요.';
        }
        
        this.showError(title, message, `Endpoint: ${endpoint}\nError: ${error.message}`);
    },
    
    /**
     * 성공 메시지 표시
     */
    showSuccess(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <div class="toast-icon">✅</div>
            <div class="toast-message">${message}</div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    /**
     * 로딩 표시
     */
    showLoading(message = '처리 중...') {
        const existing = document.querySelector('.loading-overlay');
        if (existing) {
            existing.remove();
        }
        
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        `;
        
        document.body.appendChild(loading);
        setTimeout(() => loading.classList.add('show'), 10);
        
        return loading;
    },
    
    /**
     * 로딩 숨기기
     */
    hideLoading() {
        const loading = document.querySelector('.loading-overlay');
        if (loading) {
            loading.classList.remove('show');
            setTimeout(() => loading.remove(), 300);
        }
    }
};

// 전역 에러 핸들러
window.addEventListener('error', (event) => {
    console.error('전역 에러:', event.error);
    // 개발 환경에서만 표시
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        ErrorHandler.handleError(event.error, '전역');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('처리되지 않은 Promise 거부:', event.reason);
    // 개발 환경에서만 표시
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        ErrorHandler.handleError(event.reason, 'Promise');
    }
});

// 전역 객체로 노출
window.ErrorHandler = ErrorHandler;
