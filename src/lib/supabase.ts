import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gztijgmmhkxxlnntjlqa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dGlqZ21taGt4eGxubnRqbHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NzMxODUsImV4cCI6MjA4ODA0OTE4NX0.wEjrwHBoA2wSZwBOn6Z5OL5c0u9ospJYKGo1_JIcJ-o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
