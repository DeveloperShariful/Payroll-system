// app/(dashboard)/system/migration-tools/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getMigrationStatus, startMigrationBatch } from "@/lib/api/api_migration";

export default function MigrationToolsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [batchSize, setBatchSize] = useState("500");
  const [isMigrating, setIsMigrating] = useState(false);
  const [message, setMessage] = useState("");

  const fetchLogs = async () => {
    try {
      const data = await getMigrationStatus(5);
      if (Array.isArray(data)) setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs");
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStartMigration = async () => {
    setIsMigrating(true);
    setMessage("");
    try {
      const res = await startMigrationBatch(parseInt(batchSize));
      setMessage(res.message);
      fetchLogs();
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Migration failed to start.");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Legacy System Migration Tools</h1>
        <p className="mt-1 text-sm text-gray-500">Trigger ETL processes to extract data from MS Access (SQL Server) to PostgreSQL.</p>
      </div>

      <div className="bg-white shadow sm:rounded-lg p-6 max-w-2xl border-l-4 border-indigo-600">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Run Migration Batch</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Extracts the 200+ column table, maps core fields, and packs the rest into the JSONB dynamic attributes.</p>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <input
            type="number"
            value={batchSize}
            onChange={(e) => setBatchSize(e.target.value)}
            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            placeholder="Batch Size"
          />
          <button
            onClick={handleStartMigration}
            disabled={isMigrating}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {isMigrating ? "Initializing..." : "Start ETL Pipeline"}
          </button>
        </div>
        {message && <div className="mt-4 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-md">{message}</div>}
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow mt-8">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Migration Logs</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Started At</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Migrated</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Skipped</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {logs.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No logs found</td></tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{new Date(log.started_at).toLocaleString()}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <span className={`px-2 py-1 rounded-full text-xs ${log.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{log.migrated_records}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{log.skipped_records}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}