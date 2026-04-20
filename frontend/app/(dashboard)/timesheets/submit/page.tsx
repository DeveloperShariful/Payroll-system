// frontend/app/(dashboard)/timesheets/submit/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTimesheet } from "@/lib/api/api_timesheets";
import { useAuthStore } from "@/store/useAuthStore";
import { Calendar, Clock, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SubmitTimesheetPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    work_date: today,
    regular_hours: "8.0",
    overtime_hours: "0.0",
    double_time_hours: "0.0",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        // Safe mapping of employee ID
        employee_id: 1,
        work_date: formData.work_date,
        regular_hours: parseFloat(formData.regular_hours) || 0,
        overtime_hours: parseFloat(formData.overtime_hours) || 0,
        double_time_hours: parseFloat(formData.double_time_hours) || 0,
      };

      await createTimesheet(payload);
      setMessage({ type: 'success', text: "Success! Your timesheet has been submitted." });
      
      setTimeout(() => {
        router.push("/timesheets");
      }, 2000);
      
    } catch (err: any) {
      let errorText = "An unexpected error occurred.";
      
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorText = detail;
        } else if (Array.isArray(detail)) {
          // Fix: Extracting the human-readable message from Pydantic error array
          errorText = detail.map((e: any) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(", ");
        }
      }
      
      setMessage({ type: 'error', text: errorText });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/timesheets" className="text-gray-400 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Daily Timesheet Entry
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-8">Record your labor hours for the selected date.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
            <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Reporting Rules
            </h3>
            <ul className="space-y-3 text-sm text-indigo-800">
              <li className="flex items-start gap-2"><span>•</span> Standard shift: 8.0 hrs</li>
              <li className="flex items-start gap-2"><span>•</span> Overtime: Any hours {'>'} 8.0</li>
              <li className="flex items-start gap-2"><span>•</span> Status: Locks after supervisor approval</li>
            </ul>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
            
            {message && (
              <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
                message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Work Date *</label>
                <input 
                  type="date" name="work_date" required 
                  value={formData.work_date} onChange={handleChange} max={today}
                  className="block w-full sm:w-1/2 rounded-lg border-gray-300 shadow-sm p-3 border focus:ring-indigo-500" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Regular</label>
                  <input type="number" step="0.5" name="regular_hours" value={formData.regular_hours} onChange={handleChange} className="w-full text-xl font-bold text-center bg-transparent border-none focus:ring-0" />
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <label className="block text-xs font-bold text-amber-600 uppercase mb-2">Overtime</label>
                  <input type="number" step="0.5" name="overtime_hours" value={formData.overtime_hours} onChange={handleChange} className="w-full text-xl font-bold text-center bg-transparent border-none focus:ring-0 text-amber-700" />
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <label className="block text-xs font-bold text-purple-600 uppercase mb-2">Double</label>
                  <input type="number" step="0.5" name="double_time_hours" value={formData.double_time_hours} onChange={handleChange} className="w-full text-xl font-bold text-center bg-transparent border-none focus:ring-0 text-purple-700" />
                </div>
              </div>

              <button 
                type="submit" disabled={isSubmitting} 
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                {isSubmitting ? "Submitting..." : "Submit Timesheet"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}