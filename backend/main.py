from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import re
import math

# [중요] 같은 폴더에 있는 calculator.py에서 계산 함수를 가져옵니다.
from calculator import calculate_equation

app = FastAPI()

# 1. CORS 설정 (React 프론트엔드 포트 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 요청 데이터 모델
class FormulaRequest(BaseModel):
    equation: str
    range: str = "1y"      # 1d, 5d, 1mo, 1y, max ...
    interval: str = "1d"   # 1m, 5m, 1h, 1d ...

@app.post("/calculate")
async def calculate_stock(req: FormulaRequest):
    print(f"\n[Request] Equation: {req.equation}, Range: {req.range}, Interval: {req.interval}")
    
    # 3. 수식에서 티커(Ticker) 추출
    # 대문자로 변환하여 검색 (예: aapl -> AAPL)
    upper_eq = req.equation.upper()
    
    # 정규식: 알파벳 대문자 2글자 이상인 단어를 티커로 간주
    tickers = list(set(re.findall(r'[A-Z]{2,}', upper_eq)))
    
    # 예약어(수학 함수 등)가 티커로 오인되지 않게 필터링
    RESERVED_WORDS = ["SIN", "COS", "TAN", "LOG", "LOG10", "SQRT", "SMA", "EMA", "STD", "MAX", "MIN", "PI", "ABS", "EXP"]
    tickers = [t for t in tickers if t not in RESERVED_WORDS]

    # [수정됨] 순수 수학 함수(예: x^2)라 티커가 없는 경우
    # 시간축(t)을 만들기 위해 'SPY' 데이터를 더미로 사용
    if not tickers:
        print("[Logic] No tickers found. Using SPY for timeline reference.")
        tickers = ["SPY"]

    try:
        print(f"[Logic] Downloading data for {tickers}...")
        
        # 4. 데이터 다운로드 (yfinance)
        data = yf.download(
            tickers, 
            period=req.range, 
            interval=req.interval, 
            progress=False, 
            auto_adjust=True
        )
        
        # 5. 데이터 전처리 (MultiIndex 이슈 대응)
        # yfinance 최신 버전은 컬럼이 (Price, Ticker) 형태일 수 있음
        if isinstance(data.columns, pd.MultiIndex):
            try:
                # 'Close' 가격만 사용
                data = data['Close']
            except KeyError:
                pass 

        # 티커가 1개일 경우 Series로 오는데, 이를 DataFrame으로 변환
        if len(tickers) == 1:
            data = pd.DataFrame(data)
            data.columns = tickers
        
        # 결측치 채우기 (휴장일 등)
        data = data.ffill().bfill()
        
        # 데이터가 비어있는지 확인 (예: 1분봉 요청 제한 등)
        if data.empty:
            print("[Error] Empty data returned.")
            raise HTTPException(
                status_code=400, 
                detail=f"데이터가 없습니다. (기간 '{req.range}' vs 간격 '{req.interval}' 제한을 확인하세요)"
            )

        # 6. 계산 모듈 호출 (calculator.py)
        # 여기서 실제 수식 계산이 일어남 (t 변수 생성 포함)
        # 사용자가 입력한 수식(req.equation)을 그대로 전달 (대소문자 유지)
        print(f"[Logic] Calculating: {req.equation}")
        result_series = calculate_equation(data, req.equation)

        # 7. 결과 변환 (JSON 직렬화)
        result_list = []
        
        # 날짜 포맷: 분봉/시간봉이면 시간까지, 일봉이면 날짜만 표시
        time_format = '%Y-%m-%d %H:%M' if 'm' in req.interval or 'h' in req.interval else '%Y-%m-%d'

        for date, value in result_series.items():
            if not math.isnan(value):
                result_list.append({
                    "t": date.strftime(time_format),
                    "value": float(value)
                })
        
        print(f"[Success] Returning {len(result_list)} points.")
        return result_list

    except Exception as e:
        print(f"[Critical Error] {str(e)}")
        # 에러 내용을 프론트엔드에 전달
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # 로컬 개발용 실행
    uvicorn.run(app, host="0.0.0.0", port=8000)