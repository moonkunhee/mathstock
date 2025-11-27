import pandas as pd
import numpy as np
from simpleeval import SimpleEval, NameNotDefined

# 1. 사용 가능한 커스텀 금융 함수 정의
def sma(series, window):
    # 숫자가 들어오면(예: sma(100, 20)) 그냥 반환하도록 방어
    if isinstance(series, pd.Series):
        return series.rolling(window=int(window)).mean()
    return series

def ema(series, window):
    if isinstance(series, pd.Series):
        return series.ewm(span=int(window), adjust=False).mean()
    return series

def std(series, window):
    if isinstance(series, pd.Series):
        return series.rolling(window=int(window)).std()
    return series

# 2. 허용할 함수 목록 (화이트리스트)
# 여기에 없는 함수는 절대로 실행되지 않습니다.
ALLOWED_FUNCTIONS = {
    # Numpy 수학 함수
    "sin": np.sin,
    "cos": np.cos,
    "tan": np.tan,
    "log": np.log,
    "log10": np.log10,
    "exp": np.exp,
    "sqrt": np.sqrt,
    "abs": np.abs,
    "max": np.maximum,
    "min": np.minimum,
    
    # 커스텀 금융 함수
    "sma": sma,
    "ema": ema,
    "std": std,
}

# 3. 허용할 상수 목록
ALLOWED_NAMES = {
    "pi": np.pi,
    "e": np.e
}

def calculate_equation(data: pd.DataFrame, equation: str):
    """
    안전한 수식 계산기 (simpleeval 사용)
    """
    
    # 4. 변수 목록 생성 (주가 데이터 컬럼들 + 시간변수 t)
    # 해커가 시스템 변수(__builtins__ 등)에 접근하는 것을 원천 차단합니다.
    names = ALLOWED_NAMES.copy()
    
    if not data.empty:
        for ticker in data.columns:
            names[ticker] = data[ticker]
            
        # 시간 변수 't' 추가 (0, 1, 2...)
        names['t'] = pd.Series(np.arange(len(data)), index=data.index)
    else:
        # 데이터가 없을 때도 계산기 초기화는 되어야 함
        names['t'] = 0

    # 5. SimpleEval 객체 생성 (안전한 샌드박스)
    evaluator = SimpleEval(functions=ALLOWED_FUNCTIONS, names=names)

    try:
        # 6. 안전하게 계산 실행
        # 수식에 "import os" 같은 게 있으면 여기서 바로 에러가 납니다.
        result = evaluator.eval(equation)
        
        # 결과가 숫자 하나(Scalar)인 경우, 시리즈로 확장 (예: y = 100)
        if isinstance(result, (int, float, np.number)):
            if not data.empty:
                result = pd.Series(result, index=data.index)
            
        return result

    except NameNotDefined as e:
        # 허용되지 않은 변수나 함수를 썼을 때
        raise ValueError(f"알 수 없는 변수나 함수입니다: {e.name}")
    except Exception as e:
        # 그 외 계산 오류
        raise ValueError(f"계산 오류: {str(e)}")
