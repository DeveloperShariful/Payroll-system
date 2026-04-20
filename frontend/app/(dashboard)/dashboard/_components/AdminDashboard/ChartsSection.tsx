// frontend/app/(dashboard)/dashboard/_components/AdminDashboard/ChartsSection.tsx
"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useState, useEffect } from 'react';

const PIE_COLORS = ['#4f46e5', '#94a3b8']; // Indigo & Slate

export default function ChartsSection({ data }: { data: any }) {
  // 1. STATE TO DELAY CHART RENDER (Hydration & Width/Height Fix)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Only render charts after component has mounted in the browser
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // Avoid rendering on server-side

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Area Chart */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900">Payroll Expenditure Trend (6 Months)</h2>
          <p className="text-xs text-gray-500">Gross vs Tax withholding comparison</p>
        </div>
        
        {/* 2. SOLID FIX: Fixed height wrapper forcing ResponsiveContainer to behave */}
        <div style={{ width: '100%', height: 300, minHeight: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.payroll_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `$${value/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, undefined]}
              />
              <Area type="monotone" dataKey="expense" name="Gross Payroll" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              <Area type="monotone" dataKey="taxes" name="Taxes Withheld" stroke="#ef4444" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right: Pie Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
        <div className="mb-2">
          <h2 className="text-base font-semibold text-gray-900">Labor Union Distribution</h2>
          <p className="text-xs text-gray-500">Based on MS Access migrated JSONB data</p>
        </div>
        
        {/* SOLID FIX: Fixed height wrapper */}
        <div style={{ width: '100%', height: 250, minHeight: 250, flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.workforce_status}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data?.workforce_status?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`${value} Employees`, undefined]} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}