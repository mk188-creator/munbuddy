import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import logo from "@/assets/mun-hub-logo.png";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/primitives";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={reduce ? false : { y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "sticky top-0 z-30 border-b transition-all duration-300",
        scrolled
          ? "border-border/70 bg-background/70 shadow-[0_10px_40px_-30px_oklch(0_0_0/0.9)] backdrop-blur-xl"
          : "border-transparent bg-background/40 backdrop-blur",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 transition-all duration-300 sm:px-6",
          scrolled ? "py-2.5" : "py-3.5",
        )}
      >
        <Link to="/" className="group flex items-center gap-2.5">
          <motion.img
            src={logo}
            alt="MUN Hub logo"
            className="size-8 rounded-xl"
            whileHover={{ rotate: 8, scale: 1.08 }}
            transition={{ type: "spring", stiffness: 320, damping: 14 }}
          />
          <span className="font-display text-base font-semibold">MUN Hub</span>
        </Link>
        <nav className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm">
            <Link to="/hub">Conferences</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/creator">Creator</Link>
          </Button>
          {user ? (
            <Magnetic>
              <Button asChild variant="hero" size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            </Magnetic>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Magnetic>
                <Button asChild variant="hero" size="sm">
                  <Link to="/auth">Get started</Link>
                </Button>
              </Magnetic>
            </>
          )}
        </nav>
      </div>
    </motion.header>
  );
}
