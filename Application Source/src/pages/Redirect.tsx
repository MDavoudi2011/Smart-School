import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Redirect() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = (import.meta as any).env.VITE_APP_NAME || "مدرسه هوشمند";
    const userSession = localStorage.getItem("smart_school_user");
    
    // Simulate initial loading as in the original vanilla js
    const timer = setTimeout(() => {
      if (userSession) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center bg-[#f8fafc] w-full" dir="rtl">
      <div className="loader mb-4 border-[4px] border-[#f3f3f3] border-t-[4px] border-t-[#4f46e5] rounded-full w-[40px] h-[40px] animate-spin"></div>
      <p className="text-gray-500 font-sans text-sm animate-pulse" id="status-text">
        در حال بررسی...
      </p>
    </div>
  );
}
