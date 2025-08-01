import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient("https://xstngunahdnkcihotiys.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzdG5ndW5haGRua2NpaG90aXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNzk4NjcsImV4cCI6MjA1OTc1NTg2N30.wL0XVbowzcYlGV6One_0500f5IUBCZek-LCy4LRCOj4");