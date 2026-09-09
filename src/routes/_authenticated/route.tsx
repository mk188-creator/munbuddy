import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { loadSession, peekSession } from "@/lib/session-cache";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  // Resolves synchronously after the first visit, so in-app navigation never
  // suspends the gate — that suspension is what made the previous page linger
  // and then bounce to the new one.
  beforeLoad: async () => {
    const peek = peekSession();
    const session = peek.ready ? peek.session : await loadSession();
    if (!session) throw redirect({ to: "/auth", replace: true });
    return { user: session.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <span className="font-display text-sm font-medium text-muted-foreground">
              MUN Hub
            </span>
          </header>
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
