import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { hashPasswordSHA256 } from '../utils';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "ورود به سیستم";
    // Force daisyui theme for this page
    document.documentElement.setAttribute('data-theme', 'night');
    document.documentElement.setAttribute('dir', 'rtl');
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const hashedPassword = await hashPasswordSHA256(password);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', hashedPassword)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("نام کاربری یا رمز عبور اشتباه است.");

      const userData = {
        id: data.id,
        username: data.username,
        role: data.role,
        class_id: data.class_id,
        loginTime: new Date().toISOString()
      };
      
      localStorage.setItem("smart_school_user", JSON.stringify(userData));
      setSuccess(true);

      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "خطای ناشناخته");
      setLoading(false);
    }
  };

  // Determine button styles based on state
  let buttonClass = "btn btn-block shadow-md mt-4 font-bold border transition-all duration-300 ";
  if (success) {
    buttonClass += "!bg-emerald-600 hover:!bg-emerald-600 !text-white !border-none scale-[1.02]";
  } else if (errorMsg) {
    buttonClass += "!bg-rose-600 hover:!bg-rose-700 !text-white !border-none";
  } else {
    buttonClass += "btn-neutral border-base-content/10";
  }

  // Clear error message when user starts typing again
  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (errorMsg) setErrorMsg('');
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (errorMsg) setErrorMsg('');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 custom-gradient w-full min-h-screen">
      <div className="card bg-base-100 w-full max-w-md shadow-2xl border border-base-content/10 overflow-hidden my-auto animate-fade-in">
        <div className="bg-base-200/80 p-8 text-center text-base-content flex flex-col items-center justify-center gap-2 border-b border-base-content/5">
          <div className="w-14 h-14 bg-base-300 text-secondary rounded-2xl flex items-center justify-center shadow-inner border border-base-content/5">
            <i className="bi bi-building text-3xl flex items-center justify-center"></i>
          </div>
          <h2 className="text-2xl font-black mt-2">مدرسه هوشمند</h2>
        </div>

        <div className="card-body p-8 space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-bold">نام کاربری</span>
              </label>
              <label className="input input-bordered flex items-center gap-3 w-full focus-within:border-secondary">
                <i className="bi bi-person-circle text-lg flex items-center justify-center opacity-60"></i>
                <input 
                  type="text" 
                  className="grow" 
                  placeholder="نام کاربری خود را وارد کنید" 
                  value={username}
                  onChange={e => handleUsernameChange(e.target.value)}
                  required 
                />
              </label>
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-xs font-bold">رمز عبور</span>
              </label>
              <label className="input input-bordered flex items-center gap-3 w-full focus-within:border-secondary">
                <i className="bi bi-key-fill text-lg flex items-center justify-center opacity-60"></i>
                <input 
                  type="password" 
                  className="grow" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  required 
                />
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading || success}
              className={buttonClass}
            >
              <span>
                {success 
                  ? 'ورود موفق!' 
                  : errorMsg 
                    ? 'خطا در اطلاعات ورود' 
                    : loading 
                      ? 'در حال بررسی...' 
                      : 'ورود به مدرسه هوشمند'
                }
              </span>
              {loading && !success && <span className="loading loading-spinner loading-xs"></span>}
            </button>

            {errorMsg && (
              <div className="text-center text-error-content text-xs font-bold bg-error p-3 rounded-lg border border-error/30 flex items-center justify-center gap-2 animate-bounce">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{errorMsg}</span>
              </div>
            )}
          </form>

          <div className="pt-6 border-t border-base-content/5 text-center w-full">
            <p className="text-[11px] text-base-content/40 font-medium space-x-1 space-x-reverse">
              <span>طراحی شده توسط <span className="text-white font-bold">محمد داودی</span></span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
