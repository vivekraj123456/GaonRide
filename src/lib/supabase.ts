import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xlimxbfxgncfjlawhozl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsaW14YmZ4Z25jZmpsYXdob3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MjIzNTUsImV4cCI6MjA4OTk5ODM1NX0.JdQjAtDzgKJ4vxOZ9Xo3jkI9Qj4bgYKjQ-stb3K4Sec';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
