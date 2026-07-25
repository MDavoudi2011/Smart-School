import { useEffect, useState } from 'react';
import { SchoolAPI } from '../api';

export default function TeacherPanel() {
  const [classId, setClassId] = useState<string>('...');
  const [absentees, setAbsentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const userSessionStr = localStorage.getItem("smart_school_user");
    if (userSessionStr) {
      const u = JSON.parse(userSessionStr);
      setClassId(u.class_id || 'نامشخص');
      calculateAbsentees(u.class_id);
    }
  }, []);

  const calculateAbsentees = async (cId: string) => {
    if (!cId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const allStudents = await SchoolAPI.fetchStudentsByClass(cId);
      if (!allStudents || allStudents.length === 0) {
        setAbsentees([]);
        setLoading(false);
        return;
      }
      
      const presentIds = await SchoolAPI.fetchTodayPresentStudents();
      const absent = allStudents.filter(student => !presentIds.includes(student.student_id));
      
      setAbsentees(absent);
    } catch (err) {
      console.error(err);
      setErrorMsg('خطا در بک‌اند');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 flex-grow">
      <div className="card bg-gradient-to-r from-primary to-indigo-700 text-primary-content shadow-xl">
        <div className="card-body flex flex-row justify-between items-center p-6">
          <div>
            <div className="badge badge-secondary font-black mb-1 flex items-center justify-center">معلم</div>
            <h2 className="text-2xl font-black tracking-tight">حضور و غیاب</h2>
            <p className="text-xs opacity-80 mt-1">کلاس: <span className="font-black underline">{classId}</span></p>
          </div>
          <div className="text-center bg-white/10 p-3 rounded-xl backdrop-blur-sm min-w-[90px] flex flex-col items-center justify-center">
            <span className="text-4xl font-black block tracking-tight">{absentees.length}</span>
            <span className="text-[10px] font-bold uppercase opacity-90">غایبین</span>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden">
        <div className="p-4 border-b border-base-content/10 flex justify-between items-center bg-base-200/50">
          <h3 className="font-black text-sm flex items-center gap-2">
            <i className="bi bi-person-x-fill text-error flex items-center justify-center"></i> لیست غایبین امروز
          </h3>
          <button onClick={() => calculateAbsentees(classId)} className="btn btn-primary btn-xs font-bold rounded-lg flex items-center justify-center">
            <i className="bi bi-arrow-clockwise flex items-center justify-center"></i> به‌روزرسانی
          </button>
        </div>
        <div className="divide-y divide-base-content/5">
          {loading ? (
            <div className="p-8 text-center text-base-content/40 flex items-center justify-center">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : errorMsg ? (
            <p className="text-center text-error p-4 text-xs">{errorMsg}</p>
          ) : absentees.length === 0 ? (
            <div className="p-8 text-center text-success font-bold text-sm">همه حاضر هستند.</div>
          ) : (
            absentees.map(student => (
              <div key={student.id} className="p-3 flex justify-between items-center bg-base-100 hover:bg-base-200/50">
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-error/10 text-error rounded-xl w-9 font-black text-sm flex items-center justify-center">
                      {student.name.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{student.name}</p>
                    <p className="text-[10px] opacity-40">کارت: {student.student_id}</p>
                  </div>
                </div>
                <span className="badge badge-error badge-sm font-bold flex items-center justify-center">غایب</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
