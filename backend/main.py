# backend/main.py (전체 덮어쓰기)
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import re
import math
from typing import Optional # [New] Optional 사용

from calculator import calculate_equation

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FormulaRequest(BaseModel):
    equation: str
    range: str = "1y"
    interval: str = "1d"
    # [New] 사용자 지정 날짜 (선택 사항)
    start_date: Optional[str] = None 
    end_date: Optional[str] = None

@app.post("/calculate")
async def calculate_stock(req: FormulaRequest):
    print(f"\n[Request] Eq: {req.equation}, Range: {req.range}, Start: {req.start_date}, End: {req.end_date}")
    
    equation = req.equation.upper()
    tickers = list(set(re.findall(r'[A-Z]{2,}', equation)))
    
    RESERVED_WORDS = ["SIN", "COS", "TAN", "LOG", "LOG10", "SQRT", "SMA", "EMA", "STD", "MAX", "MIN", "PI", "ABS", "EXP"]
    tickers = [t for t in tickers if t not in RESERVED_WORDS]

    if not tickers:
        tickers = ["SPY"]

    try:
        # [New] Range가 'custom'이고 날짜가 있으면 start/end 모드로 다운로드
        if req.range == 'custom' and req.start_date and req.end_date:
            print(f"[Logic] Downloading Custom Range: {req.start_date} ~ {req.end_date}")
            data = yf.download(
                tickers, 
                start=req.start_date, 
                end=req.end_date, 
                interval=req.interval, 
                progress=False, 
                auto_adjust=True
            )
        else:
            # 기존 방식 (Period)
            print(f"[Logic] Downloading Period: {req.range}")
            data = yf.download(
                tickers, 
                period=req.range, 
                interval=req.interval, 
                progress=False, 
                auto_adjust=True
            )
        
        # --- 데이터 전처리 (기존과 동일) ---
        if isinstance(data.columns, pd.MultiIndex):
            try:
                data = data['Close']
            except KeyError:
                pass 

        if len(tickers) == 1:
            data = pd.DataFrame(data)
            data.columns = tickers
        
        data = data.ffill().bfill()
        
        if data.empty:
            raise HTTPException(status_code=400, detail="데이터가 없습니다. (날짜나 티커를 확인하세요)")

        # --- 계산 및 결과 반환 (기존과 동일) ---
        result_series = calculate_equation(data, req.equation)
        result_list = []
        time_format = '%Y-%m-%d %H:%M' if 'm' in req.interval or 'h' in req.interval else '%Y-%m-%d'

        for date, value in result_series.items():
            if not math.isnan(value):
                result_list.append({
                    "t": date.strftime(time_format),
                    "value": float(value)
                })
        
        return result_list

    except Exception as e:
        print(f"[Error] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)