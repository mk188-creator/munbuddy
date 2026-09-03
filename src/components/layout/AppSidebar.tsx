import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessagesSquare,
  Wrench,
  FileText,
  Globe2,
  Settings,
  LogOut,
  Trophy,
  Sparkles,
  ShoppingBag,
  Package,
  Backpack,
  Hash,
} from "lucide-react";

import logo from "@/assets/mun-hub-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Chat", url: "/chat", icon: MessagesSquare },
  { title: "Tools", url: "/tools", icon: Wrench },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "MUN Hub", url: "/hub", icon: Globe2 },
];

const playItems = [
  { title: "Progress", url: "/progress", icon: Sparkles },
  { title: "Crates", url: "/crates", icon: Package },
  { title: "Shop", url: "/shop", icon: ShoppingBag },
  { title: "Inventory", url: "/inventory", icon: Backpack },
  { title: "Leaderboards", url: "/leaderboard", icon: Trophy },
  { title: "Community", url: "/community", icon: Hash },
];

const accountItems = [{ title: "Settings", url: "/settings", icon: Settings }];


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const { user, signOut } = useAuth();

  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === url : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-3">
          <img src={logo} alt="MUN Hub" className="size-8 shrink-0 border-2 border-foreground bg-background" />
          {!collapsed && (
            <span className="font-display text-base font-extrabold tracking-tight">MUN Hub</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {[
          { label: "Workspace", entries: items },
          { label: "Play", entries: playItems },
          { label: "Account", entries: accountItems },
        ].map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.entries.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>


      <SidebarFooter>
        <div className="flex items-center gap-2 px-1 pb-1">
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Sign out"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
