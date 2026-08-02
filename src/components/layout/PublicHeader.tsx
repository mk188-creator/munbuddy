import { Link } from "@tanstack/react-router";

import logo from "@/assets/mun-hub-logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function PublicHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 transition-transform hover:-translate-y-0.5">
          <img src={logo} alt="MUN Hub logo" className="size-8 rounded-xl" />
          <span className="font-display text-base font-semibold">MUN Hub</span>
        </Link>
        <nav className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm">
            <Link to="/hub">Conferences</Link>
          </Button>
          {user ? (
            <Button asChild variant="hero" size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
