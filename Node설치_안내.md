# Node.js 설치 안내 (Windows)

START.bat 실행 시 **'node' is not recognized** 오류가 나면, 집 PC에 Node.js가 없거나 PATH에 등록되지 않은 상태입니다. 아래 순서대로 설치하면 됩니다.

---

## 1. 다운로드

1. 브라우저에서 **https://nodejs.org/** 접속
2. **LTS**(권장) 버전의 **다운로드** 버튼 클릭  
   - 예: "22.x.x LTS" 등

---

## 2. 설치

1. 다운로드한 설치 파일(.msi) 실행
2. 설치 마법사에서:
   - **Next**로 진행
   - **"Add to PATH"** 옵션이 있으면 **반드시 체크** (기본값으로 체크되어 있는 경우가 많음)
   - 설치 경로는 기본값 그대로 두어도 됨
3. 설치가 끝날 때까지 **Next** → **Install** 진행 후 **Finish**

---

## 3. 확인

1. **명령 프롬프트 또는 PowerShell을 새로 연다.**  
   (이미 열려 있던 창은 닫고 새로 여는 것이 좋습니다.)
2. 아래 명령 입력 후 Enter:

   ```text
   node --version
   ```

3. `v22.x.x` 같은 버전 번호가 나오면 설치·PATH 설정이 된 것입니다.

---

## 4. 프로젝트 다시 실행

1. **segye_cardnews_cursor** 폴더로 이동
2. **START.bat** 더블클릭
3. 브라우저에서 **http://localhost:3000** 접속

---

## 설치했는데도 'node'를 찾을 수 없다면

- **명령 창을 완전히 닫았다가 다시 열고** `node --version`을 실행해 보세요. PATH는 새로 연 창에서만 적용됩니다.
- 그래도 안 되면 PC를 한 번 **재시작**한 뒤 다시 시도해 보세요.
- Node.js 설치 시 **"Automatically install necessary tools"** 같은 선택이 나오면 일단 **취소**해도 됩니다. 카드뉴스 프로젝트 실행에는 Node.js만 있으면 됩니다.

---

*이 프로젝트는 Node.js 18 이상을 권장합니다. LTS 버전을 쓰면 됩니다.*
