import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const authStorageKey = "alpha-lista-auth-token";
const browserSessionStorage =
  typeof window !== "undefined" ? window.sessionStorage : undefined;

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
        storageKey: authStorageKey,
        ...(browserSessionStorage ? { storage: browserSessionStorage } : {}),
      },
    })
  : createClient("https://placeholder.supabase.co", "placeholder-anon-key", {
      auth: { persistSession: false, autoRefreshToken: false },
    });

function clearAuthStorage(storage: Storage | undefined) {
  if (!storage) return;

  const keysToRemove: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (
      key === authStorageKey ||
      key === "supabase.auth.token" ||
      (key?.startsWith("sb-") && key.endsWith("-auth-token"))
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
}

export function clearStoredAuthSession() {
  if (typeof window === "undefined") return;

  clearAuthStorage(window.localStorage);
  clearAuthStorage(window.sessionStorage);
}

export async function signOutAndClearSession() {
  try {
    await supabase.auth.signOut({ scope: "global" });
  } finally {
    clearStoredAuthSession();
  }
}

export type Representative = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  course_name: string;
  institution_name: string;
  graduation_year: string;
  slug: string;
  consultant_name?: string | null;
  consultant_phone?: string | null;
  meta_notified_at?: string | null;
  contacted_at?: string | null;
  created_at: string;
};

export const META_CONVITES = 30;

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
  qtd_convites: number;
  created_at: string;
};

export type Admin = {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
};
