const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl =
  process.env.SUPABASE_URL;

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY;

if (
  !supabaseUrl ||
  !supabaseAnonKey
) {
  throw new Error(
    "Missing Supabase server environment configuration"
  );
}

const serverAuthOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
};

/*
 * This client possesses only public anon-key capability.
 * It validates bearer tokens but does not bypass RLS.
 */
const authenticationClient =
  createClient(
    supabaseUrl,
    supabaseAnonKey,
    serverAuthOptions
  );

function createUserSupabaseClient(
  accessToken
) {
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      ...serverAuthOptions,
      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`
        }
      }
    }
  );
}

module.exports = {
  authenticationClient,
  createUserSupabaseClient
};
