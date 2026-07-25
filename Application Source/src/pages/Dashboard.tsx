import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import AdminPanel from '../components/AdminPanel';
import TeacherPanel from '../components/TeacherPanel';
import ServicePanel from '../components/ServicePanel';
import { handleLogout, translateRole } from '../utils';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'users' | 'tasks'>('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "داشبورد مدیریت";
    document.documentElement.setAttribute('data-theme', 'night');
    document.documentElement.setAttribute('dir', 'rtl');

    const userSessionStr = localStorage.getItem("smart_school_user");
    if (!userSessionStr) {
      navigate('/login');
      return;
    }
    const u = JSON.parse(userSessionStr);
    setUser(u);
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="flex-1 bg-base-300 text-base-content custom-gradient w-full">
      <div className="drawer lg:drawer-open">
        <input id="system-drawer" type="checkbox" className="drawer-toggle" />
        
        <div className="drawer-content flex flex-col min-h-screen">
          
          <div className="navbar bg-base-100/60 backdrop-blur-md shadow-md sticky top-0 z-40 border-b border-base-content/10 px-4 h-16 lg:hidden">
            <div className="flex-none lg:hidden">
              <label htmlFor="system-drawer" className="btn btn-square btn-ghost flex items-center justify-center">
                <i className="bi bi-list text-2xl flex items-center justify-center"></i>
              </label>
            </div>
            <div className="flex-1">
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                مدرسه هوشمند
              </span>
            </div>
            <div className="flex-none gap-2 items-center flex">
              <div className="flex items-center justify-center h-8 px-3 rounded-lg border border-primary/30 bg-primary/5">
                <span className="text-xs font-bold text-primary flex items-center justify-center">
                  {user.username} | {translateRole(user.role)}
                </span>
              </div>
              <button onClick={handleLogout} className="btn btn-square btn-error btn-outline btn-sm flex items-center justify-center">
                <i className="bi bi-box-arrow-left text-base flex items-center justify-center"></i>
              </button>
            </div>
          </div>

          <main className="p-4 sm:p-6 flex-grow space-y-6 max-w-[1600px] w-full mx-auto flex flex-col items-stretch">
            {user.role === 'admin' && <AdminPanel activeTab={adminTab} />}
            {user.role === 'teacher' && <TeacherPanel />}
            {user.role === 'service' && <ServicePanel />}
          </main>

          <Footer />
        </div> 

        <div className="drawer-side z-50 shadow-2xl">
          <label htmlFor="system-drawer" className="drawer-overlay"></label> 
          <div className="w-72 min-h-screen bg-base-200 border-l border-base-content/10 flex flex-col justify-between">
            <div className="flex flex-col">
              <div className="h-16 px-6 border-b border-base-content/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-xl w-9 h-9 flex items-center justify-center shadow-lg">
                      <i className="bi bi-building-fill text-[22px] flex items-center justify-center"></i>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <h2 className="font-black text-[18px] tracking-tight text-base-content">پنل مدرسه هوشمند</h2>
                  </div>
                </div>
                <label htmlFor="system-drawer" className="btn btn-sm btn-circle btn-ghost lg:hidden flex items-center justify-center">
                  <i className="bi bi-x-lg text-sm flex items-center justify-center"></i>
                </label>
              </div>
              
              <div className="p-4 space-y-6 flex flex-col">
                <div className="flex flex-col gap-1.5 font-bold">
                  <button
                    onClick={() => setAdminTab('dashboard')} 
                    className={`flex items-center w-full gap-3 px-4 py-3 text-sm rounded-xl transition-all ${adminTab === 'dashboard' ? 'bg-primary/10 text-primary' : 'hover:bg-base-300/70 text-base-content/80 hover:text-base-content'}`}
                  >
                    <i className="bi bi-house-door-fill text-lg flex items-center justify-center"></i> میز کار اصلی
                  </button>
                  {user.role === 'admin' && (
                    <>
                      <button
                        onClick={() => setAdminTab('users')} 
                        className={`flex items-center w-full gap-3 px-4 py-3 text-sm rounded-xl transition-all ${adminTab === 'users' ? 'bg-primary/10 text-primary' : 'hover:bg-base-300/70 text-base-content/80 hover:text-base-content'}`}
                      >
                        <i className="bi bi-people-fill text-lg flex items-center justify-center"></i> مدیریت کاربران
                      </button>
                      <button
                        onClick={() => setAdminTab('tasks')} 
                        className={`flex items-center w-full gap-3 px-4 py-3 text-sm rounded-xl transition-all ${adminTab === 'tasks' ? 'bg-primary/10 text-primary' : 'hover:bg-base-300/70 text-base-content/80 hover:text-base-content'}`}
                      >
                        <i className="bi bi-check2-square text-lg flex items-center justify-center"></i> مدیریت وظایف
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-base-content/5 bg-base-300/10">
              <div className="p-3 bg-base-300/30 rounded-2xl border border-base-content/5 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="avatar placeholder shrink-0">
                    <div className="bg-gradient-to-tr from-primary to-secondary text-primary-content w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-sm">
                      <span>{user.username ? user.username.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center h-8 px-2.5 rounded-lg border border-primary/30 bg-primary/5 min-w-0">
                    <span className="text-[11px] font-bold text-primary truncate">
                      {user.username} | {translateRole(user.role)}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-ghost btn-circle hover:text-error hover:bg-error/10 text-base-content/60 transition-colors flex items-center justify-center shrink-0 w-8 h-8"
                  title="خروج از سیستم"
                >
                  <i className="bi bi-box-arrow-left text-base flex items-center justify-center"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
