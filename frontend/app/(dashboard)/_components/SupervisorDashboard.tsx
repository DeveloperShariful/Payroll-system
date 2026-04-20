// frontend/app/(dashboard)/_components/SupervisorDashboard.tsx
import Link from "next/link";

export default function SupervisorDashboard({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 border-t-4 border-orange-500">
          <dt>
            <p className="truncate text-sm font-medium text-gray-500">Labor Force Under Supervision</p>
          </dt>
          <dd className="flex items-baseline pb-6 sm:pb-7">
            <p className="text-3xl font-bold text-gray-900">{stats?.active_employees || 0}</p>
          </dd>
        </div>
        <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 border-t-4 border-yellow-500">
          <dt>
            <p className="truncate text-sm font-medium text-gray-500">Timesheets Awaiting Approval</p>
          </dt>
          <dd className="flex items-baseline pb-6 sm:pb-7">
            <p className="text-3xl font-bold text-orange-600">{stats?.pending_timesheets || 0}</p>
            {stats?.pending_timesheets > 0 && (
              <span className="ml-2 text-sm text-red-500 font-medium">(Action Required)</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white shadow p-6 border border-orange-100">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Daily Operations</h3>
          <div className="grid grid-cols-1 gap-4">
            <Link href="/timesheets" className="flex flex-col items-center justify-center p-6 border rounded-lg bg-orange-50 hover:bg-orange-100 border-orange-200 transition-colors">
              <span className="text-orange-700 font-semibold text-lg mb-1">Review & Approve Timesheets</span>
              <span className="text-sm text-orange-600 text-center">Verify labor hours to prevent payroll delays</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}