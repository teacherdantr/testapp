
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/database.types'; // We'll create this file next

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// If you need a Supabase client with service_role privileges for admin tasks
// (BE VERY CAREFUL WITH THIS and only use it in secure server-side environments)
// export function createSupabaseAdminClient() {
//   if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
//     throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
//   }
//   if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
//     throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set.');
//   }

//   return createClient<Database>(
//     process.env.NEXT_PUBLIC_SUPABASE_URL,
//     process.env.SUPABASE_SERVICE_ROLE_KEY,
//     {
//       auth: {
//         autoRefreshToken: false,
//         persistSession: false,
//       },
//     }
//   );
// }
