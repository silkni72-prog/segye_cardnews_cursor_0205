// 백엔드 API 연동 스크립트 - 프리미엄 디자인 버전
// 페이지가 서버에서 열렸을 때 같은 출처로 요청해 서버 연결 성공하도록 함
function getBackendUrl() {
    if (typeof window !== 'undefined' && window.location && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
        return window.location.origin;
    }
    return 'http://localhost:3000';
}
const BACKEND_URL = getBackendUrl();

// 백엔드 연결 확인
async function checkBackendConnection() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/health`);
        const data = await response.json();
        
        if (data.status === 'ok') {
            console.log('✅ 백엔드 서버 연결 성공!');
            console.log('백엔드 URL:', BACKEND_URL);
            console.log('API 버전:', data.version);
            return true;
        }
    } catch (error) {
        console.error('❌ 백엔드 서버 연결 실패:', error);
        return false;
    }
}

// 카드뉴스 생성 API 호출 (옵션 없음)
async function generateCardNews(url) {
    return generateCardNewsWithOptions(url, null);
}

// 카드뉴스 생성 API 호출 (옵션 포함, 1차 적용 재생성용)
async function generateCardNewsWithOptions(url, options) {
    try {
        console.log('🚀 카드뉴스 생성 요청 시작...');
        console.log('📰 URL:', url);
        if (options) console.log('⚙️ 옵션:', options);

        const response = await fetch(`${BACKEND_URL}/api/cardnews/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url, options: options || undefined })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ 카드뉴스 생성 완료!');
            console.log('📊 카드 개수:', result.data.cardnews.cardCount);
            return result.data;
        } else {
            throw new Error(result.error || '카드뉴스 생성 실패');
        }

    } catch (error) {
        console.error('❌ 카드뉴스 생성 오류:', error);
        throw error;
    }
}

// style 문자열에서 color를 #hex 형태로 추출 (rgb/rgba는 hex로 변환)
function parseColorFromStyle(styleStr) {
    if (!styleStr) return '';
    const hexMatch = styleStr.match(/color:\s*#([0-9a-fA-F]{3,8})\s*[;}]/);
    if (hexMatch) return '#' + hexMatch[1];
    const rgbMatch = styleStr.match(/color:\s*rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10); const g = parseInt(rgbMatch[2], 10); const b = parseInt(rgbMatch[3], 10);
        return '#' + [r, g, b].map(x => ('0' + Math.max(0, Math.min(255, x)).toString(16)).slice(-2)).join('');
    }
    const rgbSpaceMatch = styleStr.match(/color:\s*rgba?\s*\(\s*(\d+)\s+(\d+)\s+(\d+)/);
    if (rgbSpaceMatch) {
        const r = parseInt(rgbSpaceMatch[1], 10); const g = parseInt(rgbSpaceMatch[2], 10); const b = parseInt(rgbSpaceMatch[3], 10);
        return '#' + [r, g, b].map(x => ('0' + Math.max(0, Math.min(255, x)).toString(16)).slice(-2)).join('');
    }
    return '';
}

// style 문자열에서 font-size(px) 숫자만 추출
function parseFontSizeFromStyle(styleStr) {
    if (!styleStr) return '';
    const m = styleStr.match(/font-size:\s*(\d+(?:\.\d+)?)\s*px/);
    return m ? m[1] : '';
}

// style 문자열에서 font-weight 숫자 추출 (bold -> 700)
function parseFontWeightFromStyle(styleStr) {
    if (!styleStr) return '';
    const m = styleStr.match(/font-weight:\s*(\d+|bold|normal)/);
    if (!m) return '';
    const v = m[1];
    if (v === 'bold') return '700';
    if (v === 'normal') return '400';
    return String(parseInt(v, 10) || '');
}

// style 문자열에서 background(색상)를 #rrggbb 형태로 추출 (color input 호환)
function parseBackgroundColorFromStyle(styleStr) {
    if (!styleStr) return '';
    var hexMatch = styleStr.match(/\bbackground(?:-color)?:\s*#([0-9a-fA-F]{3,8})\b/);
    if (hexMatch) {
        var hex = hexMatch[1];
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        return '#' + (hex.length >= 6 ? hex.slice(0, 6) : hex);
    }
    var rgbMatch = styleStr.match(/\bbackground(?:-color)?:\s*rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
        var r = parseInt(rgbMatch[1], 10), g = parseInt(rgbMatch[2], 10), b = parseInt(rgbMatch[3], 10);
        return '#' + [r, g, b].map(function(x) { return ('0' + Math.max(0, Math.min(255, x)).toString(16)).slice(-2); }).join('');
    }
    return '';
}

// 카드 HTML에서 편집 가능 항목 추출 (생성된 카드의 실제 배경색/배경이미지와 동일하게 초기값 설정)
function parseCardEdits(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;
    const result = {
        bodyBackground: '#ffffff',
        bodyBackgroundImage: '',
        textColor: '',
        textSizePx: '',
        fontWeight: '',
        texts: {},
        images: {}
    };
    const bodyStyle = body.getAttribute('style') || '';
    const parsedBg = parseBackgroundColorFromStyle(bodyStyle);
    if (parsedBg) result.bodyBackground = parsedBg;
    const extractedBgUrl = extractBackgroundImageUrl(bodyStyle);
    if (extractedBgUrl) result.bodyBackgroundImage = extractedBgUrl.replace(/%27/g, "'").trim();
    let firstTextStyle = null;
    doc.querySelectorAll('[data-editable]').forEach(el => {
        const key = el.getAttribute('data-editable');
        if (el.tagName === 'IMG') {
            result.images[key] = el.getAttribute('src') || '';
        } else {
            // 이미지 래퍼(자식에 data-editable이 있는 div)는 텍스트 편집 제외 → innerHTML 덮어쓰기 시 img가 텍스트로 바뀌는 현상 방지
            if (el.querySelector('[data-editable]')) return;
            if (!firstTextStyle) firstTextStyle = el.getAttribute('style') || '';
            const content = el.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"').replace(/&quot;/g, '"');
            result.texts[key] = content;
        }
    });
    if (firstTextStyle) {
        result.textColor = parseColorFromStyle(firstTextStyle) || '#1e293b';
        result.textSizePx = parseFontSizeFromStyle(firstTextStyle) || '';
        result.fontWeight = parseFontWeightFromStyle(firstTextStyle) || '';
    }
    return result;
}

// style 문자열에서 마지막 배경 이미지 url(...) 추출 (proxy/긴 URL 지원: 괄호 안의 url은 끝 따옴표까지 매칭)
function extractBackgroundImageUrl(styleStr) {
    if (!styleStr || !String(styleStr).trim()) return '';
    const s = String(styleStr).trim();
    // url('...') 또는 url("...") 형태: 여는 따옴표 다음부터 닫는 따옴표 전까지 (중간 이스케이프 고려)
    const quoted = s.match(/url\s*\(\s*['"]([^'"]*)['"]\s*\)/g);
    if (quoted && quoted.length) {
        const last = quoted[quoted.length - 1];
        const inner = last.replace(/^url\s*\(\s*['"]/, '').replace(/['"]\s*\)$/, '').trim();
        if (inner && (inner.indexOf('http') === 0 || inner.indexOf('data:') === 0)) return inner;
    }
    // 따옴표 없는 url(...): 괄호 안에서 첫 ) 전까지 (기존 방식 호환)
    const unquoted = s.match(/url\s*\(\s*([^'")]+)\s*\)/g);
    if (unquoted && unquoted.length) {
        const last = unquoted[unquoted.length - 1];
        const inner = last.replace(/^url\s*\(\s*/, '').replace(/\s*\)$/, '').trim();
        if (inner && (inner.indexOf('http') === 0 || inner.indexOf('data:') === 0)) return inner;
    }
    return '';
}

// 배경 이미지 URL이 "완전한" 값인지 여부 (비어있거나 잘린 값이면 false)
function isCompleteBackgroundImageUrl(url) {
    const u = String(url || '').trim();
    if (!u) return false;
    if (u.indexOf('api/image-proxy?url=') !== -1) {
        const afterQuery = u.split('api/image-proxy?url=')[1] || '';
        if (afterQuery.length < 15) return false;
    }
    if (u.indexOf('http') === 0 || u.indexOf('data:') === 0) return u.length > 20;
    return false;
}

// 편집 내용을 카드 HTML에 반영 (카드 바탕색이 body + 내부 영역에 적용되도록)
// 배경 이미지/색은 사용자가 값을 넣었을 때만 변경하고, 비어 있으면 기존 배경 유지(제멋대로 바뀌지 않도록)
function applyCardEdits(html, edits) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;
    const style = (body.getAttribute('style') || '');
    const formBgImage = edits.bodyBackgroundImage ? String(edits.bodyBackgroundImage).trim() : '';
    const userWantsNewBgImage = formBgImage && isCompleteBackgroundImageUrl(formBgImage);
    let newStyle = style;
    // 배경 이미지: 사용자가 새 URL을 넣었을 때만 교체. 비어 있으면 기존 스타일 그대로 유지.
    if (userWantsNewBgImage) {
        newStyle = style
            .replace(/background:\s*[^;]+;?/gi, '')
            .replace(/background-image:\s*[^;]+;?/gi, '')
            .replace(/background-size:[^;]+;?/gi, '')
            .replace(/background-position:[^;]+;?/gi, '');
        const safeUrl = formBgImage.replace(/'/g, "%27");
        newStyle = 'background-image: url(\'' + safeUrl + '\'); background-size: cover; background-position: center; ' + newStyle;
    }
    const cardBgColor = (edits.bodyBackground !== undefined && edits.bodyBackground !== '') ? String(edits.bodyBackground).trim() : '';
    if (cardBgColor) {
        newStyle = newStyle
            .replace(/background:\s*[^;]+;?/gi, '')
            .replace(/background-image:\s*[^;]+;?/gi, '')
            .replace(/background-size:[^;]+;?/gi, '')
            .replace(/background-position:[^;]+;?/gi, '');
        newStyle = 'background: ' + cardBgColor + '; ' + newStyle;
        body.setAttribute('style', newStyle.trim());
        // 카드 내부 흰색/밝은 배경 영역도 같은 바탕색으로 통일 (표지 하단, 본문 영역 등)
        [].slice.call(body.querySelectorAll('div')).forEach(function (el) {
            var s = el.getAttribute('style') || '';
            if (/background:\s*#?(fff|ffffff|f8fafc|f5f4f0|f1f5f9|e2e8f0|white)\b/i.test(s) || /background:\s*rgba?\(\s*255\s*,\s*255\s*,\s*255/i.test(s)) {
                s = s.replace(/background:\s*[^;]+;?/gi, 'background: ' + cardBgColor + '; ');
                el.setAttribute('style', s.trim());
            }
        });
    } else if (newStyle !== style) {
        body.setAttribute('style', newStyle.trim());
    }
    doc.querySelectorAll('[data-editable]').forEach(el => {
        const key = el.getAttribute('data-editable');
        if (el.tagName === 'IMG') {
            if (edits.images && edits.images[key] !== undefined) el.setAttribute('src', edits.images[key]);
        } else {
            if (edits.texts && edits.texts[key] !== undefined) {
                const text = String(edits.texts[key]).replace(/\n/g, '<br/>').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                el.innerHTML = text;
            }
            // 텍스트 색상·크기·굵기 적용 (배경색에 맞춰 글자색/가독성 조정 가능)
            const applyColor = edits.textColor !== undefined && String(edits.textColor).trim() !== '';
            const applySize = edits.textSizePx !== undefined && String(edits.textSizePx).trim() !== '';
            const applyWeight = edits.fontWeight !== undefined && String(edits.fontWeight).trim() !== '';
            if (applyColor || applySize || applyWeight) {
                let s = el.getAttribute('style') || '';
                if (applyColor) {
                    s = s.replace(/\bcolor:\s*[^;]+;?/gi, '');
                    s = 'color: ' + String(edits.textColor).trim() + '; ' + s;
                }
                if (applySize) {
                    const px = String(edits.textSizePx).trim().replace(/\D/g, '') || '40';
                    s = s.replace(/\bfont-size:\s*[^;]+;?/gi, '');
                    s = 'font-size: ' + px + 'px; ' + s;
                }
                if (applyWeight) {
                    const w = String(edits.fontWeight).trim().replace(/\D/g, '') || '500';
                    s = s.replace(/\bfont-weight:\s*[^;]+;?/gi, '');
                    s = 'font-weight: ' + w + '; ' + s;
                }
                el.setAttribute('style', s.trim());
            }
        }
    });
    const doctype = doc.doctype ? '<!DOCTYPE ' + doc.doctype.name + '>\n' : '<!DOCTYPE html>\n';
    return doctype + doc.documentElement.outerHTML;
}

function sectionTitle(title) {
    const el = document.createElement('div');
    el.style.cssText = 'font-size:0.75rem;font-weight:800;color:#94a3b8;letter-spacing:0.08em;margin:1rem 0 0.6rem 0;padding-bottom:0.4rem;border-bottom:1px solid rgba(148,163,184,0.2);';
    el.textContent = title;
    return el;
}
function field(label, name, value, type, placeholder) {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '0.9rem';
    const lab = document.createElement('label');
    lab.style.cssText = 'display:block;color:#94a3b8;font-size:0.8rem;font-weight:600;margin-bottom:0.35rem;';
    lab.textContent = label;
    let input;
    if (type === 'color') {
        input = document.createElement('input');
        input.type = 'color';
        input.value = value && value.startsWith('#') ? value : '#ffffff';
        input.style.cssText = 'width:100%;height:40px;border-radius:10px;border:1px solid rgba(148,163,184,0.35);cursor:pointer;';
    } else if (type === 'number') {
        input = document.createElement('input');
        input.type = 'number';
        input.min = '12';
        input.max = '120';
        input.value = value || '';
        input.placeholder = placeholder || '';
        input.style.cssText = 'width:100%;padding:0.6rem 0.75rem;border-radius:10px;border:1px solid rgba(148,163,184,0.35);background:#0f172a;color:#e2e8f0;font-size:0.9rem;box-sizing:border-box;';
    } else if (type === 'textarea') {
        input = document.createElement('textarea');
        input.value = value || '';
        input.rows = 2;
        input.style.cssText = 'width:100%;padding:0.6rem 0.75rem;border-radius:10px;border:1px solid rgba(148,163,184,0.35);background:#0f172a;color:#e2e8f0;font-size:0.9rem;resize:vertical;box-sizing:border-box;';
    } else {
        input = document.createElement('input');
        input.type = type || 'text';
        input.value = value || '';
        input.placeholder = placeholder || '';
        input.style.cssText = 'width:100%;padding:0.6rem 0.75rem;border-radius:10px;border:1px solid rgba(148,163,184,0.35);background:#0f172a;color:#e2e8f0;font-size:0.9rem;box-sizing:border-box;';
    }
    input.name = name;
    wrap.appendChild(lab);
    wrap.appendChild(input);
    return wrap;
}

// 배경 이미지: 첨부파일 업로드 필드 (파일 선택 → data URL로 저장, form의 bodyBackgroundImage로 수집)
function fieldBackgroundImageUpload(labelText, name, initialValue, form) {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '0.9rem';
    const lab = document.createElement('label');
    lab.style.cssText = 'display:block;color:#94a3b8;font-size:0.8rem;font-weight:600;margin-bottom:0.35rem;';
    lab.textContent = labelText;
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = name;
    hidden.value = initialValue || '';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.cssText = 'width:100%;padding:0.5rem 0.75rem;border-radius:10px;border:1px solid rgba(148,163,184,0.35);background:#0f172a;color:#e2e8f0;font-size:0.85rem;box-sizing:border-box;';
    fileInput.onchange = function() {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function() {
            hidden.value = reader.result || '';
            if (form) form.dispatchEvent(new Event('change', { bubbles: true }));
        };
        reader.readAsDataURL(file);
    };
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:0.5rem;align-items:center;margin-top:0.35rem;';
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.textContent = '기존 유지';
    clearBtn.style.cssText = 'padding:0.5rem 0.75rem;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:rgba(148,163,184,0.15);color:#94a3b8;font-size:0.8rem;font-weight:600;cursor:pointer;flex-shrink:0;';
    clearBtn.onclick = function() {
        hidden.value = '';
        fileInput.value = '';
        if (form) form.dispatchEvent(new Event('change', { bubbles: true }));
    };
    row.appendChild(fileInput);
    row.appendChild(clearBtn);
    wrap.appendChild(lab);
    wrap.appendChild(hidden);
    wrap.appendChild(row);
    return wrap;
}

// 메인/일반 이미지: 첨부파일 업로드 필드 (name으로 form 수집, img_xxx 또는 bodyBackgroundImage 등)
function fieldImageUpload(labelText, name, initialValue, form) {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '0.9rem';
    const lab = document.createElement('label');
    lab.style.cssText = 'display:block;color:#94a3b8;font-size:0.8rem;font-weight:600;margin-bottom:0.35rem;';
    lab.textContent = labelText;
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = name;
    hidden.value = initialValue || '';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.cssText = 'width:100%;padding:0.5rem 0.75rem;border-radius:10px;border:1px solid rgba(148,163,184,0.35);background:#0f172a;color:#e2e8f0;font-size:0.85rem;box-sizing:border-box;';
    fileInput.onchange = function() {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function() {
            hidden.value = reader.result || '';
            if (form) form.dispatchEvent(new Event('change', { bubbles: true }));
        };
        reader.readAsDataURL(file);
    };
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:0.5rem;align-items:center;margin-top:0.35rem;';
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.textContent = '기존 유지';
    clearBtn.style.cssText = 'padding:0.5rem 0.75rem;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:rgba(148,163,184,0.15);color:#94a3b8;font-size:0.8rem;font-weight:600;cursor:pointer;flex-shrink:0;';
    clearBtn.onclick = function() {
        hidden.value = '';
        fileInput.value = '';
        if (form) form.dispatchEvent(new Event('change', { bubbles: true }));
    };
    row.appendChild(fileInput);
    row.appendChild(clearBtn);
    wrap.appendChild(lab);
    wrap.appendChild(hidden);
    wrap.appendChild(row);
    return wrap;
}

// 폼 값으로 newEdits 객체 생성
function collectEditsFromForm(form, editsKeys) {
    const formData = new FormData(form);
    const newEdits = {
        bodyBackground: formData.get('bodyBackground') || '',
        bodyBackgroundImage: (formData.get('bodyBackgroundImage') || '').trim(),
        textColor: (formData.get('textColor') || '').trim(),
        textSizePx: (formData.get('textSizePx') || '').trim(),
        fontWeight: (formData.get('fontWeight') || '').trim(),
        texts: {},
        images: {}
    };
    if (editsKeys.texts) editsKeys.texts.forEach(key => { const v = formData.get('text_' + key); if (v != null) newEdits.texts[key] = v; });
    if (editsKeys.images) editsKeys.images.forEach(key => { const v = formData.get('img_' + key); if (v != null) newEdits.images[key] = v; });
    return newEdits;
}

// 카드 편집 모달 열기 (실시간 미리보기: 입력/변경 시 카드 iframe에 즉시 반영)
function openCardEditor(card, cardNumber, iframe, cardElement) {
    const baseHtml = card.html; // 모달을 연 시점의 HTML을 기준으로 실시간 반영
    const edits = parseCardEdits(baseHtml);
    const editsKeys = { texts: Object.keys(edits.texts), images: Object.keys(edits.images) };

    const modal = document.createElement('div');
    modal.id = 'cardEditorModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.85);z-index:10002;display:flex;align-items:center;justify-content:center;padding:1.5rem;overflow-y:auto;font-family:\'Noto Sans KR\',sans-serif;';
    const panel = document.createElement('div');
    panel.style.cssText = 'background:#1e293b;border-radius:16px;max-width:480px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 24px 48px rgba(0,0,0,0.4);border:1px solid rgba(148,163,184,0.15);';
    const titleRow = document.createElement('div');
    titleRow.style.cssText = 'padding:1.25rem 1.5rem;border-bottom:1px solid rgba(148,163,184,0.2);display:flex;justify-content:space-between;align-items:center;';
    titleRow.innerHTML = '<h3 style="margin:0;color:#f8fafc;font-size:1.15rem;font-weight:800;">카드 ' + cardNumber + ' 편집</h3><button type="button" id="cardEditorClose" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1.4rem;line-height:1;">&times;</button>';
    const form = document.createElement('form');
    form.style.cssText = 'padding:1rem 1.5rem 1.5rem;';
    form.appendChild(sectionTitle('디자인'));
    form.appendChild(field('카드 배경색', 'bodyBackground', edits.bodyBackground, 'color'));
    form.appendChild(fieldBackgroundImageUpload('배경 이미지', 'bodyBackgroundImage', edits.bodyBackgroundImage, form));
    form.appendChild(sectionTitle('글자'));
    form.appendChild(field('텍스트 색상', 'textColor', edits.textColor, 'color'));
    form.appendChild(field('텍스트 크기 (px)', 'textSizePx', edits.textSizePx, 'number', '예: 40 (비우면 유지)'));
    if (editsKeys.texts.length > 0) {
        form.appendChild(sectionTitle('텍스트'));
        editsKeys.texts.forEach(key => {
            form.appendChild(field(key.replace(/-/g, ' '), 'text_' + key, edits.texts[key], 'textarea'));
        });
    }
    if (editsKeys.images && editsKeys.images.length > 0) {
        form.appendChild(sectionTitle('이미지'));
        editsKeys.images.forEach(key => {
            form.appendChild(fieldImageUpload(key.replace(/-/g, ' ') + ' (메인 이미지)', 'img_' + key, edits.images[key], form));
        });
    }
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:0.75rem;margin-top:1.25rem;';
    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.textContent = '적용';
    saveBtn.style.cssText = 'flex:1;padding:0.85rem 1.25rem;background:#c41e3a;border:none;border-radius:10px;color:#fff;font-weight:700;cursor:pointer;font-size:0.95rem;';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = '취소';
    cancelBtn.style.cssText = 'padding:0.85rem 1.25rem;background:rgba(148,163,184,0.2);border:1px solid rgba(148,163,184,0.3);border-radius:10px;color:#e2e8f0;cursor:pointer;font-size:0.95rem;';
    cancelBtn.onclick = () => modal.remove();
    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);
    form.appendChild(btnRow);

    // 실시간 미리보기: 폼 값 변경 시 카드 iframe에 즉시 반영
    function updateLivePreview() {
        const newEdits = collectEditsFromForm(form, editsKeys);
        const newHtml = applyCardEdits(baseHtml, newEdits);
        iframe.setAttribute('srcdoc', newHtml);
    }
    form.addEventListener('input', updateLivePreview);
    form.addEventListener('change', updateLivePreview);

    form.onsubmit = (e) => {
        e.preventDefault();
        const newEdits = collectEditsFromForm(form, editsKeys);
        const newHtml = applyCardEdits(baseHtml, newEdits);
        card.html = newHtml;
        iframe.setAttribute('srcdoc', newHtml);
        modal.remove();
    };
    panel.appendChild(titleRow);
    panel.appendChild(form);
    modal.appendChild(panel);
    titleRow.querySelector('#cardEditorClose').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    panel.onclick = (e) => e.stopPropagation();
    document.body.appendChild(modal);
}

// 텍스트 편집 키 → 구역명(섹션 제목)
var TEXT_SECTION_MAP = {
    headline: '제목 · 헤드라인',
    'beforeafter-title': '제목 · 헤드라인',
    quote: '인용 · 핵심 문장',
    'context-keyline': '인용 · 핵심 문장',
    'expert-line': '인용 · 핵심 문장',
    'closing-cta': '인용 · 핵심 문장',
    author: '보조 · 출처',
    context: '보조 · 출처',
    'core-problem': '문제점',
    'card4-key-sentence': '핵심 문장',
    'card4-explanation': '해설 문장',
    'why-keywords': '키워드',
    'why-desc': '설명',
    'before-val': '데이터 · 값',
    'after-val': '데이터 · 값'
};
function getTextSection(key) { return TEXT_SECTION_MAP[key] || '기타 텍스트'; }
function getTextFieldLabel(key) {
    var labels = {
        headline: '헤드라인',
        'beforeafter-title': '변화 제목',
        quote: '인용문',
        'context-keyline': '핵심 멘트',
        'expert-line': '전문가 한줄',
        'closing-cta': '마무리 문구',
        author: '발언자',
        context: '상황 설명',
        'core-problem': '문제점 설명',
        'card4-key-sentence': '핵심 문장',
        'card4-explanation': '해설 문장',
        'why-keywords': '키워드',
        'why-desc': '왜 중요한가',
        'before-val': 'BEFORE 값',
        'after-val': 'AFTER 값'
    };
    return labels[key] || key.replace(/-/g, ' ');
}

// 인라인 편집 패널 빌드 (오른쪽 영역용, 적용 시 모달 닫기 없이 카드/iframe만 갱신)
function buildCardEditPanel(container, card, cardNumber, mainIframe, thumbIframe) {
    container.innerHTML = '';
    const baseHtml = card.html;
    const edits = parseCardEdits(baseHtml);
    const editsKeys = { texts: Object.keys(edits.texts), images: Object.keys(edits.images) };
    const panelTitle = document.createElement('div');
    panelTitle.style.cssText = 'font-size:0.8rem;font-weight:800;color:#e2e8f0;margin:1rem 0 0.5rem 0;padding-bottom:0.4rem;border-bottom:1px solid rgba(148,163,184,0.3);';
    panelTitle.textContent = '카드 ' + cardNumber + ' 편집';
    container.appendChild(panelTitle);
    const form = document.createElement('form');
    form.style.cssText = 'padding:0.75rem 0;';
    form.appendChild(sectionTitle('디자인'));
    form.appendChild(field('카드 배경색', 'bodyBackground', edits.bodyBackground, 'color'));
    form.appendChild(fieldBackgroundImageUpload('배경 이미지', 'bodyBackgroundImage', edits.bodyBackgroundImage, form));
    form.appendChild(sectionTitle('글자'));
    form.appendChild(field('텍스트 색상', 'textColor', edits.textColor, 'color'));
    form.appendChild(field('텍스트 크기 (px)', 'textSizePx', edits.textSizePx, 'number', '예: 40'));
    const weightMap = { '300': 1, '400': 2, '500': 3, '700': 4, '900': 5 };
    const currentWeight = edits.fontWeight || '500';
    const weightLevel = weightMap[currentWeight] || 3;
    const weightWrap = document.createElement('div');
    weightWrap.style.cssText = 'margin-bottom:0.9rem;display:flex;align-items:center;gap:0.25rem;flex-wrap:wrap;';
    const weightLab = document.createElement('label');
    weightLab.style.cssText = 'display:block;color:#94a3b8;font-size:0.8rem;font-weight:600;margin-bottom:0.35rem;width:100%;';
    weightLab.textContent = '굵기';
    weightWrap.appendChild(weightLab);
    const weightHidden = document.createElement('input');
    weightHidden.type = 'hidden';
    weightHidden.name = 'fontWeight';
    weightHidden.value = currentWeight;
    weightWrap.appendChild(weightHidden);
    const dotValues = ['300', '400', '500', '700', '900'];
    const dotSizes = [12, 14, 17, 20, 24];
    dotValues.forEach(function(val, idx) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.textContent = '●';
        var sz = dotSizes[idx];
        dot.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;padding:0;border:none;background:none;cursor:pointer;font-size:' + (sz - 2) + 'px;line-height:1;display:flex;align-items:center;justify-content:center;color:' + (idx < weightLevel ? '#c4b5fd' : 'rgba(148,163,184,0.35)') + ';transition:color 0.2s;';
        dot.onclick = function() { weightHidden.value = val; weightWrap.querySelectorAll('button').forEach(function(b, i) { b.style.color = i <= idx ? '#c4b5fd' : 'rgba(148,163,184,0.35)'; }); form.dispatchEvent(new Event('change', { bubbles: true })); };
        weightWrap.appendChild(dot);
    });
    form.appendChild(weightWrap);
    var textKeysBySection = {};
    editsKeys.texts.forEach(function(key) {
        var section = getTextSection(key);
        if (!textKeysBySection[section]) textKeysBySection[section] = [];
        textKeysBySection[section].push(key);
    });
    var sectionOrder = ['제목 · 헤드라인', '인용 · 핵심 문장', '보조 · 출처', '문제점', '키워드', '설명', '데이터 · 값', '기타 텍스트'];
    sectionOrder.forEach(function(sectionName) {
        var keys = textKeysBySection[sectionName];
        if (!keys || keys.length === 0) return;
        form.appendChild(sectionTitle(sectionName));
        keys.forEach(function(key) {
            form.appendChild(field(getTextFieldLabel(key), 'text_' + key, edits.texts[key], 'textarea'));
        });
    });
    if (editsKeys.images && editsKeys.images.length > 0) {
        form.appendChild(sectionTitle('이미지'));
        editsKeys.images.forEach(function(key) {
            form.appendChild(fieldImageUpload(key.replace(/-/g, ' ') + ' (메인 이미지)', 'img_' + key, edits.images[key], form));
        });
    }
    const applyBtn = document.createElement('button');
    applyBtn.type = 'submit';
    applyBtn.textContent = '적용';
    applyBtn.style.cssText = 'width:100%;margin-top:0.75rem;padding:0.75rem;background:#c41e3a;border:none;border-radius:10px;color:#fff;font-weight:700;cursor:pointer;font-size:0.9rem;';
    form.appendChild(applyBtn);
    function updatePreview() {
        const newEdits = collectEditsFromForm(form, editsKeys);
        const newHtml = applyCardEdits(baseHtml, newEdits);
        mainIframe.setAttribute('srcdoc', newHtml);
        if (thumbIframe) thumbIframe.setAttribute('srcdoc', newHtml);
    }
    form.addEventListener('input', updatePreview);
    form.addEventListener('change', updatePreview);
    form.onsubmit = function(e) {
        e.preventDefault();
        const newEdits = collectEditsFromForm(form, editsKeys);
        const newHtml = applyCardEdits(baseHtml, newEdits);
        card.html = newHtml;
        mainIframe.setAttribute('srcdoc', newHtml);
        if (thumbIframe) thumbIframe.setAttribute('srcdoc', newHtml);
    };
    container.appendChild(form);
}

// 프리미엄 카드뉴스 표시 함수 — 레이아웃: ① 헤더 | ② 카드 목록 | ③ 카드 편집 영역. sourceUrl 있으면 1차 적용 시 재생성에 사용.
function displayCardNews(cardnewsData, sourceUrl) {
    if (sourceUrl) cardnewsData.sourceUrl = sourceUrl;
    console.log('🎨 카드뉴스 표시 시작...');
    const existingViewer = document.getElementById('cardnewsViewer');
    if (existingViewer) {
        existingViewer.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => existingViewer.remove(), 300);
        return;
    }
    if (!document.getElementById('cardnewsViewerStyles')) {
        const style = document.createElement('style');
        style.id = 'cardnewsViewerStyles';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
            .cardnews-viewer-scrollbar::-webkit-scrollbar { width: 8px; }
            .cardnews-viewer-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 4px; }
            .cardnews-viewer-scrollbar::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.4); border-radius: 4px; }
            .card-list-thumb { position:absolute;top:0;left:0;width:1080px;height:1350px;transform-origin:top left;border:none;pointer-events:none; }
        `;
        document.head.appendChild(style);
    }
    const cards = cardnewsData.cardnews.cards;
    let selectedIndex = 0;
    const viewer = document.createElement('div');
    viewer.id = 'cardnewsViewer';
    viewer.className = 'cardnews-viewer-scrollbar';
    viewer.style.cssText = 'position:fixed;inset:0;background:#0f172a;z-index:9999;display:flex;flex-direction:column;font-family:\'Pretendard\',\'Noto Sans KR\',sans-serif;animation:fadeIn 0.4s ease;';
    // ① 헤더 : 카드뉴스 컨트롤 바 (구성 + 전체 톤 / 카드 개수 / SNS 규격)
    const header = document.createElement('div');
    header.style.cssText = 'flex-shrink:0;padding:1.5rem 1.5rem;min-height:0;background:#1e293b;border-bottom:1px solid rgba(148,163,184,0.2);';
    const titleRow = document.createElement('div');
    titleRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.35rem;margin-bottom:1.35rem;';
    const titleLeft = document.createElement('div');
    titleLeft.style.cssText = 'display:flex;align-items:center;gap:1.125rem;flex-wrap:wrap;min-width:0;flex:1;';
    titleLeft.innerHTML = '<span style="font-size:1.43rem;font-weight:800;color:#94a3b8;letter-spacing:0.02em;">SEGYE.ON</span><span style="width:1px;height:1.65rem;background:rgba(148,163,184,0.4);flex-shrink:0;"></span>';
    const titleEl = document.createElement('h2');
    titleEl.style.cssText = 'font-size:1.73rem;font-weight:800;color:#f8fafc;margin:0;line-height:1.5;letter-spacing:-0.02em;cursor:pointer;padding:0.75rem 0.9rem;border-radius:9px;border:1px solid transparent;max-width:min(720px,75vw);min-width:0;flex:1;display:flex;align-items:center;flex-wrap:nowrap;min-height:3.38rem;overflow:hidden;';
    const titleTextWrap = document.createElement('span');
    titleTextWrap.style.cssText = 'display:inline-flex;align-items:center;gap:0.35rem;flex-wrap:nowrap;min-width:0;flex:1;overflow:hidden;';
    const titleTextSpan = document.createElement('span');
    titleTextSpan.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;';
    titleTextSpan.appendChild(document.createTextNode(cardnewsData.article.title || '카드뉴스 제목'));
    titleTextWrap.appendChild(titleTextSpan);
    const editIcon = document.createElement('span');
    editIcon.setAttribute('aria-hidden', 'true');
    editIcon.title = '제목 수정';
    editIcon.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;flex-shrink:0;border-radius:6px;background:rgba(148,163,184,0.25);border:1px solid rgba(148,163,184,0.4);color:#e2e8f0;';
    editIcon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    titleTextWrap.appendChild(editIcon);
    titleEl.appendChild(titleTextWrap);
    titleEl.title = '클릭하여 제목 수정';
    titleEl.onclick = function() {
        const newTitle = prompt('카드뉴스 제목', cardnewsData.article.title || '');
        if (newTitle === null) return;
        const v = newTitle.trim();
        if (v !== '') { cardnewsData.article.title = v; titleTextSpan.textContent = v; }
    };
    titleEl.onmouseover = () => { titleEl.style.background = 'rgba(148,163,184,0.15)'; titleEl.style.borderColor = 'rgba(148,163,184,0.3)'; };
    titleEl.onmouseout = () => { titleEl.style.background = 'transparent'; titleEl.style.borderColor = 'transparent'; };
    titleLeft.appendChild(titleEl);
    titleRow.appendChild(titleLeft);
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '닫기';
    closeBtn.style.cssText = 'padding:0.5rem 1rem;background:rgba(248,250,252,0.1);border:1px solid rgba(248,250,252,0.3);border-radius:8px;color:#f8fafc;font-size:0.85rem;font-weight:600;cursor:pointer;flex-shrink:0;';
    closeBtn.onclick = () => { viewer.style.animation = 'fadeOut 0.3s ease'; setTimeout(() => viewer.remove(), 300); };
    titleRow.appendChild(closeBtn);
    header.appendChild(titleRow);
    const tagsRow = document.createElement('div');
    tagsRow.style.cssText = 'display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;margin-bottom:1.125rem;';
    const tagLabel = document.createElement('span');
    tagLabel.style.cssText = 'font-size:0.8rem;color:#94a3b8;font-weight:600;';
    tagLabel.textContent = '핵심 키워드:';
    tagsRow.appendChild(tagLabel);
    const rawKeywords = Array.isArray(cardnewsData.article.keywords) ? cardnewsData.article.keywords : [];
    const tagPills = rawKeywords.slice(0, 5).map(function(k) {
        const s = String(k).trim();
        return s.startsWith('#') ? s : '#' + s;
    });
    tagPills.push('#세계일보');
    tagPills.forEach(function(t) {
        const pill = document.createElement('span');
        pill.style.cssText = 'padding:0.35rem 0.75rem;background:#334155;color:#e2e8f0;border-radius:8px;font-size:0.8rem;font-weight:600;';
        pill.textContent = t.startsWith('#') ? t : '#' + t;
        tagsRow.appendChild(pill);
    });
    header.appendChild(tagsRow);
    const sep = document.createElement('div');
    sep.style.cssText = 'height:1px;background:rgba(148,163,184,0.2);margin-bottom:1.125rem;';
    header.appendChild(sep);
    const controlsRow = document.createElement('div');
    controlsRow.style.cssText = 'display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;';
    const toneBlock = document.createElement('div');
    toneBlock.style.cssText = 'display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;';
    toneBlock.innerHTML = '<span style="font-size:0.8rem;font-weight:700;color:#94a3b8;white-space:nowrap;">전체 톤</span>';
    var selectedToneValue = 0;
    var savedTone = (cardnewsData.defaults && cardnewsData.defaults.tone != null) ? Number(cardnewsData.defaults.tone) : 0;
    if (savedTone <= 33) selectedToneValue = 0;
    else if (savedTone <= 66) selectedToneValue = 50;
    else selectedToneValue = 100;
    [{ label: '정보형', value: 0 }, { label: '이슈형', value: 50 }, { label: '감정형', value: 100 }].forEach(function(opt) {
        var isSelected = (opt.value === selectedToneValue);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = opt.label;
        btn.dataset.toneValue = String(opt.value);
        btn.style.cssText = 'padding:0.35rem 0.7rem;border-radius:8px;font-size:0.8rem;font-weight:700;cursor:pointer;border:1px solid rgba(148,163,184,0.3);background:' + (isSelected ? 'rgba(139,92,246,0.4)' : 'transparent') + ';color:' + (isSelected ? '#e9d5ff' : '#94a3b8') + ';';
        btn.onclick = function() {
            selectedToneValue = opt.value;
            toneBlock.querySelectorAll('button[data-tone-value]').forEach(function(b) {
                var v = Number(b.dataset.toneValue);
                b.style.background = (v === selectedToneValue) ? 'rgba(139,92,246,0.4)' : 'transparent';
                b.style.color = (v === selectedToneValue) ? '#e9d5ff' : '#94a3b8';
            });
        };
        toneBlock.appendChild(btn);
    });
    controlsRow.appendChild(toneBlock);
    const countBlock = document.createElement('div');
    countBlock.style.cssText = 'display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;';
    countBlock.innerHTML = '<span style="font-size:0.8rem;font-weight:700;color:#94a3b8;white-space:nowrap;">카드 개수</span>';
    let currentCount = cardnewsData.cardnews.cardCount || 7;
    if (currentCount !== 5 && currentCount !== 7) currentCount = 7;
    [5, 7].forEach(function(n) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = n + '장';
        btn.style.cssText = 'padding:0.35rem 0.7rem;border-radius:8px;font-size:0.8rem;font-weight:700;cursor:pointer;border:1px solid rgba(148,163,184,0.3);background:' + (n === currentCount ? 'rgba(139,92,246,0.4)' : 'transparent') + ';color:' + (n === currentCount ? '#e9d5ff' : '#94a3b8') + ';';
        btn.onclick = function() { currentCount = n; countBlock.querySelectorAll('button').forEach(function(b) { b.style.background = b.textContent === n + '장' ? 'rgba(139,92,246,0.4)' : 'transparent'; b.style.color = b.textContent === n + '장' ? '#e9d5ff' : '#94a3b8'; }); };
        countBlock.appendChild(btn);
    });
    controlsRow.appendChild(countBlock);
    const snsBlock = document.createElement('div');
    snsBlock.style.cssText = 'display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;';
    snsBlock.innerHTML = '<span style="font-size:0.8rem;font-weight:700;color:#94a3b8;white-space:nowrap;">SNS 규격</span>';
    const snsFormats = [{ id: '4:5', label: '4:5' }, { id: '1:1', label: '1:1' }, { id: '9:16', label: '9:16' }];
    snsFormats.forEach(function(f, idx) {
        const label = document.createElement('label');
        label.style.cssText = 'display:flex;align-items:center;gap:0.35rem;font-size:0.8rem;color:#cbd5e1;cursor:pointer;';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.dataset.format = f.id;
        cb.style.cssText = 'accent-color:#8b5cf6;cursor:pointer;';
        if (idx === 0) cb.checked = true;
        cb.addEventListener('change', function() {
            if (cb.checked) {
                snsBlock.querySelectorAll('input[data-format]').forEach(function(other) { if (other !== cb) other.checked = false; });
            }
        });
        label.appendChild(cb);
        label.appendChild(document.createTextNode(f.label));
        snsBlock.appendChild(label);
    });
    controlsRow.appendChild(snsBlock);
    header.appendChild(controlsRow);
    // 텍스트 옵션 행
    const textOptRow = document.createElement('div');
    textOptRow.style.cssText = 'display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid rgba(148,163,184,0.15);';
    textOptRow.innerHTML = '<span style="font-size:0.8rem;font-weight:700;color:#94a3b8;white-space:nowrap;">텍스트 옵션</span>';
    const weightBlock = document.createElement('div');
    weightBlock.style.cssText = 'display:flex;align-items:center;gap:0.25rem;flex-wrap:wrap;';
    weightBlock.innerHTML = '<span style="font-size:0.75rem;color:#94a3b8;margin-right:0.25rem;">굵기</span>';
    var savedWeight = (cardnewsData.defaults && cardnewsData.defaults.weightLevel != null) ? Number(cardnewsData.defaults.weightLevel) : 3;
    if (savedWeight < 1 || savedWeight > 5) savedWeight = 3;
    let weightLevel = savedWeight;
    const weightDots = [];
    var dotSizes = [12, 14, 17, 20, 24];
    for (let i = 0; i < 5; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.textContent = '●';
        var sz = dotSizes[i];
        dot.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;padding:0;border:none;background:none;cursor:pointer;font-size:' + (sz - 2) + 'px;line-height:1;display:flex;align-items:center;justify-content:center;color:' + (i + 1 <= weightLevel ? '#c4b5fd' : 'rgba(148,163,184,0.35)') + ';transition:color 0.2s;';
        dot.dataset.level = String(i + 1);
        dot.onclick = function() {
            weightLevel = i + 1;
            weightDots.forEach(function(d, idx) {
                d.style.color = (idx + 1 <= weightLevel) ? '#c4b5fd' : 'rgba(148,163,184,0.35)';
            });
        };
        weightDots.push(dot);
        weightBlock.appendChild(dot);
    }
    textOptRow.appendChild(weightBlock);
    const lengthBlock = document.createElement('div');
    lengthBlock.style.cssText = 'display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;';
    lengthBlock.innerHTML = '<span style="font-size:0.75rem;color:#94a3b8;margin-right:0.25rem;">길이</span>';
    let lengthVal = '자동';
    ['자동', '짧게', '설명형'].forEach(function(opt) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = opt;
        btn.style.cssText = 'padding:0.3rem 0.6rem;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,0.3);background:' + (opt === lengthVal ? 'rgba(139,92,246,0.35)' : 'transparent') + ';color:' + (opt === lengthVal ? '#e9d5ff' : '#94a3b8') + ';';
        btn.onclick = function() { lengthVal = opt; lengthBlock.querySelectorAll('button').forEach(function(b) { var t = b.textContent; b.style.background = t === lengthVal ? 'rgba(139,92,246,0.35)' : 'transparent'; b.style.color = t === lengthVal ? '#e9d5ff' : '#94a3b8'; }); };
        lengthBlock.appendChild(btn);
    });
    textOptRow.appendChild(lengthBlock);
    const toneBlock2 = document.createElement('div');
    toneBlock2.style.cssText = 'display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;';
    toneBlock2.innerHTML = '<span style="font-size:0.75rem;color:#94a3b8;margin-right:0.25rem;">말투</span>';
    let toneVal = '카드뉴스체';
    ['보도체', '카드뉴스체'].forEach(function(opt) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = opt;
        btn.style.cssText = 'padding:0.3rem 0.6rem;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,0.3);background:' + (opt === toneVal ? 'rgba(139,92,246,0.35)' : 'transparent') + ';color:' + (opt === toneVal ? '#e9d5ff' : '#94a3b8') + ';';
        btn.onclick = function() { toneVal = opt; toneBlock2.querySelectorAll('button').forEach(function(b) { var t = b.textContent; b.style.background = t === toneVal ? 'rgba(139,92,246,0.35)' : 'transparent'; b.style.color = t === toneVal ? '#e9d5ff' : '#94a3b8'; }); };
        toneBlock2.appendChild(btn);
    });
    textOptRow.appendChild(toneBlock2);
    const emphasisLabel = document.createElement('label');
    emphasisLabel.style.cssText = 'display:flex;align-items:center;gap:0.4rem;font-size:0.75rem;color:#cbd5e1;cursor:pointer;';
    const emphasisCb = document.createElement('input');
    emphasisCb.type = 'checkbox';
    emphasisCb.style.cssText = 'accent-color:#8b5cf6;cursor:pointer;';
    emphasisLabel.appendChild(emphasisCb);
    emphasisLabel.appendChild(document.createTextNode('키워드 자동 강조'));
    textOptRow.appendChild(emphasisLabel);
    const weightToValue = { 1: '300', 2: '400', 3: '500', 4: '700', 5: '900' };
    const applyFirstBtn = document.createElement('button');
    applyFirstBtn.type = 'button';
    applyFirstBtn.textContent = '수정 생성';
    applyFirstBtn.style.cssText = 'padding:0.5rem 1rem;background:linear-gradient(135deg,#6366F1,#8B5CF6);border:none;border-radius:8px;color:#fff;font-size:0.8rem;font-weight:700;cursor:pointer;';
    applyFirstBtn.onclick = function() {
        cardnewsData.defaults = cardnewsData.defaults || {};
        cardnewsData.defaults.tone = selectedToneValue;
        cardnewsData.defaults.cardCount = currentCount;
        cardnewsData.defaults.snsFormats = snsFormats.map(function(f) { return { id: f.id, checked: snsBlock.querySelector('input[data-format="' + f.id + '"]').checked }; });
        cardnewsData.defaults.weightLevel = weightLevel;
        cardnewsData.defaults.lengthVal = lengthVal;
        cardnewsData.defaults.speechTone = toneVal;
        cardnewsData.defaults.keywordEmphasis = emphasisCb.checked;
        var checkedSns = snsFormats.filter(function(f) { return snsBlock.querySelector('input[data-format="' + f.id + '"]').checked; }).map(function(f) { return f.id; });
        const options = { weightLevel: weightLevel, tone: selectedToneValue, cardCount: currentCount, lengthVal: lengthVal, speechTone: toneVal, keywordEmphasis: emphasisCb.checked, snsFormats: checkedSns };
        var applyFirstBtnRef = applyFirstBtn;
        // 현재 카드 HTML만 사용해 설정(굵기 등)만 적용. 전체 재생성하지 않아 이미지·배경·텍스트가 바뀌지 않음.
        var getCurrentHtml = function(i) { return (thumbIframes[i] && thumbIframes[i].getAttribute('srcdoc')) || (cards[i] && cards[i].html) || ''; };
        const payload = { cards: cards.map(function(c, i) { return { html: getCurrentHtml(i) || c.html }; }), options: options };
        applyFirstBtnRef.disabled = true;
        applyFirstBtnRef.textContent = '적용 중...';
        fetch(BACKEND_URL + '/api/cardnews/apply-defaults', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function(res) {
            if (!res.ok) return res.json().then(function(d) { throw new Error(d.error || 'HTTP ' + res.status); });
            return res.json();
        }).then(function(data) {
            applyFirstBtnRef.disabled = false;
            applyFirstBtnRef.textContent = '수정 생성';
            if (data.success && Array.isArray(data.cards)) {
                data.cards.forEach(function(item, i) {
                    if (cards[i]) cards[i].html = (item && item.html !== undefined) ? item.html : item;
                    if (thumbIframes[i]) thumbIframes[i].setAttribute('srcdoc', cards[i].html);
                });
                if (mainIframe) mainIframe.setAttribute('srcdoc', cards[selectedIndex].html);
                editPanelScroll.innerHTML = '';
                buildCardEditPanel(editPanelScroll, cards[selectedIndex], selectedIndex + 1, mainIframe, thumbIframes[selectedIndex]);
                showDownloadNotification('서버에 1차 적용되었습니다. 카드별 수정은 오른쪽 편집 패널에서 가능합니다.');
            } else {
                throw new Error(data.error || '적용 실패');
            }
        }).catch(function(err) {
            applyFirstBtnRef.disabled = false;
            applyFirstBtnRef.textContent = '수정 생성';
            console.warn('수정 생성 API 실패, 로컬 적용:', err.message);
            var fontWeight = weightToValue[weightLevel] || '500';
            var getCurrentHtml = function(i) { return (thumbIframes[i] && thumbIframes[i].getAttribute('srcdoc')) || (cards[i] && cards[i].html) || ''; };
            cards.forEach(function(c, i) {
                var currentHtml = getCurrentHtml(i) || c.html;
                c.html = applyCardEdits(currentHtml, { fontWeight: fontWeight });
                if (thumbIframes[i]) thumbIframes[i].setAttribute('srcdoc', c.html);
            });
            if (mainIframe) mainIframe.setAttribute('srcdoc', cards[selectedIndex].html);
            editPanelScroll.innerHTML = '';
            buildCardEditPanel(editPanelScroll, cards[selectedIndex], selectedIndex + 1, mainIframe, thumbIframes[selectedIndex]);
            showDownloadNotification('서버 연결 실패로 로컬 적용되었습니다. 위 안내대로 서버 연결 후 다시 시도하세요.');
            if (!document.getElementById('backend-connection-warning')) showConnectionWarningBanner();
        });
    };
    textOptRow.appendChild(applyFirstBtn);
    const downloadAllBtn = document.createElement('button');
    downloadAllBtn.type = 'button';
    downloadAllBtn.textContent = '전체 다운로드';
    downloadAllBtn.style.cssText = 'margin-left:auto;padding:0.5rem 1rem;background:linear-gradient(135deg,#0d9488,#0f766e);border:none;border-radius:8px;color:#fff;font-size:0.8rem;font-weight:700;cursor:pointer;';
    downloadAllBtn.onclick = function() {
        if (window.CardImageCapture) {
            downloadAllBtn.disabled = true;
            var origText = downloadAllBtn.textContent;
            downloadAllBtn.textContent = '다운로드 중...';
            var getHtml = function(i) { return (thumbIframes[i] && thumbIframes[i].getAttribute('srcdoc')) || (cards[i] && cards[i].html) || null; };
            CardImageCapture.downloadAllCardsAsPNG(cards, getHtml).then(function() { downloadAllBtn.disabled = false; downloadAllBtn.textContent = origText; }).catch(function() { downloadAllBtn.disabled = false; downloadAllBtn.textContent = origText; });
        } else {
            alert('PNG 저장을 위해 페이지를 새로고침 후 다시 시도해주세요.');
        }
    };
    textOptRow.appendChild(downloadAllBtn);
    header.appendChild(textOptRow);
    viewer.appendChild(header);
    // 메인: ② 카드 목록 | ③ 카드 편집 영역
    const main = document.createElement('div');
    main.style.cssText = 'flex:1;min-height:0;display:flex;overflow:hidden;';
    const cardListWrap = document.createElement('div');
    cardListWrap.style.cssText = 'width:300px;flex-shrink:0;background:#1e293b;border-right:1px solid rgba(148,163,184,0.2);overflow-y:auto;padding:0.75rem;';
    const cardListTitle = document.createElement('div');
    cardListTitle.style.cssText = 'font-size:0.7rem;font-weight:800;color:#94a3b8;letter-spacing:0.08em;margin-bottom:0.75rem;';
    cardListTitle.textContent = '카드 목록';
    cardListWrap.appendChild(cardListTitle);
    const thumbIframes = [];
    cards.forEach((card, index) => {
        const item = document.createElement('div');
        item.dataset.cardIndex = String(index);
        item.style.cssText = 'position:relative;width:100%;aspect-ratio:1080/1350;max-height:220px;overflow:hidden;border-radius:10px;margin-bottom:0.6rem;cursor:pointer;background:#334155;border:3px solid transparent;transition:border-color 0.2s,box-shadow 0.2s;';
        const thumb = document.createElement('iframe');
        thumb.setAttribute('srcdoc', card.html);
        thumb.className = 'card-list-thumb';
        thumb.style.width = '1080px';
        thumb.style.height = '1350px';
        item.appendChild(thumb);
        thumbIframes.push(thumb);
        const label = document.createElement('div');
        label.style.cssText = 'position:absolute;bottom:0;left:0;right:0;padding:4px 8px;background:rgba(15,23,42,0.9);color:#e2e8f0;font-size:0.7rem;font-weight:700;';
        label.textContent = (index + 1) + ' · ' + (card.type === 'cover' ? '표지' : card.type === 'content' ? '본문' : '마무리');
        item.appendChild(label);
        item.onclick = () => selectCard(index);
        cardListWrap.appendChild(item);
    });
    function fitThumbs() {
        cardListWrap.querySelectorAll('[data-card-index]').forEach((el, i) => {
            const wrap = el;
            const w = wrap.offsetWidth;
            if (thumbIframes[i]) thumbIframes[i].style.transform = 'scale(' + (w / 1080) + ')';
        });
    }
    const rightPanel = document.createElement('div');
    rightPanel.style.cssText = 'flex:1;min-width:640px;display:flex;flex-direction:row;overflow:hidden;background:#0f172a;';
    const previewColumn = document.createElement('div');
    previewColumn.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden;';
    const previewWrap = document.createElement('div');
    previewWrap.className = 'card-preview-wrap';
    previewWrap.style.cssText = 'flex:1;min-height:0;position:relative;overflow:auto;background:#334155;display:flex;align-items:center;justify-content:center;padding:1rem;';
    const mainIframeOuter = document.createElement('div');
    mainIframeOuter.style.cssText = 'position:relative;flex-shrink:0;box-shadow:0 8px 32px rgba(0,0,0,0.4);border-radius:8px;overflow:visible;';
    const mainIframe = document.createElement('iframe');
    mainIframe.setAttribute('srcdoc', cards[0].html);
    mainIframe.style.cssText = 'position:absolute;top:0;left:0;width:1080px;height:1350px;border:none;transform-origin:top left;';
    mainIframeOuter.appendChild(mainIframe);
    previewWrap.appendChild(mainIframeOuter);
    function fitMainPreview() {
        const wrapW = previewWrap.clientWidth - 32;
        const wrapH = previewWrap.clientHeight - 32;
        const scale = Math.min(wrapW / 1080, wrapH / 1350, 1);
        mainIframeOuter.style.width = (1080 * scale) + 'px';
        mainIframeOuter.style.height = (1350 * scale) + 'px';
        mainIframe.style.transform = 'scale(' + scale + ')';
    }
    const mainRo = new ResizeObserver(fitMainPreview);
    mainRo.observe(previewWrap);
    requestAnimationFrame(fitMainPreview);
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'flex-shrink:0;display:flex;gap:0.5rem;padding:0.75rem 1rem;background:#1e293b;border-top:1px solid rgba(148,163,184,0.2);flex-wrap:wrap;';
    function addToolBtn(html, title, onClick) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerHTML = html;
        btn.title = title;
        btn.style.cssText = 'padding:0.6rem 1rem;border:none;border-radius:10px;color:#fff;font-size:0.8rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.4rem;';
        btn.onclick = onClick;
        return btn;
    }
    const editPanelWrap = document.createElement('div');
    editPanelWrap.style.cssText = 'width:400px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden;background:#1e293b;border-left:1px solid rgba(148,163,184,0.2);';
    const editPanelScroll = document.createElement('div');
    editPanelScroll.style.cssText = 'flex:1;min-height:0;overflow-y:auto;padding:0 1rem 1rem;';
    function selectCard(index) {
        selectedIndex = index;
        const card = cards[index];
        mainIframe.setAttribute('srcdoc', card.html);
        cardListWrap.querySelectorAll('[data-card-index]').forEach(el => {
            el.style.borderColor = el.dataset.cardIndex === String(index) ? '#0ea5e9' : 'transparent';
            el.style.boxShadow = el.dataset.cardIndex === String(index) ? '0 0 0 2px #0ea5e9' : 'none';
        });
        editPanelScroll.innerHTML = '';
        buildCardEditPanel(editPanelScroll, card, index + 1, mainIframe, thumbIframes[index]);
        const pngBtn = toolbar.querySelector('[data-tool="png"]');
        const htmlBtn = toolbar.querySelector('[data-tool="html"]');
        if (pngBtn) pngBtn.onclick = () => { if (window.CardImageCapture) CardImageCapture.downloadCardAsPNG(card, index + 1, card.html); else alert('PNG 저장을 위해 페이지를 새로고침 후 다시 시도해주세요.'); };
        if (htmlBtn) htmlBtn.onclick = () => downloadCardHTML(card, index + 1);
    }
    const downloadArrowSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    const pngBtn = addToolBtn(downloadArrowSvg + ' PNG', 'PNG 저장', () => { const c = cards[selectedIndex]; if (window.CardImageCapture) CardImageCapture.downloadCardAsPNG(c, selectedIndex + 1, c.html); else alert('PNG 저장을 위해 페이지를 새로고침 후 다시 시도해주세요.'); });
    pngBtn.dataset.tool = 'png';
    pngBtn.style.background = 'linear-gradient(135deg, #0d9488, #0f766e)';
    toolbar.appendChild(pngBtn);
    const htmlBtn = addToolBtn(downloadArrowSvg + ' HTML', 'HTML 다운로드', () => downloadCardHTML(cards[selectedIndex], selectedIndex + 1));
    htmlBtn.dataset.tool = 'html';
    htmlBtn.style.background = 'linear-gradient(135deg, #6366F1, #8B5CF6)';
    toolbar.appendChild(htmlBtn);
    const shareSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
    function doSnsShare(caption) {
        var card = cards[selectedIndex];
        var currentHtml = (thumbIframes[selectedIndex] && thumbIframes[selectedIndex].getAttribute('srcdoc')) || card.html || null;
        if (!window.CardImageCapture) { alert('SNS 업로드를 위해 페이지를 새로고침 후 다시 시도해주세요.'); return; }
        var btn = document.querySelector('[data-tool="sns"]');
        if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }
        var shareText = (typeof caption === 'string' && caption.trim()) ? caption.trim() : '세계일보 카드뉴스';
        CardImageCapture.getCardAsPNGBlob(card, selectedIndex + 1, currentHtml).then(function(blob) {
            var file = new File([blob], 'segye_card_' + (selectedIndex + 1) + '.png', { type: 'image/png' });
            if (typeof navigator.share === 'function' && navigator.canShare && navigator.canShare({ files: [file] })) {
                return navigator.share({ files: [file], title: '세계일보 카드뉴스', text: shareText }).then(function() {
                    if (CardImageCapture.showNotification) CardImageCapture.showNotification('SNS 공유 대화상자가 열렸습니다.');
                }).catch(function(e) {
                    if (e.name !== 'AbortError') { CardImageCapture.downloadBlob(blob, file.name); if (CardImageCapture.showNotification) CardImageCapture.showNotification('PNG으로 저장했습니다. SNS 앱에서 업로드해 주세요.'); }
                });
            } else {
                CardImageCapture.downloadBlob(blob, file.name);
                if (CardImageCapture.showNotification) CardImageCapture.showNotification('PNG으로 저장했습니다. SNS 앱에서 업로드해 주세요.');
            }
        }).catch(function(err) {
            console.warn('SNS 공유용 캡처 실패:', err);
            alert('이미지 생성에 실패했습니다. PNG 저장을 먼저 시도해 주세요.');
        }).finally(function() {
            if (btn) { btn.disabled = false; btn.style.opacity = ''; }
        });
    }
    function showSnsUploadModal() {
        if (!window.CardImageCapture) { alert('SNS 업로드를 위해 페이지를 새로고침 후 다시 시도해주세요.'); return; }
        var overlay = document.createElement('div');
        overlay.id = 'sns-upload-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.85);z-index:10002;display:flex;align-items:center;justify-content:center;padding:1rem;';
        var box = document.createElement('div');
        box.style.cssText = 'background:#1e293b;border-radius:16px;border:1px solid rgba(148,163,184,0.25);max-width:420px;width:100%;padding:1.5rem;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);';
        box.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;"><h3 style="font-size:1.1rem;font-weight:800;color:#f1f5f9;">SNS 업로드 설정</h3><button type="button" data-sns-modal-close style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:4px;line-height:1;">✕</button></div>';
        var fieldset = document.createElement('div');
        fieldset.style.marginBottom = '1rem';
        fieldset.innerHTML = '<div style="font-size:0.8rem;font-weight:700;color:#94a3b8;margin-bottom:0.5rem;">공유할 카드</div>';
        var radioWrap = document.createElement('div');
        radioWrap.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;';
        var r1 = document.createElement('label');
        r1.style.cssText = 'display:flex;align-items:center;gap:0.5rem;cursor:pointer;color:#e2e8f0;font-size:0.9rem;';
        r1.innerHTML = '<input type="radio" name="sns-upload-target" value="current" checked> 현재 카드만 (선택한 1장)';
        var r2 = document.createElement('label');
        r2.style.cssText = 'display:flex;align-items:center;gap:0.5rem;cursor:pointer;color:#e2e8f0;font-size:0.9rem;';
        r2.innerHTML = '<input type="radio" name="sns-upload-target" value="all"> 전체 카드 (순서대로 다운로드/공유)';
        radioWrap.appendChild(r1);
        radioWrap.appendChild(r2);
        fieldset.appendChild(radioWrap);
        box.appendChild(fieldset);
        var captionLabel = document.createElement('div');
        captionLabel.style.cssText = 'font-size:0.8rem;font-weight:700;color:#94a3b8;margin-bottom:0.5rem;';
        captionLabel.textContent = '캡션 / 해시태그 (업로드 후 붙여넣기용)';
        box.appendChild(captionLabel);
        var textarea = document.createElement('textarea');
        textarea.placeholder = '#세계일보 #카드뉴스';
        textarea.style.cssText = 'width:100%;min-height:80px;padding:0.75rem;border-radius:10px;border:1px solid rgba(148,163,184,0.3);background:#0f172a;color:#e2e8f0;font-size:0.9rem;resize:vertical;box-sizing:border-box;';
        box.appendChild(textarea);
        var copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.textContent = '캡션 복사';
        copyBtn.style.cssText = 'margin-top:0.5rem;padding:0.5rem 1rem;background:#334155;border:none;border-radius:8px;color:#e2e8f0;font-size:0.85rem;font-weight:600;cursor:pointer;';
        copyBtn.onclick = function() {
            var t = textarea.value.trim() || '#세계일보 #카드뉴스';
            navigator.clipboard.writeText(t).then(function() {
                if (window.CardImageCapture && CardImageCapture.showNotification) CardImageCapture.showNotification('캡션이 클립보드에 복사되었습니다.');
            }).catch(function() { alert('복사에 실패했습니다.'); });
        };
        box.appendChild(copyBtn);
        var notice = document.createElement('p');
        notice.style.cssText = 'margin-top:1rem;font-size:0.75rem;color:#94a3b8;line-height:1.5;';
        notice.textContent = '※ 이미지는 공유 시트에서 앱을 선택하거나, PNG 저장 후 인스타그램 등 SNS 앱에서 업로드해 주세요.';
        box.appendChild(notice);
        var btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:0.75rem;justify-content:flex-end;margin-top:1.25rem;';
        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = '취소';
        cancelBtn.style.cssText = 'padding:0.6rem 1.2rem;background:#334155;border:none;border-radius:10px;color:#e2e8f0;font-size:0.9rem;font-weight:600;cursor:pointer;';
        var goBtn = document.createElement('button');
        goBtn.type = 'button';
        goBtn.textContent = '공유·다운로드 진행';
        goBtn.style.cssText = 'padding:0.6rem 1.2rem;background:linear-gradient(135deg,#EC4899,#DB2777);border:none;border-radius:10px;color:#fff;font-size:0.9rem;font-weight:600;cursor:pointer;';
        function closeModal() { if (overlay.parentNode) overlay.remove(); }
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
        box.querySelector('[data-sns-modal-close]').onclick = closeModal;
        cancelBtn.onclick = closeModal;
        goBtn.onclick = function() {
            var target = box.querySelector('input[name="sns-upload-target"]:checked');
            var isAll = target && target.value === 'all';
            var caption = textarea.value.trim();
            closeModal();
            if (isAll) {
                if (caption) {
                    navigator.clipboard.writeText(caption).catch(function() {});
                    if (CardImageCapture.showNotification) CardImageCapture.showNotification('캡션을 클립보드에 복사했습니다. 각 이미지 업로드 후 붙여넣기 하세요.');
                }
                var getHtml = function(i) { return (thumbIframes[i] && thumbIframes[i].getAttribute('srcdoc')) || (cards[i] && cards[i].html) || null; };
                CardImageCapture.downloadAllCardsAsPNG(cards, getHtml).catch(function() {});
            } else {
                doSnsShare(caption || undefined);
            }
        };
        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(goBtn);
        box.appendChild(btnRow);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }
    const snsBtn = addToolBtn(shareSvg + ' SNS 업로드', 'SNS에 이미지 업로드', showSnsUploadModal);
    snsBtn.dataset.tool = 'sns';
    snsBtn.style.background = 'linear-gradient(135deg, #EC4899, #DB2777)';
    snsBtn.style.marginLeft = '0.5rem';
    textOptRow.appendChild(snsBtn);
    previewColumn.appendChild(previewWrap);
    previewColumn.appendChild(toolbar);
    editPanelWrap.appendChild(editPanelScroll);
    rightPanel.appendChild(previewColumn);
    rightPanel.appendChild(editPanelWrap);
    main.appendChild(cardListWrap);
    main.appendChild(rightPanel);
    viewer.appendChild(main);
    document.body.appendChild(viewer);
    selectCard(0);
    requestAnimationFrame(fitThumbs);
    const ro = new ResizeObserver(fitThumbs);
    cardListWrap.querySelectorAll('[data-card-index]').forEach(wrap => ro.observe(wrap));
    console.log('✅ 카드뉴스 표시 완료!');
}

var COMPACT_CARD_WIDTH = 400;
var COMPACT_CARD_HEIGHT = 550;

function wrapCardAsCompact(html) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');
    var head = doc.head;
    var body = doc.body;
    var scale = Math.min(COMPACT_CARD_WIDTH / 1080, COMPACT_CARD_HEIGHT / 1350);
    var headHtml = '';
    head.querySelectorAll('link, style').forEach(function (el) {
        headHtml += el.outerHTML;
    });
    var bodyStyle = body.getAttribute('style') || '';
    var bodyContent = body.innerHTML;
    var compactHtml = '<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=' + COMPACT_CARD_WIDTH + ', height=' + COMPACT_CARD_HEIGHT + '">\n' + headHtml + '\n<style>\n*{margin:0;padding:0;box-sizing:border-box}\nbody{width:' + COMPACT_CARD_WIDTH + 'px;height:' + COMPACT_CARD_HEIGHT + 'px;overflow:hidden;margin:0;display:flex;align-items:center;justify-content:center;background:#f8fafc}\n.card-compact-wrap{width:1080px;height:1350px;transform:scale(' + scale + ');transform-origin:center center;flex-shrink:0}\n</style>\n</head>\n<body>\n<div class="card-compact-wrap" style="' + bodyStyle.replace(/"/g, '&quot;') + '">' + bodyContent + '</div>\n</body>\n</html>';
    return compactHtml;
}

function downloadCardHTML(card, cardNumber) {
    const blob = new Blob([card.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `segye_card_${cardNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showDownloadNotification('카드 ' + cardNumber + ' 다운로드 완료!');
    console.log('✅ 카드 ' + cardNumber + ' HTML 다운로드 완료');
}

function downloadCardCompact(card, cardNumber) {
    const compactHtml = wrapCardAsCompact(card.html);
    const blob = new Blob([compactHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `segye_card_${cardNumber}_400x550.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showDownloadNotification('카드 ' + cardNumber + ' 콤팩트(400×550) 저장 완료!');
    console.log('✅ 카드 ' + cardNumber + ' 콤팩트 저장 완료');
}

function showDownloadNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem; background: linear-gradient(135deg, #10B981, #059669); color: white; border-radius: 12px; font-size: 0.95rem; font-weight: 600; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4); z-index: 10001; animation: slideUp 0.3s ease; display: flex; align-items: center; gap: 0.75rem;';
    notification.innerHTML = '<span>✓ ' + message + '</span>';
    document.body.appendChild(notification);
    setTimeout(function () {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(function () { notification.remove(); }, 300);
    }, 2000);
}

function showConnectionWarningBanner() {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
    const isLocalhost3000 = /^https?:\/\/(localhost|127\.0\.0\.1):3000$/i.test(origin);
    const message = isLocalhost3000
        ? '백엔드 서버가 실행되지 않았습니다. 프로젝트 폴더에서 START.bat을 실행한 뒤 이 페이지를 새로고침하세요.'
        : '서버에 연결되지 않았습니다. 1차 적용 등 기능을 사용하려면 START.bat을 실행한 뒤 브라우저 주소창에 http://localhost:3000 을 입력해 접속하세요.';
    const banner = document.createElement('div');
    banner.id = 'backend-connection-warning';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10002;padding:12px 48px 12px 16px;background:linear-gradient(90deg,#D97706,#B45309);color:#fff;font-size:0.9rem;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.2);display:flex;align-items:center;gap:12px;';
    banner.innerHTML = '<span style="flex:1">⚠️ ' + message + '</span><button type="button" aria-label="닫기" style="position:absolute;top:50%;right:12px;transform:translateY(-50%);background:rgba(255,255,255,0.25);border:none;border-radius:6px;color:#fff;width:28px;height:28px;cursor:pointer;font-size:1.1rem;line-height:1">×</button>';
    const closeBtn = banner.querySelector('button');
    closeBtn.addEventListener('click', function () { banner.remove(); });
    document.body.insertBefore(banner, document.body.firstChild);
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔌 백엔드 연결 확인 중...');
    const isConnected = await checkBackendConnection();
    if (!isConnected) {
        console.warn('⚠️ 백엔드 서버가 실행되지 않았습니다.');
        console.warn('💡 해결 방법: START.bat 실행 후 http://localhost:3000 접속');
        showConnectionWarningBanner();
    }
    const form = document.getElementById('newsForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const urlInput = document.getElementById('newsUrl');
            const url = urlInput?.value;
            if (!url) { alert('URL을 입력해주세요.'); return; }
            try {
                const button = document.getElementById('generateBtn');
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>생성 중...</span>';
                button.disabled = true;
                const cardnews = await generateCardNews(url);
                console.log('🎉 카드뉴스 생성 완료!'); console.log(cardnews);
                button.innerHTML = originalText; button.disabled = false;
                displayCardNews(cardnews, url);
            } catch (error) {
                alert('❌ 카드뉴스 생성 중 오류가 발생했습니다: ' + error.message);
                const button = document.getElementById('generateBtn');
                button.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> <span>AI로 생성하기</span>';
                button.disabled = false;
            }
        });
    }
});
