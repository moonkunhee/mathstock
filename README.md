📈 Mathstock
Mathstock은 주식 데이터를 수학 함수처럼 다루고 시각화할 수 있는 웹 애플리케이션입니다. GeoGebra처럼 주가 데이터를 변수(f1, f2)로 정의하고, 사칙연산, 로그, 삼각함수, 이동평균선 등 다양한 수학적 모델링을 실시간으로 그래프에 그릴 수 있습니다.

✨ 주요 기능
주가 데이터 호출: NVDA, AAPL 등 티커 입력 시 실시간 데이터 로드 (Yahoo Finance)

수학 연산: log(AAPL), AAPL + TSLA, sin(x/10) 등 복잡한 수식 계산

함수 참조: f1 = AAPL로 정의 후 f2 = f1 + 100 처럼 변수 재사용 가능

순수 수학 함수: 주식 데이터 없이 x^2, sin(x) 등의 수학 그래프 지원

기간/봉 설정: 1일~5년(Range), 1분~1달(Interval) 데이터 조회

보안: simpleeval을 적용하여 안전한 수식 계산 환경 구축 (Sandbox)

🛠 기술 스택
Frontend: React, Vite, Recharts

Backend: Python, FastAPI, Pandas, NumPy, yfinance

Security: SimpleEval (Python Arbitrary Code Execution 방지)

🚀 설치 및 실행 가이드
이 프로젝트를 실행하려면 Node.js와 Python이 설치되어 있어야 합니다.

1. 프로젝트 다운로드 (Clone)
먼저 터미널을 열고 코드를 내려받습니다.

Bash

git clone https://github.com/YOUR_GITHUB_ID/mathstock.git
cd mathstock
2. 백엔드 설정 (Python)
주식 데이터를 가져오고 계산하는 서버를 설정합니다.

백엔드 폴더로 이동

Bash

cd backend
가상환경 생성 및 실행

Mac/Linux (WSL):

Bash

python3 -m venv venv
source venv/bin/activate
Windows (PowerShell):

Bash

python -m venv venv
.\venv\Scripts\Activate
필수 라이브러리 설치

Bash

pip install -r requirements.txt
(만약 requirements.txt가 없다면: pip install fastapi uvicorn yfinance pandas simpleeval)

3. 프론트엔드 설정 (React)
웹사이트 화면을 구성하는 라이브러리를 설치합니다. (새 터미널을 열거나, 백엔드 폴더에서 상위 폴더로 이동하세요: cd ..)

Bash

# 프로젝트 루트 폴더(mathstock)에서 실행
npm install
▶️ 실행 방법
서버는 백엔드와 프론트엔드 두 개를 동시에 켜야 합니다. 터미널을 2개 열어주세요.

터미널 1: 백엔드 실행 (Port: 8000)
Bash

cd backend
source venv/bin/activate  # 가상환경 켜기 (Windows는 .\venv\Scripts\Activate)
python3 -m uvicorn main:app --reload
성공 시: Application startup complete. 메시지 출력

터미널 2: 프론트엔드 실행 (Port: 5173)
Bash

# 프로젝트 루트 폴더에서
npm run dev
성공 시: Local: http://localhost:5173/ 메시지 출력

👉 이제 브라우저에서 http://localhost:5173 으로 접속하면 Mathstock을 사용할 수 있습니다!

🌐 외부 접속 (선택 사항)
다른 기기(핸드폰, 외부 네트워크)에서 접속하려면 ngrok을 사용하세요.

백엔드 터널링: ngrok http 8000 -> 주소 복사하여 src/App.jsx의 API_URL 수정

프론트엔드 터널링: ngrok http 5173 -> 생성된 주소로 접속

주의: vite.config.js의 allowedHosts 설정에 ngrok 주소를 추가해야 합니다.

📝 라이선스
This project is for educational purposes. Data provided by Yahoo Finance.