// OpenAI 카드뉴스 생성 서비스
const OpenAI = require('openai');

class CardNewsAIService {
    constructor() {
        this.openai = null;
        this.initialized = false;
    }

    // OpenAI 초기화
    initialize(apiKey) {
        if (!apiKey) {
            throw new Error('OpenAI API 키가 필요합니다.');
        }
        
        this.openai = new OpenAI({
            apiKey: apiKey
        });
        this.initialized = true;
        console.log('✅ OpenAI 카드뉴스 생성 서비스 초기화 완료');
    }

    // 기사 분석 및 카드뉴스 구조 생성
    async analyzeArticleAndGenerateStructure(article) {
        if (!this.initialized) {
            throw new Error('OpenAI 서비스가 초기화되지 않았습니다.');
        }

        const { title, content, category } = article;

        try {
            console.log('🤖 OpenAI로 기사 분석 시작...');

            const prompt = `
당신은 전문 카드뉴스 디자이너이자 콘텐츠 전략가입니다.
아래 기사를 분석하여 **독자의 시선을 사로잡는 고품질 카드뉴스**를 설계해주세요.

**기사 제목:** ${title}
**카테고리:** ${category || '일반'}
**기사 본문:**
${content}

---

**요구사항:**

1. **카드 구성 (5-7장)**
   - 표지 (1장): 강렬한 제목 + 핵심 메시지
   - 본문 (3-5장): 핵심 내용을 논리적으로 전개
   - 마무리 (1장): 결론 또는 행동 유도

2. **전문가 수준 텍스트 작성**
   - 각 카드는 2-3줄 이내 (간결성)
   - 임팩트 있는 문구 사용
   - 독자가 다음 카드를 넘기고 싶게 만드는 스토리텔링
   - 숫자, 통계가 있다면 강조

3. **시각적 제안**
   - 각 카드의 시각적 컨셉 제안
   - 어떤 이미지가 필요한지 구체적으로 설명
   - 색상 톤 제안 (예: 신뢰감 있는 파란색, 긴급성을 나타내는 빨간색)

4. **JSON 형식으로 응답**

\`\`\`json
{
  "cardCount": 6,
  "templateType": "속보형/데이터형/스토리형/밈형/인용형/타임라인형 중 하나",
  "colorScheme": "blue/red/green/purple/orange 중 하나",
  "cards": [
    {
      "cardNumber": 1,
      "type": "cover",
      "title": "강렬한 제목 (15자 이내)",
      "text": "부제목 또는 핵심 메시지 (2줄 이내)",
      "visualConcept": "어떤 이미지가 필요한지 구체적 설명",
      "designNote": "디자인 시 주의사항 (폰트 크기, 배치 등)"
    },
    {
      "cardNumber": 2,
      "type": "content",
      "title": "섹션 제목",
      "text": "핵심 내용 (2-3줄)",
      "visualConcept": "이미지 제안",
      "designNote": "디자인 노트"
    }
  ],
  "summary": "전체 카드뉴스 요약 (1-2문장)",
  "targetAudience": "타겟 독자층",
  "keyMessage": "전달하고자 하는 핵심 메시지"
}
\`\`\`

**중요:** 반드시 JSON만 응답하세요. 다른 텍스트는 포함하지 마세요.
`;

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: '당신은 세계일보의 전문 카드뉴스 디자이너입니다. 독자의 시선을 사로잡는 고품질 카드뉴스를 설계하는 전문가입니다.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 3000
            });

            const responseText = completion.choices[0].message.content.trim();
            console.log('📝 OpenAI 응답 받음:', responseText.substring(0, 200) + '...');

            // JSON 파싱
            let cardStructure;
            try {
                // 코드 블록 제거
                const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                cardStructure = JSON.parse(jsonText);
            } catch (parseError) {
                console.error('❌ JSON 파싱 실패:', parseError);
                throw new Error('OpenAI 응답을 파싱할 수 없습니다.');
            }

            console.log('✅ 카드뉴스 구조 생성 완료:', cardStructure.cardCount + '장');

            return {
                success: true,
                data: cardStructure
            };

        } catch (error) {
            console.error('❌ OpenAI 분석 오류:', error.message);
            throw error;
        }
    }

    // 카드별 디자인 생성 (HTML + CSS)
    generateCardHTML(card, cardNumber, totalCards, colorScheme) {
        const colors = {
            blue: { primary: '#0066cc', secondary: '#0099ff', background: 'linear-gradient(135deg, #0066cc 0%, #0099ff 100%)' },
            red: { primary: '#EF4444', secondary: '#B91C1C', background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)' },
            green: { primary: '#10B981', secondary: '#059669', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
            purple: { primary: '#8B5CF6', secondary: '#6D28D9', background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' },
            orange: { primary: '#F59E0B', secondary: '#D97706', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }
        };

        const theme = colors[colorScheme] || colors.blue;

        // 표지 카드
        if (card.type === 'cover') {
            return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>카드 ${cardNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
            width: 1080px;
            height: 1920px;
            background: ${theme.background};
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 100px;
            color: white;
        }
        .cover-badge {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 24px;
            font-weight: 500;
            margin-bottom: 60px;
            border: 2px solid rgba(255, 255, 255, 0.3);
        }
        .cover-title {
            font-size: 120px;
            font-weight: 900;
            line-height: 1.2;
            text-align: center;
            margin-bottom: 50px;
            text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            word-break: keep-all;
        }
        .cover-subtitle {
            font-size: 48px;
            font-weight: 400;
            line-height: 1.6;
            text-align: center;
            opacity: 0.95;
            word-break: keep-all;
        }
        .cover-footer {
            position: absolute;
            bottom: 80px;
            font-size: 32px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="cover-badge">세계일보 카드뉴스</div>
    <h1 class="cover-title">${card.title}</h1>
    <p class="cover-subtitle">${card.text}</p>
    <div class="cover-footer">1 / ${totalCards}</div>
</body>
</html>
            `.trim();
        }

        // 본문 카드
        if (card.type === 'content') {
            return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>카드 ${cardNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
            width: 1080px;
            height: 1920px;
            background: white;
            display: flex;
            flex-direction: column;
            padding: 80px;
        }
        .header {
            background: ${theme.background};
            color: white;
            padding: 30px 40px;
            border-radius: 20px;
            margin-bottom: 60px;
        }
        .header-number {
            font-size: 32px;
            font-weight: 700;
            opacity: 0.9;
            margin-bottom: 15px;
        }
        .content-title {
            font-size: 80px;
            font-weight: 900;
            color: #1a1a1a;
            line-height: 1.3;
            margin-bottom: 60px;
            word-break: keep-all;
        }
        .content-text {
            font-size: 48px;
            font-weight: 400;
            color: #333;
            line-height: 1.8;
            word-break: keep-all;
        }
        .footer {
            margin-top: auto;
            padding-top: 60px;
            border-top: 3px solid #e5e5e5;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .footer-logo {
            font-size: 36px;
            font-weight: 700;
            color: ${theme.primary};
        }
        .footer-page {
            font-size: 32px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-number">PART ${cardNumber - 1}</div>
    </div>
    <h2 class="content-title">${card.title}</h2>
    <p class="content-text">${card.text}</p>
    <div class="footer">
        <div class="footer-logo">세계일보</div>
        <div class="footer-page">${cardNumber} / ${totalCards}</div>
    </div>
</body>
</html>
            `.trim();
        }

        // 마무리 카드
        if (card.type === 'closing') {
            return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>카드 ${cardNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
            width: 1080px;
            height: 1920px;
            background: ${theme.background};
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 100px;
            color: white;
        }
        .closing-title {
            font-size: 100px;
            font-weight: 900;
            line-height: 1.3;
            text-align: center;
            margin-bottom: 80px;
            text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            word-break: keep-all;
        }
        .closing-text {
            font-size: 48px;
            font-weight: 400;
            line-height: 1.8;
            text-align: center;
            opacity: 0.95;
            word-break: keep-all;
            margin-bottom: 100px;
        }
        .closing-logo {
            font-size: 60px;
            font-weight: 900;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            padding: 30px 60px;
            border-radius: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
        }
        .closing-footer {
            position: absolute;
            bottom: 80px;
            font-size: 32px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <h2 class="closing-title">${card.title}</h2>
    <p class="closing-text">${card.text}</p>
    <div class="closing-logo">세계일보</div>
    <div class="closing-footer">${cardNumber} / ${totalCards}</div>
</body>
</html>
            `.trim();
        }
    }

    // 전체 카드뉴스 생성
    async generateFullCardNews(cardStructure) {
        const cards = [];
        const totalCards = cardStructure.cards.length;
        const colorScheme = cardStructure.colorScheme || 'blue';

        for (let i = 0; i < cardStructure.cards.length; i++) {
            const card = cardStructure.cards[i];
            const html = this.generateCardHTML(card, i + 1, totalCards, colorScheme);
            
            cards.push({
                cardNumber: i + 1,
                type: card.type,
                title: card.title,
                text: card.text,
                html: html,
                visualConcept: card.visualConcept,
                designNote: card.designNote
            });
        }

        return {
            success: true,
            data: {
                templateType: cardStructure.templateType,
                colorScheme: colorScheme,
                cardCount: totalCards,
                cards: cards,
                summary: cardStructure.summary,
                keyMessage: cardStructure.keyMessage
            }
        };
    }
}

module.exports = new CardNewsAIService();
