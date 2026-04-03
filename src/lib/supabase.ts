import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jruylnauyktysmasihqh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpydXlsbmF1eWt0eXNtYXNpaHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4OTU1OTcsImV4cCI6MjA4ODQ3MTU5N30.L1ZMga7fcsHdX6oM6BEruKPbn9LRM1UA6HMSbb5nRRc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
