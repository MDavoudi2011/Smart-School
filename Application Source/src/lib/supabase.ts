import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || "https://tmiwptgmqewgxzfgqwdr.supabase.co";
const SUPABASE_KEY = (import.meta as any).env.VITE_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtaXdwdGdtcWV3Z3h6Zmdxd2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODUwNjYsImV4cCI6MjA4NTc2MTA2Nn0.alSjtTl7n9G9Lw6i82W8OFN3pdGqCsEoJW7kCn35S8U";

export function getSupabase() {
  const userSessionStr = localStorage.getItem("smart_school_user");
  const userSession = userSessionStr ? JSON.parse(userSessionStr) : {};
  
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: {
      headers: {
        'x-user-role': userSession.role || 'anonymous',
        'x-user-class': userSession.class_id || 'none'
      }
    }
  });
}

// For auth where session might not exist yet
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
