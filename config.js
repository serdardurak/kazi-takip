// ─── SUPABASE ────────────────────────────────────────────
const SUPABASE_URL = 'https://hxfzidndvqoortcsknyw.supabase.co';

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZnppZG5kdnFvb3J0Y3Nrbnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTkyMzMsImV4cCI6MjA5MzYzNTIzM30.Tr70mVn-ESwFneTVOkE1hICbAt-mEcf0_1B9eM-39pc';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
