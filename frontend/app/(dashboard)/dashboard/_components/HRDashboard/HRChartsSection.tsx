// frontend/app/(dashboard)/dashboard/_components/HRDashboard/HRChartsSection.tsx
"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { useState, useEffect } from 'react';

const TAX_COLORS = ['#ef4444', '#f59e0b', '#8b5cf6']; // Red, Amber, Violet

export default function HRChartsSection({ data }: { data: any }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Stacked Bar Chart for Departments */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900">Departmental Payroll Distribution</h2>
          <p className="text-xs text-gray-500">Gross vs Net Pay breakdown across active labor units</p>
        </div>
        
        <div style={{ width: '100%', height: 300, minHeight: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.department_payroll} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `$${value/1000}k`} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, undefined]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Gross Pay" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Net Pay" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right: Donut Chart for Taxes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
        <div className="mb-2">
          <h2 className="text-base font-semibold text-gray-900">YTD Tax & Deductions</h2>
          <p className="text-xs text-gray-500">Federal, State, and Union Dues</p>
        </div>
        
        <div style={{ width: '100%', height: 250, minHeight: 250, flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.tax_summary}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data?.tax_summary?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={TAX_COLORS[index % TAX_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, undefined]} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}