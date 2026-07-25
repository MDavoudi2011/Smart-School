import { getSupabase } from './lib/supabase';

export const SchoolAPI = {
  async fetchTasks() {
    const { data, error } = await getSupabase().from('tasks').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async insertTask(title: string) {
    const { error } = await getSupabase().from('tasks').insert([{ title: title, status: false }]);
    if (error) throw error;
  },

  async deleteTask(id: string) {
    const { error } = await getSupabase().from('tasks').delete().eq('id', id);
    if (error) throw error;
  },

  async updateTaskStatus(id: string, currentStatus: boolean) {
    const { error } = await getSupabase().from('tasks').update({ status: !currentStatus }).eq('id', id);
    if (error) throw error;
  },

  async fetchUsers() {
    const { data, error } = await getSupabase().from('users').select('*').order('username');
    if (error) throw error;
    return data;
  },

  async saveUser(id: string | null, payload: any) {
    let error;
    if (id) {
      ({ error } = await getSupabase().from('users').update(payload).eq('id', id));
    } else {
      ({ error } = await getSupabase().from('users').insert([payload]));
    }
    if (error) throw error;
  },

  async deleteUser(id: string) {
    const { error } = await getSupabase().from('users').delete().eq('id', id);
    if (error) throw error;
  },

  async fetchDistinctClasses() {
    const { data, error } = await getSupabase().from('students').select('class_id').order('class_id');
    if (error) throw error;
    return [...new Set(data.map((item: any) => item.class_id).filter(Boolean))];
  },

  async fetchLatestLog(classId: string) {
    const { data, error } = await getSupabase().from('school_logs').select('*').eq('class_id', classId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    // Supabase often returns error even when no rows on maybeSingle? No, maybeSingle shouldn't error if 0 rows.
    if (error) throw error;
    return data;
  },

  async fetchLogsHistory(classId: string, limit = 20) {
    const { data, error } = await getSupabase().from('school_logs').select('created_at, temperature').eq('class_id', classId).order('created_at', { ascending: true }).limit(limit);
    if (error) throw error;
    return data;
  },

  async insertEmergencyCommand(classId: string) {
    const { error } = await getSupabase().from('commands').insert([{ command_type: 'EMERGENCY_OPEN', class_id: classId, status: 'pending' }]);
    if (error) throw error;
  },

  async fetchStudentsByClass(classId: string) {
    const { data, error } = await getSupabase().from('students').select('*').eq('class_id', classId);
    if (error) throw error;
    return data;
  },

  async fetchTodayPresentStudents() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await getSupabase().from('attendance').select('student_id').eq('date', today);
    if (error) throw error;
    return data.map((a: any) => a.student_id);
  },

  async fetchBins() {
    const { data, error } = await getSupabase().from('bins').select('*').order('fill_level', { ascending: false });
    if (error) throw error;
    return data;
  },

  async resetBinLevel(binId: string) {
    const { error } = await getSupabase().from('bins').update({ fill_level: 0, last_updated: new Date().toISOString() }).eq('id', binId);
    if (error) throw error;
  }
};
