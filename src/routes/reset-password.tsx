import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import logo from "@/assets/mun-hub-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — MUN Hub" },
      {
        name: "description",
        content: "Choose a new password for your MUN Hub delegate account.",
      },
      { property: "og:title", content: "Reset password — MUN Hub" },
      {
        property: "og:description",
        content: "Choose a new password for your MUN Hub delegate account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setValid(Boolean(data.session));
      setReady(true);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) {
        setValid(true);
        setReady(true);
      }
    });
    void check();
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(
        /weak|pwned/i.test(error.message)
          ? "That password appears in known data breaches. Please choose a stronger one."
          : error.message,
      );
      return;
    }
    setDone(true);
    toast.success("Password updated successfully.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <img src={logo} alt="MUN Hub" className="size-10 border-2 border-foreground bg-background" />
          <span className="font-display text-xl font-extrabold tracking-tight">MUN Hub</span>
        </Link>

        <div className="panel space-y-4 p-6 sm:p-8">
          {!ready ? (
            <p className="text-center text-sm text-muted-foreground">Checking your recovery link…</p>
          ) : done ? (
            <div className="space-y-4 text-center">
              <h1 className="font-display text-xl font-semibold">Password updated</h1>
              <p className="text-sm text-muted-foreground">
                You can now use your new password to sign in.
              </p>
              <Button
                variant="hero"
                className="w-full"
                onClick={() => navigate({ to: "/dashboard" })}
              >
                Go to dashboard
              </Button>
            </div>
          ) : !valid ? (
            <div className="space-y-4 text-center">
              <h1 className="font-display text-xl font-semibold">Link expired</h1>
              <p className="text-sm text-muted-foreground">
                This recovery link is invalid or has expired. Request a new one from the sign-in
                page.
              </p>
              <Button variant="hero" className="w-full" onClick={() => navigate({ to: "/auth" })}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1">
                <h1 className="font-display text-xl font-semibold">Set a new password</h1>
                <p className="text-sm text-muted-foreground">Minimum 8 characters.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
