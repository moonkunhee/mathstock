import pandas as pd
import numpy as np

# 1. 사용 가능한 수학 함수 정의 (확장 가능)
def sma(series, window):
    """단순 이동 평균 (Simple Moving Average)"""
    return series.rolling(window=int(window)).mean()

def ema(series, window):
    """지수 이동 평균 (Exponential Moving Average)"""
    return series.ewm(span=int(window), adjust=False).mean()

def std(series, window):
    """표준편차 (Standard Deviation)"""
    return series.rolling(window=int(window)).std()

# 2. eval 함수가 사용할 '허용된 함수 목록' (보안 및 편의성)
ALLOWED_FUNCTIONS = {
    # Numpy 수학 함수
    "sin": np.sin,
    "cos": np.cos,
    "tan": np.tan,
    "log": np.log,      # 자연로그 (ln)
    "log10": np.log10,  # 상용로그
    "exp": np.exp,
    "sqrt": np.sqrt,
    "abs": np.abs,
    "max": np.maximum,  # 두 시리즈 중 큰 값
    "min": np.minimum,  # 두 시리즈 중 작은 값
    
    # 커스텀 금융 함수
    "sma": sma, # 사용법: sma(AAPL, 20)
    "ema": ema,
    "std": std,
    
    # 상수
    "pi": np.pi,
    "e": np.e
}

def calculate_equation(data: pd.DataFrame, equation: str):
    """
    data: 주가 데이터가 담긴 DataFrame (컬럼명: AAPL, TSLA 등)
    equation: 사용자가 입력한 수식 문자열 (예: "sin(AAPL) + sma(TSLA, 20)")
    """
    
    # 3. 계산 컨텍스트 생성 (변수명 -> 실제 데이터 매핑)
    # data의 컬럼(종목코드)들을 변수로 사용할 수 있게 등록
    context = ALLOWED_FUNCTIONS.copy()
    
    for ticker in data.columns:
        context[ticker] = data[ticker]

    # 4. 시간 변수 't' 추가 (0부터 시작하는 정수 인덱스)
    # f(t) = t^2 같은 수식을 위해
    context['t'] = pd.Series(np.arange(len(data)), index=data.index)

    try:
        # 5. 파이썬 내장 eval() 사용
        # __builtins__: None으로 설정하여 위험한 파이썬 명령어 실행 방지 (최소한의 보안)
        result = eval(equation, {"__builtins__": None}, context)
        
        # 결과가 숫자 하나(Scalar)인 경우, 시리즈로 확장 (예: y = 100)
        if isinstance(result, (int, float, np.number)):
            result = pd.Series(result, index=data.index)
            
        return result

    except Exception as e:
        # 어떤 에러인지 명확히 전달
        raise ValueError(f"계산 오류: {str(e)}")
