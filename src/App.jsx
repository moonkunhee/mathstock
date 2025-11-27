import React, { useState, useEffect } from 'react';
import FunctionCard from './components/FunctionCard';
import StockChart from './components/StockChart';

const App = () => {
  // --- 1. State ---
  const [functions, setFunctions] = useState([
    { 
      id: 1, name: 'f1', equation: 'NVDA', 
      range: '1y', interval: '1d', 
      startDate: '2023-01-01', endDate: '2023-12-31', 
      color: '#8884d8', visible: true, data: [] 
    },
  ]);

  // --- 2. Logic & API ---
  const resolveEquation = (targetEquation, currentId, allFunctions) => {
    let resolved = targetEquation;
    let loopCount = 0;
    while (loopCount < 5) {
      let replaced = false;
      allFunctions.forEach(func => {
        if (func.id === currentId || !func.equation) return;
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

  const fetchCalculation = async (funcId, funcData) => { 
    const { equation, range, interval, startDate, endDate } = funcData;
    if (!equation.trim()) return;

    let finalEquation = resolveEquation(equation, funcId, functions);
    finalEquation = finalEquation.replace(/\bx\b/gi, 't');

    try {
      const API_URL = "http://localhost:8000"; // 필요시 ngrok 주소로 변경
      const response = await fetch(`${API_URL}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equation: finalEquation, range, interval, start_date: startDate, end_date: endDate })
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

  useEffect(() => {
    if (functions.length > 0) fetchCalculation(functions[0].id, functions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 3. Handlers ---
  const addFunction = () => {
    const newId = functions.length > 0 ? Math.max(...functions.map(f => f.id)) + 1 : 1;
    const today = new Date().toISOString().split('T')[0];
    setFunctions([...functions, { 
      id: newId, name: `f${newId}`, equation: '', 
      range: '1y', interval: '1d', startDate: '2024-01-01', endDate: today, 
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`, visible: true, data: [] 
    }]);
  };

  const removeFunction = (id) => setFunctions(functions.filter(f => f.id !== id));
  const toggleVisibility = (id) => setFunctions(prev => prev.map(f => f.id === id ? { ...f, visible: !f.visible } : f));
  
  const updateField = (id, field, value) => {
    setFunctions(prev => {
      const newFunctions = prev.map(f => {
        if (f.id === id) {
          const updatedFunc = { ...f, [field]: value };
          if (field !== 'color' && field !== 'name' && f.equation) {
             fetchCalculation(id, updatedFunc);
          }
          return updatedFunc;
        }
        return f;
      });
      return newFunctions;
    });
  };

  // --- 4. Render ---
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* Left Panel */}
      <div style={{ width: '400px', backgroundColor: '#f0f2f5', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', borderRight: '1px solid #ddd', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>Mathstock</h2>
        
        {functions.map((func) => (
          <FunctionCard 
            key={func.id} 
            func={func} 
            onUpdate={updateField} 
            onRemove={removeFunction} 
            onToggle={toggleVisibility}
            onCalculate={(f) => fetchCalculation(f.id, f)}
          />
        ))}

        <button onClick={addFunction} style={{ padding: '15px', fontSize: '1.5rem', cursor: 'pointer', backgroundColor: '#154360', color: 'white', border: 'none', borderRadius: '6px' }}>+</button>
      </div>

      {/* Right Panel */}
      <StockChart functions={functions} />
    </div>
  );
};

export default App;