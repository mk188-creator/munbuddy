import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

/**
 * Synchronous view of the Supabase session.
 *
 * Route guards must decide *before* the first paint. `getSession()` is always
 * async, so every navigation under the auth gate suspended for a tick and the
 * router flashed the previous page. We resolve the session once, keep it in
 * sync through `onAuthStateChange`, and let guards read it synchronously.
 */
let cached: Session | null = null;
let ready = false;
let pending: Promise<Session | null> | null = null;

function subscribe() {
  supabase.auth.onAuthStateChange((_event, session) => {
    cached = session;
    ready = true;
  });
}

export function peekSession(): { ready: boolean; session: Session | null } {
  return { ready, session: cached };
}

export async function loadSession(): Promise<Session | null> {
  if (ready) return cached;
  if (!pending) {
    subscribe();
    pending = supabase.auth.getSession().then(({ data }) => {
      cached = data.session;
      ready = true;
      pending = null;
      return cached;
    });
  }
  return pending;
}
