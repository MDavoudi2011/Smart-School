import React, { useEffect, useState, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { SchoolAPI } from '../api';
import { translateStatus, translateRole, showConfirm, showAlert, hashPasswordSHA256 } from '../utils';
import { getSupabase } from '../lib/supabase';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const toPersianNum = (num: number | string) => {
  if (num === null || num === undefined || num === '') return '';
  const numStr = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const isNegative = numStr.includes('-');
  
  const cleanStr = numStr.replace('-', '');
  let converted = cleanStr.replace(/[0-9]/g, (w) => persianDigits[parseInt(w)]);
  converted = converted.replace(/\./g, '٫');

  if (isNegative) {
    return `\u200E-${converted}`;
  }
  return converted;
};

const toPersianTemperature = (tempStr: string) => {
  if (tempStr === '--' || !tempStr) return '--';
  const isNegative = tempStr.includes('-');
  // Remove minus, °C, and other non-numeric characters to get clean digits
  const cleanStr = tempStr.replace('-', '').replace(/[^\d.]/g, '').trim();
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let converted = cleanStr.replace(/[0-9]/g, (w) => persianDigits[parseInt(w)]);
  converted = converted.replace(/\./g, '٫');
  
  if (isNegative) {
    return `-${converted}°C`;
  }
  return `${converted}°C`;
};

type AdminPanelProps = {
  activeTab: 'dashboard' | 'users' | 'tasks';
};

export default function AdminPanel({ activeTab }: AdminPanelProps) {
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('--');
  const [status, setStatus] = useState<string>('--');
  const [logs, setLogs] = useState<any[]>([]);

  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  
  // Realtime subscription ref
  const subscriptionRef = useRef<any>(null);

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalUserId, setModalUserId] = useState<string>('');
  const [modalUsername, setModalUsername] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  const [modalRole, setModalRole] = useState('teacher');
  const [modalClassId, setModalClassId] = useState('');
  const [modalTaskTitle, setModalTaskTitle] = useState('');

  // Initial loads Based on Tab
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadClasses();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'tasks') {
      loadTasks();
    }
  }, [activeTab]);

  // Load Dashboard Data
  const loadClasses = async () => {
    try {
      const cls = await SchoolAPI.fetchDistinctClasses();
      setClasses(cls);
      if (cls.length > 0 && !selectedClassId) {
        setSelectedClassId(cls[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!selectedClassId) return;

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    refreshDashboard(selectedClassId);

    const sub = getSupabase()
      .channel('admin-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'school_logs', filter: `class_id=eq.${selectedClassId}` }, (payload) => {
        setTemperature(payload.new.temperature + "°C");
        setStatus(translateStatus(payload.new.action_type));
        refreshDashboard(selectedClassId);
      })
      .subscribe();

    subscriptionRef.current = sub;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [selectedClassId]);

  const refreshDashboard = async (clsId: string) => {
    try {
      const latestLog = await SchoolAPI.fetchLatestLog(clsId);
      if (latestLog) {
        setTemperature(latestLog.temperature + "°C");
        setStatus(translateStatus(latestLog.action_type));
      } else {
        setTemperature("--");
        setStatus("خاموش");
      }

      const logsHistory = await SchoolAPI.fetchLogsHistory(clsId);
      setLogs(logsHistory || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    try {
      const u = await SchoolAPI.fetchUsers();
      setUsers(u);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTasks = async () => {
    try {
      const t = await SchoolAPI.fetchTasks();
      setTasks(t);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { username: modalUsername.trim(), role: modalRole, class_id: modalRole === 'teacher' ? modalClassId.trim() : null };
    try {
      if (modalPassword) {
        payload.password_hash = await hashPasswordSHA256(modalPassword);
      } else if (!modalUserId) {
        showAlert('خطا', 'رمز عبور الزامی است.', 'error');
        return;
      }

      await SchoolAPI.saveUser(modalUserId || null, payload);
      setIsUserModalOpen(false);
      showAlert('ذخیره شد', '', 'success');
      loadUsers();
    } catch (err) {
      showAlert('خطای امنیتی', 'دسترسی رد شد! فقط مدیر سیستم مجاز به تغییرات کاربران است.', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    showConfirm('حذف کاربر', 'آیا از حذف این حساب کاربری مطمئن هستید؟', 'حذف').then(async (result) => {
      if (result.isConfirmed) {
        try {
          await SchoolAPI.deleteUser(id);
          showAlert('حذف شد', '', 'success');
          loadUsers();
        } catch (err) {
          showAlert('خطا', 'دسترسی رد شد! شما مجوز حذف کاربر را ندارید.', 'error');
        }
      }
    });
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await SchoolAPI.insertTask(modalTaskTitle.trim());
      setIsTaskModalOpen(false);
      showAlert('وظیفه ثبت شد', '', 'success');
      loadTasks();
    } catch (err) {
      showAlert('خطا', 'دسترسی رد شد! شما مجوز تعریف کار جدید را ندارید.', 'error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    showConfirm('حذف کار روزانه', 'آیا از حذف این وظیفه مطمئن هستید؟', 'حذف').then(async (result) => {
      if (result.isConfirmed) {
        try {
          await SchoolAPI.deleteTask(id);
          showAlert('حذف شد', '', 'success');
          loadTasks();
        } catch (err) {
          showAlert('خطا', 'دسترسی رد شد! شما مجوز حذف این کار را ندارید.', 'error');
        }
      }
    });
  };

  const handleTriggerEmergency = () => {
    if (!selectedClassId) return;
    showConfirm('خروج اضطراری', `درب‌های کلاس ${selectedClassId} باز شوند؟`, 'تایید').then(async (result) => {
      if (result.isConfirmed) {
        try {
          await SchoolAPI.insertEmergencyCommand(selectedClassId);
          showAlert('دستور صادر شد', 'سیگنال بحران ارسال گردید.', 'success');
        } catch (err) {
          showAlert('خطای امنیتی', 'دسترسی رد شد! شما مجوز صدور فرمان اضطراری را ندارید.', 'error');
        }
      }
    });
  };

  const chartData = {
    labels: logs.map(l => new Date(l.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })),
    datasets: [{
      data: logs.map(l => l.temperature),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.3,
      fill: true
    }]
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: { family: 'Vazirmatn, Vazir, Tahoma', size: 12 },
        bodyFont: { family: 'Vazirmatn, Vazir, Tahoma', size: 12 },
        callbacks: {
          label: function(context: any) {
            let label = '';
            if (context.parsed.y !== null) {
              label += toPersianNum(context.parsed.y) + ' درجه سانتی‌گراد';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false as any },
        ticks: {
          font: { family: 'Vazirmatn, Vazir, Tahoma', size: 10 }
        }
      },
      y: {
        ticks: {
          font: { family: 'Vazirmatn, Vazir, Tahoma', size: 10 },
          callback: function(value: any) {
            return toPersianNum(value);
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6 flex-grow">
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl border border-base-content/5">
            <div className="card-body p-4 flex flex-row justify-between items-center gap-4 w-full">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <i className="bi bi-grid-fill text-xl flex items-center justify-center"></i>
                </div>
                <h3 className="card-title text-sm font-black flex items-center">انتخاب کلاس</h3>
              </div>
              <select 
                className="select select-bordered select-primary w-44 sm:w-64 font-bold select-sm sm:select-md"
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
              >
                {classes.length === 0 ? <option value="">در حال لود...</option> : null}
                {classes.map(c => <option key={c} value={c}>کلاس {c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="stats shadow-xl bg-base-100 border border-base-content/5 overflow-hidden">
              <div className="stat">
                <div className="stat-figure text-info flex items-center justify-center">
                  <i className="bi bi-thermometer-half text-4xl flex items-center justify-center"></i>
                </div>
                <div className="stat-title text-xs font-bold">دما</div>
                <div className="stat-value text-info tracking-tight" dir="ltr">{toPersianTemperature(temperature)}</div>
              </div>
            </div>
            <div className="stats shadow-xl bg-base-100 border border-base-content/5 overflow-hidden">
              <div className="stat">
                <div className="stat-figure text-secondary flex items-center justify-center">
                  <i className="bi bi-cpu-fill text-4xl flex items-center justify-center"></i>
                </div>
                <div className="stat-title text-xs font-bold">وضعیت</div>
                <div className="stat-value text-sm text-secondary font-black pt-2">{status}</div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-content/5">
            <div className="card-body">
              <div className="flex justify-between items-center mb-2">
                <h3 className="card-title text-base font-black flex items-center gap-2">
                  <i className="bi bi-graph-up text-primary flex items-center justify-center"></i> تغییرات دما
                </h3>
                <button onClick={() => refreshDashboard(selectedClassId)} className="btn btn-circle btn-ghost btn-sm text-primary flex items-center justify-center">
                  <i className="bi bi-arrow-clockwise text-lg flex items-center justify-center"></i>
                </button>
              </div>
              <div className="h-72 w-full">
                {logs.length > 0 ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs opacity-50">داده‌ای یافت نشد</div>
                )}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-error/20 p-6 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
                <i className="bi bi-exclamation-diamond text-3xl flex items-center justify-center"></i>
              </div>
              <h3 className="text-xl font-black text-error">وضعیت اضطراری</h3>
              <button onClick={handleTriggerEmergency} className="btn btn-error shadow-lg flex items-center gap-2 mx-auto">
                <i className="bi bi-exclamation-triangle-fill flex items-center justify-center"></i> باز کردن درب‌ها
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-row justify-between items-center gap-2 w-full">
            <div>
              <h2 className="text-lg sm:text-xl font-black">مدیریت کاربران</h2>
              <p className="text-[11px] sm:text-xs opacity-60">لیست پرسنل و دسترسی‌ها</p>
            </div>
            <button onClick={() => {
              setModalUserId(''); setModalUsername(''); setModalPassword(''); setModalRole('teacher'); setModalClassId(''); setIsUserModalOpen(true);
            }} className="btn btn-primary btn-sm flex items-center gap-1 px-3">
              <i className="bi bi-person-plus-fill flex items-center justify-center text-sm"></i>
              <span className="text-xs font-bold">افزودن کاربر</span>
            </button>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-x-auto">
            <table className="table table-zebra w-full text-sm">
              <thead>
                <tr>
                  <th>نام کاربری</th>
                  <th>نقش</th>
                  <th>کلاس</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={4} className="text-center opacity-50">کاربری یافت نشد.</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover">
                    <td className="font-bold">{u.username}</td>
                    <td><span className="badge badge-sm">{translateRole(u.role)}</span></td>
                    <td>{u.class_id || '--'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          setModalUserId(u.id); setModalUsername(u.username); setModalPassword(''); setModalRole(u.role); setModalClassId(u.class_id || ''); setIsUserModalOpen(true);
                        }} className="btn btn-square btn-ghost btn-xs text-info flex items-center justify-center"><i className="bi bi-pencil-square flex items-center justify-center"></i></button>
                        <button onClick={() => handleDeleteUser(u.id)} className="btn btn-square btn-ghost btn-xs text-error flex items-center justify-center"><i className="bi bi-trash3 flex items-center justify-center"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex flex-row justify-between items-center gap-2 w-full">
            <div>
              <h2 className="text-lg sm:text-xl font-black">مدیریت وظایف روزانه</h2>
              <p className="text-[11px] sm:text-xs opacity-60">تخصیص کارهای پرسنل خدمات</p>
            </div>
            <button onClick={() => {
              setModalTaskTitle(''); setIsTaskModalOpen(true);
            }} className="btn btn-primary btn-sm flex items-center gap-1 px-3">
              <i className="bi bi-plus-lg flex items-center justify-center text-sm"></i>
              <span className="text-xs font-bold">افزودن وظیفه</span>
            </button>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-x-auto">
            <table className="table table-zebra w-full text-sm">
              <thead>
                <tr>
                  <th>شرح وظیفه</th>
                  <th>وضعیت انجام</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan={3} className="text-center opacity-50">هیچ وظیفه‌ای ثبت نشده است.</td></tr>
                ) : tasks.map(t => (
                  <tr key={t.id} className="hover">
                    <td className="font-bold text-xs">{t.title}</td>
                    <td>
                      <span className={`badge ${t.status ? 'badge-success text-success-content' : 'badge-warning text-warning-content'} badge-sm font-bold`}>
                        {t.status ? 'انجام شده' : 'در انتظار'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleDeleteTask(t.id)} className="btn btn-square btn-ghost btn-xs text-error flex items-center justify-center">
                        <i className="bi bi-trash3 flex items-center justify-center"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modal */}
      {isUserModalOpen && (
        <dialog className="modal backdrop-blur-md modal-open">
          <div className="modal-box max-w-sm bg-neutral border border-base-content/10 relative p-6 rounded-2xl shadow-2xl text-neutral-content">
            <button type="button" onClick={() => setIsUserModalOpen(false)} className="btn btn-sm btn-circle btn-ghost absolute left-3 top-3 flex items-center justify-center">✕</button>
            <div className="flex items-center gap-2 text-primary border-b border-base-content/5 pb-3">
              <i className="bi bi-person-gear text-2xl flex items-center justify-center"></i>
              <h3 className="font-black text-base">{modalUserId ? 'ویرایش کاربر' : 'افزودن کاربر'}</h3>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4 mt-4">
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold text-neutral-content/70">نام کاربری</span></label>
                <input type="text" value={modalUsername} onChange={e => setModalUsername(e.target.value)} className="input input-bordered input-primary w-full input-sm text-base-content flex items-center" required />
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold text-neutral-content/70">رمز عبور</span></label>
                <input type="password" value={modalPassword} onChange={e => setModalPassword(e.target.value)} className="input input-bordered input-primary w-full input-sm text-base-content flex items-center" required={!modalUserId} />
                {modalUserId && <span className="text-[10px] opacity-40 mt-1 block">در صورت عدم تغییر خالی بگذارید.</span>}
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold text-neutral-content/70">نقش سیستم</span></label>
                <select value={modalRole} onChange={e => setModalRole(e.target.value)} className="select select-bordered select-primary w-full select-sm font-bold text-base-content" required>
                  <option value="teacher">معلم</option>
                  <option value="service">خدمات</option>
                  <option value="admin">مدیر</option>
                </select>
              </div>
              {modalRole === 'teacher' && (
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold text-neutral-content/70">کلاس اختصاصی</span></label>
                  <input type="text" value={modalClassId} onChange={e => setModalClassId(e.target.value)} placeholder="مثال: 803" className="input input-bordered input-primary w-full input-sm text-base-content flex items-center" required />
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-block btn-sm mt-4 shadow-lg flex items-center justify-center gap-1">
                <i className="bi bi-file-earmark-check flex items-center justify-center"></i> ذخیره اطلاعات
              </button>
            </form>
          </div>
        </dialog>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <dialog className="modal backdrop-blur-md modal-open">
          <div className="modal-box max-w-sm bg-neutral border border-base-content/10 relative p-6 rounded-2xl shadow-2xl text-neutral-content">
            <button type="button" onClick={() => setIsTaskModalOpen(false)} className="btn btn-sm btn-circle btn-ghost absolute left-3 top-3 flex items-center justify-center">✕</button>
            <div className="flex items-center gap-2 text-secondary border-b border-base-content/5 pb-3">
              <i className="bi bi-clipboard-plus text-2xl flex items-center justify-center"></i>
              <h3 className="font-black text-base">افزودن وظیفه جدید</h3>
            </div>
            <form onSubmit={handleSaveTask} className="space-y-4 mt-4">
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold text-neutral-content/70">شرح کار روزانه خدمات</span></label>
                <input type="text" value={modalTaskTitle} onChange={e => setModalTaskTitle(e.target.value)} placeholder="مثال: نظافت طبقه دوم" className="input input-bordered input-secondary w-full input-sm text-base-content flex items-center" required />
              </div>
              <button type="submit" className="btn btn-secondary btn-block btn-sm mt-4 shadow-lg flex items-center justify-center gap-1">
                <i className="bi bi-plus-circle flex items-center justify-center"></i> ثبت وظیفه روزانه
              </button>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
