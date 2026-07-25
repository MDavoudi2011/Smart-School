import { useEffect, useState } from 'react';
import { SchoolAPI } from '../api';
import { showAlert } from '../utils';

export default function ServicePanel() {
  const [bins, setBins] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingBins, setLoadingBins] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    loadBins();
    loadTasks();
  }, []);

  const loadBins = async () => {
    setLoadingBins(true);
    try {
      const b = await SchoolAPI.fetchBins();
      setBins(b || []);
    } catch (err) {
      console.error(err);
    }
    setLoadingBins(false);
  };

  const loadTasks = async () => {
    setLoadingTasks(true);
    try {
      const t = await SchoolAPI.fetchTasks();
      setTasks(t || []);
    } catch (err) {
      console.error(err);
    }
    setLoadingTasks(false);
  };

  const handleEmptyBin = async (binId: string) => {
    try {
      await SchoolAPI.resetBinLevel(binId);
      showAlert('تخلیه شد', '', 'success');
      loadBins();
    } catch (err) {
      showAlert('خطا', 'عدم دسترسی یا مجوز برای تخلیه سطل', 'error');
    }
  };

  const handleToggleTask = async (id: string, currentStatus: boolean) => {
    try {
      await SchoolAPI.updateTaskStatus(id, currentStatus);
      loadTasks();
    } catch (err) {
      showAlert('خطا', 'عدم دسترسی یا هماهنگی با سرور', 'error');
    }
  };

  return (
    <div className="space-y-6 flex-grow">
      <div className="card bg-base-100 shadow-xl border border-base-content/5">
        <div className="card-body">
          <h3 className="card-title text-base font-black flex items-center gap-2 mb-4">
            <i className="bi bi-trash3-fill text-secondary flex items-center justify-center"></i> وضعیت سطل‌های زباله
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingBins ? (
              <div className="p-8 text-center text-base-content/40 col-span-full flex items-center justify-center">
                <span className="loading loading-spinner loading-md text-secondary"></span>
              </div>
            ) : bins.length === 0 ? (
              <p className="text-center text-xs opacity-50 p-4 col-span-full">سطل زباله‌ای یافت نشد.</p>
            ) : (
              bins.map(bin => {
                const isFull = bin.fill_level > 80;
                return (
                  <div key={bin.id} className={`card ${isFull ? 'bg-error/10 border-error/20' : 'bg-base-200/60 border-base-content/5'} border p-4 shadow-sm flex flex-col justify-between gap-4`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-base-100 text-xl flex items-center justify-center">
                          <i className={`bi bi-trash3 flex items-center justify-center ${isFull ? 'text-error' : 'text-success'}`}></i>
                        </div>
                        <div>
                          <h4 className="font-black text-sm">{bin.location || 'موقعیت نامشخص'}</h4>
                          <p className={`text-xs font-bold mt-0.5 ${isFull ? 'text-error' : 'text-success'}`}>ظرفیت: {bin.fill_level}%</p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleEmptyBin(bin.id)} 
                      className={`btn btn-outline ${isFull ? 'btn-error' : 'btn-sm'} btn-xs font-bold w-full rounded-lg flex items-center justify-center`}
                    >
                      تخلیه
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl border border-base-content/5">
        <div className="card-body">
          <h3 className="card-title text-base font-black text-gray-400 mb-3">
            <i className="bi bi-calendar2-check-fill text-success flex items-center justify-center"></i> لیست وظایف روزانه
          </h3>
          <div className="space-y-2">
            {loadingTasks ? (
              <div className="p-4 text-center text-base-content/40 flex items-center justify-center">
                <span className="loading loading-spinner loading-md text-success"></span>
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-xs text-base-content/40 text-center py-4">امروز هیچ وظیفه‌ای برای شما ثبت نشده است.</p>
            ) : (
              tasks.map(task => (
                <label key={task.id} className="label cursor-pointer justify-between bg-base-200/40 p-3 rounded-xl border border-base-content/5 hover:bg-base-200/80 transition-all">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      onChange={() => handleToggleTask(task.id, task.status)}
                      checked={task.status}
                      className="checkbox checkbox-success checkbox-sm flex items-center justify-center" 
                    />
                    <span className={`label-text text-sm ${task.status ? 'line-through opacity-40' : ''}`}>{task.title}</span>
                  </div>
                  <span className="text-[10px] font-bold opacity-50">{task.status ? 'پایان یافته' : 'در دست اقدام'}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
