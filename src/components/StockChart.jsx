import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const StockChart = ({ functions }) => {
  // 데이터 병합 로직을 컴포넌트 내부로 이동
  const mergedChartData = () => {
    const dataMap = {};
    functions.forEach(func => {
      if (!func.visible || !func.data || !Array.isArray(func.data)) return;
      func.data.forEach(point => {
        if (!point || !point.t) return;
        if (!dataMap[point.t]) dataMap[point.t] = { t: point.t };
        dataMap[point.t][func.name] = point.value; 
      });
    });
    return Object.values(dataMap).sort((a, b) => new Date(a.t) - new Date(b.t));
  };

  return (
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
  );
};

export default StockChart;
