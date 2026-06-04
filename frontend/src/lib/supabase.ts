// Supabase reemplazado por Cloudflare Worker + D1
// Mantenemos exports vacíos para no romper imports existentes durante la migración

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ error: new Error('Usar auth.ts en su lugar') }),
    signOut: async () => {},
  },
};

export const supabaseAdmin = supabase;
