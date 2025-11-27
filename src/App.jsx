import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const App = () => {
  // --- 1. State 관리 ---
  const [functions, setFunctions] = useState([
    // 초기값: f1 = NVDA
    { id: 1, name: 'f1', equation: 'NVDA', range: '1y', interval: '1d', color: '#8884d8', visible: true, data: [] },
  ]);

  // --- 수식 참조 해결 함수 (f1 -> NVDA 변환) ---
  const resolveEquation = (targetEquation, currentId, allFunctions) => {
    let resolved = targetEquation;
    let loopCount = 0;
    const MAX_LOOPS = 5; 

    while (loopCount < MAX_LOOPS) {
      let replaced = false;
      allFunctions.forEach(func => {
        if (func.id === currentId) return;
        if (!func.equation) return;
        
        // 함수 이름(f1 등)을 찾아서 그 수식으로 치환
        const regex = new RegExp(`\\b${func.name}\\b`, 'g');
        if (regex.test(resolved)) {
          resolved = resolved.replace(regex, `(${func.equation})`);
          replaced = true;
        }
      });
      if (!replaced) break;
      loopCount++;
    }
    return resolved;
  };

  // --- 2. 서버 통신 ---
const fetchCalculation = async (funcId, equation, range, interval) => {
    if (!equation.trim()) return;

    let finalEquation = resolveEquation(equation, funcId, functions);
    finalEquation = finalEquation.replace(/\bx\b/gi, 't');

    try {
      // [수정됨] 복잡한 ngrok 주소 다 지우고, 그냥 '/calculate'만 남기세요!
      // Vite가 알아서 8000번으로 토스해줍니다.
      const response = await fetch('/calculate', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equation: finalEquation, range, interval })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`오류: ${errorData.detail}`);
        return;
      }

      const data = await response.json();
      setFunctions(prev => prev.map(f => f.id === funcId ? { ...f, data: data } : f));

    } catch (error) {
      console.error("Network Error:", error);
    }
  };

  // 초기 로딩
  useEffect(() => {
    if (functions.length > 0) {
      const f = functions[0];
      fetchCalculation(f.id, f.equation, f.range, f.interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 3. 핸들러 함수들 ---

  const addFunction = () => {
    const newId = functions.length > 0 ? Math.max(...functions.map(f => f.id)) + 1 : 1;
    setFunctions([
      ...functions,
      { 
        id: newId, 
        name: `f${newId}`, 
        equation: '', 
        range: '1y', 
        interval: '1d', 
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        visible: true,
        data: [] 
      }
    ]);
  };

  const removeFunction = (id) => {
    setFunctions(functions.filter(f => f.id !== id));
  };

  const toggleVisibility = (id) => {
    setFunctions(prev => prev.map(f => f.id === id ? { ...f, visible: !f.visible } : f));
  };

  const updateName = (id, newName) => {
    setFunctions(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const updateEquation = (id, newEquation) => {
    setFunctions(prev => prev.map(f => f.id === id ? { ...f, equation: newEquation } : f));
  };

  const updateRange = (id, newRange, currentInterval, equation) => {
    setFunctions(prev => prev.map(f => f.id === id ? { ...f, range: newRange } : f));
    if (equation) fetchCalculation(id, equation, newRange, currentInterval);
  };

  const updateInterval = (id, currentRange, newInterval, equation) => {
    setFunctions(prev => prev.map(f => f.id === id ? { ...f, interval: newInterval } : f));
    if (equation) fetchCalculation(id, equation, currentRange, newInterval);
  };

  const handleKeyDown = (e, id, equation, range, interval) => {
    if (e.key === 'Enter') {
      fetchCalculation(id, equation, range, interval);
    }
  };

  // --- 4. 데이터 병합 ---
  const mergedChartData = () => {
    const dataMap = {};
    functions.forEach(func => {
      if (!func.data || !Array.isArray(func.data)) return;
      func.data.forEach(point => {
        if (!point || !point.t) return;
        if (!dataMap[point.t]) dataMap[point.t] = { t: point.t };
        dataMap[point.t][func.name] = point.value; 
      });
    });
    return Object.values(dataMap).sort((a, b) => new Date(a.t) - new Date(b.t));
  };

  // --- 5. UI 렌더링 ---
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* Left Panel */}
      <div style={{ width: '380px', backgroundColor: '#f0f2f5', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', borderRight: '1px solid #ddd', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>Mathstock</h2>
        
        {functions.map((func) => (
          <div key={func.id} style={{ 
            backgroundColor: func.visible ? '#1b4f72' : '#5f6a6a', // 숨김 시 배경색 변경
            color: 'white', 
            borderRadius: '6px', 
            padding: '15px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px', 
            position: 'relative', 
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            transition: 'background-color 0.3s',
            border: func.visible ? '1px solid transparent' : '1px solid #999'
          }}>
            
            {/* 컨트롤 버튼 그룹 (항상 선명하게 보임) */}
            <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '8px', zIndex: 10 }}>
              {/* Hide/Show Button */}
              <button 
                onClick={() => toggleVisibility(func.id)} 
                title={func.visible ? "숨기기" : "보이기"}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: 'none', 
                  color: 'white', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  borderRadius: '4px',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {func.visible ? '👁️' : '🔒'} 
              </button>
              
              {/* Delete Button */}
              <button 
                onClick={() => removeFunction(func.id)}
                title="삭제"
                style={{ background: 'transparent', border: 'none', color: '#ffaaaa', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            {/* 입력 영역 (숨김 시 흐리게 처리) */}
            <div style={{ opacity: func.visible ? 1 : 0.4, transition: 'opacity 0.3s' }}>
              
              {/* 수식 입력부 */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  value={func.name}
                  onChange={(e) => updateName(func.id, e.target.value)}
                  disabled={!func.visible}
                  style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)', color: 'white', fontWeight: 'bold', fontSize: '1rem', width: '60px', marginRight: '5px', textAlign: 'right', outline: 'none' }}
                />
                <span style={{ color: 'white', marginRight: '8px', fontWeight: 'bold' }}>=</span>
                <input 
                  value={func.equation}
                  onChange={(e) => updateEquation(func.id, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, func.id, func.equation, func.range, func.interval)}
                  disabled={!func.visible}
                  placeholder="예: x + 100 또는 log(AAPL)"
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', flex: 1, borderRadius: '4px', outline: 'none' }}
                />
              </div>

              {/* 옵션 선택부 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#ccc' }}>Range:</span>
                  <select disabled={!func.visible} value={func.range} onChange={(e) => updateRange(func.id, e.target.value, func.interval, func.equation)} style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: 'none', borderRadius: '3px', padding: '4px', cursor: 'pointer', width: '120px' }}>
                    <option value="1d">1 Day</option><option value="5d">5 Days</option><option value="1mo">1 Month</option><option value="3mo">3 Months</option><option value="6mo">6 Months</option><option value="1y">1 Year</option><option value="2y">2 Years</option><option value="5y">5 Years</option><option value="max">Max</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#ccc' }}>Interval:</span>
                  <select disabled={!func.visible} value={func.interval} onChange={(e) => updateInterval(func.id, func.range, e.target.value, func.equation)} style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: 'none', borderRadius: '3px', padding: '4px', cursor: 'pointer', width: '120px' }}>
                    <option value="1m">1 Min</option><option value="5m">5 Mins</option><option value="15m">15 Mins</option><option value="30m">30 Mins</option><option value="1h">1 Hour</option><option value="1d">1 Day</option><option value="5d">5 Days</option><option value="1mo">1 Month</option>
                  </select>
                </div>
              </div>

            </div>
          </div>
        ))}

        <button onClick={addFunction} style={{ padding: '15px', fontSize: '1.5rem', cursor: 'pointer', backgroundColor: '#154360', color: 'white', border: 'none', borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>+</button>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, padding: '20px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mergedChartData()} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="t" tick={{fontSize: 12, fill: '#666'}} minTickGap={50} />
            <YAxis domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#666'}} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ddd' }} />
            <Legend verticalAlign="top" height={36}/>
            
            {functions.map((func) => (
              func.visible && (
                <Line 
                  key={func.id} 
                  type="monotone" 
                  dataKey={func.name} 
                  name={func.name} 
                  stroke={func.color} 
                  dot={false} 
                  strokeWidth={2} 
                  isAnimationActive={false} 
                  connectNulls={true} 
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default App;