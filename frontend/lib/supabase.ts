import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes. " +
      "Crie frontend/.env.local com essas variáveis e reinicie o servidor.",
  );
}

// Cliente real quando configurado; placeholder seguro caso contrário,
// para não quebrar o build/import em telas como /login e /cadastro.
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient(
      "https://placeholder.supabase.co",
      "placeholder-anon-key",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

export type Formando = {
  id: string;
  user_id: string;
  nome: string;
  cpf: string;
  email: string;
  whatsapp: string;
  data_nascimento: string;
  curso: string;
  instituicao: string;
  cidade: string;
  estado: string;
  semestre: string;
  slug: string;
  criado_em: string;
};

export type Adesao = {
  id: string;
  slug_origem: string;
  nome: string;
  cpf: string | null;
  email: string;
  whatsapp: string;
  qtd_luxo: number;
  qtd_simples: number;
  tem_fotos: "sim" | "nao" | "nao_sei";
  observacoes: string | null;
  criado_em: string;
};
