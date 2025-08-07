import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Create a mock client if environment variables are not set
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    console.warn('Supabase environment variables not found. Using mock client for development.')
    console.warn('Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file')
    
    // Return a mock client that prevents crashes
    return {
      auth: {
        signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }),
        insert: () => ({ select: () => ({ data: [], error: { message: 'Supabase not configured' } }) }),
        update: () => ({ eq: () => ({ select: () => ({ data: [], error: { message: 'Supabase not configured' } }) }) }),
        delete: () => ({ eq: () => ({ error: { message: 'Supabase not configured' } }) })
      }),
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) })
      })
    }
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()