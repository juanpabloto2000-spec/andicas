import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Check if real Supabase credentials are provided
const isRealSupabase = supabaseUrl && !supabaseUrl.includes('mock.supabase.co') && supabaseKey && !supabaseKey.includes('mock');

export const supabase = isRealSupabase
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })
  : null;

// ==============================================================================
// IN-MEMORY MOCK STORE FOR SEAMLESS LOCAL TESTING (Active if Supabase is in mock mode)
// ==============================================================================
export const mockStore = {
  bookings: [],
  blocked_dates: [],
  logs: [],
};

console.log(
  isRealSupabase
    ? '✅ [Backend] Conectado a Supabase PostgreSQL Cloud'
    : 'ℹ️ [Backend] Modo Mock / Local Store activo para pruebas inmediatas'
);
