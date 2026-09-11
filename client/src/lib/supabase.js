/******************************************************************************
 * File: supabase.js
 * Layer: Client Infrastructure
 * Responsibility:
 * Creates the browser-safe Supabase client used for authentication.
 *
 * Security:
 * Only public browser configuration belongs here.
 * The Supabase service-role key must never be exposed to the client.
 ******************************************************************************/

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase client environment configuration"
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export default supabase;