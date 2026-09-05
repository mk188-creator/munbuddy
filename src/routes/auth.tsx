import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import logo from "@/assets/mun-hub-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MUN Hub" },
      {
        name: "description",
        content:
          "Sign in to MUN Hub to draft position papers, resolutions and speeches with an AI Model UN coach.",
      },
      { property: "og:title", content: "Sign in — MUN Hub" },
      {
        property: "og:description",
        content: "Your AI Model United Nations assistant. Research, write and win awards.",
      },
    ],
  }),
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard", replace: true });
  },
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [mode, setMode] = useState<"auth" | "forgot">("auth");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        window.location.href = "/reset-password";
        return;
      }
      if (session) window.location.href = "/dashboard";
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const friendly = (message: string) => {
    if (/invalid login credentials/i.test(message))
      return "Wrong email or password. If you just signed up, confirm your email first.";
    if (/known to be weak|pwned/i.test(message))
      return "That password appears in known data breaches. Please choose a stronger one.";
    if (/already registered|user already/i.test(message))
      return "That email already has an account — try signing in instead.";
    if (/rate limit|too many/i.test(message))
      return "Too many attempts. Please wait a minute and try again.";
    if (/fetch|network/i.test(message))
      return "Network problem — check your connection and try again.";
    return message;
  };

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(friendly(error.message));
  };

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    const handle = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(handle)) {
      toast.error("Username must be 3–24 characters: letters, numbers or underscores.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, username: handle },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(friendly(error.message));
      return;
    }
    if (data.session) {
      window.location.href = "/dashboard";
      return;
    }
    setSent(true);
  };

  const signInWithGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result && "error" in result && result.error) {
      setGoogleLoading(false);
      toast.error(friendly(result.error.message));
    }
  };

  const sendReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(friendly(error.message));
      return;
    }
    setResetSent(true);
  };



  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="aurora pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2"
      />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <img src={logo} alt="MUN Hub" className="size-10 border-2 border-foreground bg-background" />
          <span className="font-display text-xl font-extrabold tracking-tight">MUN Hub</span>
        </Link>

        <div className="panel p-6 sm:p-8">
          {sent ? (
            <div className="space-y-3 text-center">
              <h1 className="font-display text-xl font-semibold">Check your inbox</h1>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to {email}. Confirm it to activate your account.
              </p>
            </div>
          ) : mode === "forgot" ? (
            <div className="space-y-4">
              {resetSent ? (
                <div className="space-y-3 text-center">
                  <h1 className="font-display text-xl font-semibold">Check your inbox</h1>
                  <p className="text-sm text-muted-foreground">
                    If an account exists for {email}, we sent a password recovery link.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setResetSent(false);
                      setMode("auth");
                    }}
                  >
                    Back to sign in
                  </Button>
                </div>
              ) : (
                <form onSubmit={sendReset} className="space-y-4">
                  <div className="space-y-1">
                    <h1 className="font-display text-xl font-semibold">Reset your password</h1>
                    <p className="text-sm text-muted-foreground">
                      Enter your email and we'll send a recovery link.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-reset">Email</Label>
                    <Input
                      id="email-reset"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="delegate@school.edu"
                    />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                    {loading ? "Sending…" : "Send recovery link"}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-sm text-muted-foreground underline underline-offset-4"
                    onClick={() => setMode("auth")}
                  >
                    Back to sign in
                  </button>
                </form>
              )}
            </div>
          ) : (
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form onSubmit={signIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="delegate@school.edu"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-sm text-muted-foreground underline underline-offset-4"
                    onClick={() => setMode("forgot")}
                  >
                    Forgot password?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={signUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      required
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Ada Okonkwo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      required
                      minLength={3}
                      maxLength={24}
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="ada_delegate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-up">Email</Label>
                    <Input
                      id="email-up"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-up">Password</Label>
                    <Input
                      id="password-up"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-confirm">Confirm password</Label>
                    <Input
                      id="password-confirm"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                    {loading ? "Creating account…" : "Create account"}
                  </Button>
                </form>
              </TabsContent>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={googleLoading}
                  onClick={signInWithGoogle}
                >
                  {googleLoading ? "Opening Google…" : "Continue with Google"}
                </Button>
              </div>
            </Tabs>
          )}

        </div>
      </div>
    </div>
  );
}
