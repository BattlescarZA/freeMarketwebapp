import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helpers (when backend is set up)
export const db = {
  // Portfolios
  getPortfolios: async (userId: string) => {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },

  // Holdings
  getHoldings: async (portfolioId: string) => {
    const { data, error } = await supabase
      .from('holdings')
      .select('*, asset:assets(*)')
      .eq('portfolio_id', portfolioId);
    return { data, error };
  },

  // Transactions
  getTransactions: async (portfolioId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, asset:assets(*)')
      .eq('portfolio_id', portfolioId)
      .order('transaction_date', { ascending: false });
    return { data, error };
  },

  // Watchlist
  getWatchlist: async (userId: string) => {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*, asset:assets(*)')
      .eq('user_id', userId);
    return { data, error };
  },
};
