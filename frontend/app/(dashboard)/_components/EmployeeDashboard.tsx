// frontend/app/(dashboard)/_components/EmployeeDashboard.tsx
import Link from "next/link";

export default function EmployeeDashboard({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
        <p className="text-green-800 text-sm font-medium">
          Welcome to the self-service portal. Please ensure you submit your daily timesheets before the end of your shift.
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 border-t-4 border-green-600">
          <dt>
            <p className="truncate text-sm font-medium text-gray-500">Total Net Pay Earned</p>
          </dt>
          <dd className="flex items-baseline pb-6 sm:pb-7">
            <p className="text-3xl font-bold text-gray-900">${stats?.my_total_earned?.toFixed(2) || "0.00"}</p>
          </dd>
        </div>
        <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 border-t-4 border-yellow-400">
          <dt>
            <p className="truncate text-sm font-medium text-gray-500">My Timesheets Pending Approval</p>
          </dt>
          <dd className="flex items-baseline pb-6 sm:pb-7">
            <p className="text-2xl font-semibold text-gray-900">{stats?.my_pending_timesheets || 0}</p>
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white shadow p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">My Actions</h3>
          <div className="grid grid-cols-1 gap-4">
            <Link href="/timesheets" className="flex items-center p-4 border rounded-lg hover:bg-green-50 hover:border-green-500 transition-colors">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-green-700 font-medium block">Submit Daily Timesheet</span>
                <span className="text-xs text-gray-500">Enter your regular and overtime hours</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}