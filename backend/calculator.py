import pandas as pd
import numpy as np
from simpleeval import SimpleEval, NameNotDefined

# 1. 사용 가능한 커스텀 금융 함수 정의
def sma(series, window):
    # 데이터프레임 시리즈가 들어왔을 때만 계산 (숫자가 들어오면 그대로 반환)
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
# 여기에 정의된 함수 외에는 실행되지 않아 안전합니다.
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
    
    # [NEW] 거듭제곱 연산자 변환 (^ -> **)
    # 파이썬은 ^를 XOR 비트 연산으로 인식하므로, 제곱 연산자 **로 바꿔줍니다.
    # 예: x^2 -> x**2
    equation = equation.replace('^', '**')

    # 4. 변수 목록 생성 (주가 데이터 컬럼들 + 시간변수 t)
    names = ALLOWED_NAMES.copy()
    
    if not data.empty:
        for ticker in data.columns:
            names[ticker] = data[ticker]
            
        # 시간 변수 't' 추가 (0, 1, 2... 인덱스)
        names['t'] = pd.Series(np.arange(len(data)), index=data.index)
    else:
        # 데이터가 없을 때도 계산기 초기화는 되어야 함
        names['t'] = 0

    # 5. SimpleEval 객체 생성 (보안 샌드박스)
    # functions: 실행 가능한 함수 목록
    # names: 접근 가능한 변수 목록
    evaluator = SimpleEval(functions=ALLOWED_FUNCTIONS, names=names)

    try:
        # 6. 안전하게 계산 실행
        # 수식에 "import os" 같은 위험한 코드가 있으면 여기서 에러 발생
        result = evaluator.eval(equation)
        
        # 결과가 숫자 하나(Scalar)인 경우, 시리즈로 확장 (예: y = 100)
        # 데이터가 있다면 그 길이에 맞춰서 상수를 채워줌
        if isinstance(result, (int, float, np.number)):
            if not data.empty:
                result = pd.Series(result, index=data.index)
            
        return result

    except NameNotDefined as e:
        # 허용되지 않은 변수나 함수를 썼을 때
        raise ValueError(f"알 수 없는 변수나 함수입니다: {e.name}")
    except Exception as e:
        # 그 외 계산 오류 (0으로 나누기 등)
        raise ValueError(f"계산 오류: {str(e)}")