import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hkydkvconzxcruvpccya.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_gbQ_XwFZfvtR_PnhJlZ6Bw_sVz9M3Xf';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;

