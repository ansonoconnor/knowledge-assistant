/******************************************************************************
 * File: AuthPanel/index.jsx
 * Layer: Presentation / Authentication
 * Responsibility:
 * Allows a user to establish and end a Supabase Auth session.
 ******************************************************************************/

import { useState } from "react";

import supabase from "../../lib/supabase";

function AuthPanel({
  session,
  onSessionChange
}) {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function signIn(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const {
      data,
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    onSessionChange(
      data.session
    );

    setPassword("");
    setMessage(
      "Authenticated successfully."
    );

    setLoading(false);
  }

  async function signOut() {
    setLoading(true);
    setMessage("");

    const {
      error
    } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    onSessionChange(null);

    setEmail("");
    setPassword("");
    setMessage(
      "Signed out."
    );

    setLoading(false);
  }

  if (session?.user) {
    return (
      <section className="auth-panel">
        <div>
          <strong>
            Authenticated
          </strong>

          <p>
            {session.user.email}
          </p>
        </div>

        <button
          type="button"
          onClick={signOut}
          disabled={loading}
        >
          {loading
            ? "Signing out..."
            : "Sign out"}
        </button>

        {message && (
          <p>{message}</p>
        )}
      </section>
    );
  }

  return (
    <section className="auth-panel">
      <form onSubmit={signIn}>
        <div>
          <label htmlFor="auth-email">
            Email
          </label>

          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label htmlFor="auth-password">
            Password
          </label>

          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Signing in..."
            : "Sign in"}
        </button>
      </form>

      {message && (
        <p>{message}</p>
      )}
    </section>
  );
}

export default AuthPanel;