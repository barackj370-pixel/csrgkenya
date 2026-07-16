import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise fallback to the provided keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jruylnauyktysmasihqh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpydXlsbmF1eWt0eXNtYXNpaHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4OTU1OTcsImV4cCI6MjA4ODQ3MTU5N30.L1ZMga7fcsHdX6oM6BEruKPbn9LRM1UA6HMSbb5nRRc';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
