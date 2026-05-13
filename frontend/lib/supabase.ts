import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes. " +
      "Crie frontend/.env.local com essas variaveis e reinicie o servidor.",
  );
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient("https://placeholder.supabase.co", "placeholder-anon-key", {
      auth: { persistSession: false, autoRefreshToken: false },
    });

export type Representative = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  course_name: string;
  institution_name: string;
  graduation_year: string;
  slug: string;
  created_at: string;
};

export type PublicRepresentative = Pick<
  Representative,
  "id" | "name" | "course_name" | "institution_name" | "graduation_year" | "slug"
>;

export type Student = {
  id: string;
  representative_id: string;
  cpf: string;
  full_name: string;
  birth_date: string;
  phone: string;
  email: string;
  created_at: string;
};

export type Admin = {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
};
