import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gqwnubwygmbanzwjhyoc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qNw535kMot9WK92BrszMtg_DTrb_YHB";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
