import React, { useState, useRef } from 'react';

const FunctionCard = ({ func, onUpdate, onRemove, onToggle, onCalculate }) => {
  const [showMath, setShowMath] = useState(false);
  const inputRef = useRef(null);

  // 엔터 키를 눌렀을 때 계산 요청
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onCalculate(func);
  };

  // Math 패드 버튼 클릭 시 수식 삽입
  const insertMath = (text) => {
    if (!func.visible) return;
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const currentVal = func.equation || "";
      
      // 커서 위치에 텍스트 삽입
      const newVal = currentVal.substring(0, start) + text + currentVal.substring(end);
      
      // 상태 업데이트 (서버 요청 X)
      onUpdate(func.id, 'equation', newVal);
      
      // 입력 후 포커스 유지 및 커서 이동
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    }
  };

  const mathButtons = [
    '+', '-', '*', '/', '^', '(', ')',
    'sin(', 'cos(', 'log(', 'sqrt(',
    'sma(', 'ema(', 'std(', 'pi', 'e'
  ];

  return (
    <div style={{ 
      backgroundColor: func.visible ? '#154360' : '#546e7a', 
      color: 'white', 
      borderRadius: '8px', 
      padding: '20px', 
      display: 'flex', flexDirection: 'column', gap: '15px', 
      position: 'relative', 
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)', 
      transition: 'background-color 0.3s',
      border: func.visible ? '1px solid #1f618d' : '1px solid #999'
    }}>
      
      {/* 1. 상단 컨트롤 (눈, 삭제) - 우측 상단 고정 */}
      <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '10px', zIndex: 10 }}>
        <button onClick={() => onToggle(func.id)} title="Toggle Visibility" 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', padding: 0, opacity: 0.8 }}>
          {func.visible ? '👁️' : '🔒'} 
        </button>
        <button onClick={() => onRemove(func.id)} title="Delete Function" 
          style={{ background: 'transparent', border: 'none', color: '#ff8a80', cursor: 'pointer', fontSize: '18px', padding: 0, fontWeight: 'bold' }}>
            ✕
        </button>
      </div>

      <div style={{ opacity: func.visible ? 1 : 0.5, transition: 'opacity 0.3s' }}>
        
        {/* 2. 수식 입력 영역 (헤더) */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', paddingRight: '60px' }}>
          <input
            value={func.name}
            onChange={(e) => onUpdate(func.id, 'name', e.target.value)}
            disabled={!func.visible}
            style={{ 
              background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.3)', 
              color: 'white', fontWeight: 'bold', fontSize: '1.2rem', width: '50px', textAlign: 'right', outline: 'none', paddingBottom: '2px' 
            }}
          />
          <span style={{ color: 'white', margin: '0 10px', fontWeight: 'bold', fontSize: '1.2rem' }}>=</span>
          <input 
            ref={inputRef}
            value={func.equation}
            onChange={(e) => onUpdate(func.id, 'equation', e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => onCalculate(func)} // [핵심] 입력창에서 나갈 때 계산 요청
            disabled={!func.visible}
            placeholder="ex: NVDA"
            style={{ 
              background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', padding: '10px', 
              flex: 1, borderRadius: '6px', outline: 'none', fontSize: '1rem', minWidth: 0 
            }}
          />
        </div>

        {/* 3. 하단 옵션 영역 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          
          {/* 왼쪽: 드롭다운 그룹 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* Domain Row */}
            <div style={{ display: 'flex', alignItems: 'center', width: '220px', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', color: '#ddd' }}>Domain:</span>
              <select 
                disabled={!func.visible} 
                value={func.range} 
                onChange={(e) => onUpdate(func.id, 'range', e.target.value)}
                style={{ 
                  background: '#0e2f44', color: 'white', border: '1px solid #2980b9', 
                  borderRadius: '4px', padding: '6px', cursor: 'pointer', width: '130px', fontSize: '0.9rem' 
                }}
              >
                <option value="1d">1 Day</option><option value="1mo">1 Month</option><option value="1y">1 Year</option><option value="5y">5 Years</option><option value="custom">Custom</option>
              </select>
            </div>

            {/* Interval Row */}
            <div style={{ display: 'flex', alignItems: 'center', width: '220px', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', color: '#ddd' }}>Interval:</span>
              <select 
                disabled={!func.visible} 
                value={func.interval} 
                onChange={(e) => onUpdate(func.id, 'interval', e.target.value)}
                style={{ 
                  background: '#0e2f44', color: 'white', border: '1px solid #2980b9', 
                  borderRadius: '4px', padding: '6px', cursor: 'pointer', width: '130px', fontSize: '0.9rem' 
                }}
              >
                <option value="1m">1 Min</option><option value="1h">1 Hour</option><option value="1d">1 Day</option><option value="1wk">1 Week</option><option value="1mo">1 Month</option>
              </select>
            </div>
          </div>

          {/* 오른쪽: 액션 버튼 그룹 (Math & Color) */}
          <div style={{ display: 'flex', gap: '15px' }}>
            
            {/* Math Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '500' }}>Math</span>
              <button
                onClick={() => setShowMath(!showMath)}
                disabled={!func.visible}
                style={{ 
                  width: '80px', height: '40px', 
                  border: '1px solid rgba(255,255,255,0.7)', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  backgroundColor: showMath ? '#2980b9' : '#1a5276',
                  color: 'white', fontSize: '0.9rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                function
              </button>
            </div>

            {/* Color Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '500' }}>Color</span>
              <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                <input 
                  type="color" 
                  value={func.color} 
                  onChange={(e) => onUpdate(func.id, 'color', e.target.value)}
                  style={{ 
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%', padding: '0', 
                    border: '2px solid rgba(255,255,255,0.5)', 
                    borderRadius: '6px', cursor: 'pointer', 
                    backgroundColor: 'transparent',
                    boxSizing: 'border-box'
                  }} 
                />
              </div>
            </div>

          </div>
        </div>

        {/* Math Keypad */}
        {showMath && func.visible && (
          <div style={{ 
            marginTop: '15px', padding: '10px', 
            background: 'rgba(0,0,0,0.2)', borderRadius: '6px',
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px'
          }}>
            {mathButtons.map((btn) => (
              <button
                key={btn}
                onClick={() => insertMath(btn)}
                style={{
                  padding: '8px 0',
                  background: '#2471a3',
                  border: '1px solid #5499c7',
                  borderRadius: '4px',
                  color: 'white', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: 'bold',
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#2471a3'}
              >
                {btn}
              </button>
            ))}
          </div>
        )}

        {/* Custom Date Input */}
        {func.range === 'custom' && (
          <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#ddd' }}>Start Date:</span>
              <input type="date" value={func.startDate} onChange={(e) => onUpdate(func.id, 'startDate', e.target.value)} style={{ background: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.9rem', width: '140px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#ddd' }}>End Date:</span>
              <input type="date" value={func.endDate} onChange={(e) => onUpdate(func.id, 'endDate', e.target.value)} style={{ background: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.9rem', width: '140px' }} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FunctionCard;