// frontend/app/(dashboard)/dashboard/_components/AdminDashboard/SystemHealth.tsx
"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";

export default function SystemHealth({ activityData }: { activityData: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="border-b border-gray-100 pb-4 mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent System Activity</h2>
        </div>
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {activityData?.length > 0 ? (
              activityData.map((activity: any, eventIdx: number) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {eventIdx !== activityData.length - 1 ? (
                      <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          activity.type === 'success' ? 'bg-green-500' : 'bg-amber-500'
                        }`}>
                          {activity.type === 'success' 
                            ? <CheckCircle2 className="h-4 w-4 text-white" /> 
                            : <AlertCircle className="h-4 w-4 text-white" />
                          }
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-600">{activity.message}</p>
                        </div>
                        <div className="whitespace-nowrap text-right text-xs text-gray-400">
                          <time>{activity.time}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No recent activity found.</p>
            )}
          </ul>
        </div>
      </div>

      {/* System Health / Storage */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-sm border border-slate-700 p-6 text-white">
        <div className="border-b border-slate-700 pb-4 mb-6 flex justify-between items-center">
          <h2 className="text-base font-semibold text-white">Database & Migration Health</h2>
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">PostgreSQL JSONB Storage (Dynamic Columns)</span>
              <span className="font-mono text-emerald-400">Stable</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300">Legacy MS Access Connection</span>
              <span className="font-mono text-slate-400">Disconnected (Migrated)</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-slate-500 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-400 leading-relaxed">
              System is fully migrated to Modern Web Architecture. 200-300 legacy MS Access columns are currently being handled by PostgreSQL JSONB indexing ensuring lightning-fast performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}