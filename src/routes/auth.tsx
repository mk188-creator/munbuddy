import { createFileRoute, Link, redirect } from "@tanstack/react-router";
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
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) window.location.href = "/dashboard";
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const friendly = (message: string) => {
    if (/invalid login credentials/i.test(message))
      return "Wrong email or password. If you just signed up, try creating the account again.";
    if (/known to be weak|pwned/i.test(message))
      return "That password appears in known data breaches. Please choose a stronger one.";
    if (/already registered/i.test(message))
      return "That email already has an account — try signing in instead.";
    return message;
  };

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(friendly(error.message));
  };

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
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
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
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
                    <Label htmlFor="email-up">Email</Label>
                    <Input
                      id="email-up"
                      type="email"
                      required
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
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                    {loading ? "Creating account…" : "Create account"}
                  </Button>
                </form>
              </TabsContent>

            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
