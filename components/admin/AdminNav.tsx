"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Plus,
  LogOut,
  Menu,
  X,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/posts/new", label: "New Post", icon: Plus },
  { href: "/admin/tags", label: "Featured Tags", icon: Tag },
];

function SidebarContent({
  pathname,
  userName,
  userEmail,
  onNavigate,
  onSignOut,
  onToggleMobileMenu,
  showMobileClose,
}: {
  pathname: string;
  userName?: string | null;
  userEmail?: string | null;
  onNavigate?: () => void;
  onSignOut: () => void;
  onToggleMobileMenu?: () => void;
  showMobileClose?: boolean;
}) {
  return (
    <>
      {/* Logo/Brand */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Snippets</h1>
          <p className="text-sm text-muted-foreground">Admin Dashboard</p>
        </div>

        {/* Mobile close button (inside navbar) */}
        {showMobileClose && (
          <div className="lg:hidden">
            <Button variant="outline" size="icon" onClick={onToggleMobileMenu}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border pt-4">
        <div className="mb-4">
          <p className="text-sm font-medium">{userName || "User"}</p>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onSignOut}
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handle = () => {
      setIsDesktop(mq.matches);
      if (mq.matches) {
        setMobileMenuOpen(false);
      }
    };
    handle();
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      {!mobileMenuOpen && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Sidebar (always visible on desktop, animated on mobile) */}
      <motion.aside
        initial={false}
        animate={{ x: isDesktop ? 0 : mobileMenuOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border p-6 flex flex-col"
        )}
      >
        <SidebarContent
          pathname={pathname}
          userName={user?.name}
          userEmail={user?.email}
          onNavigate={!isDesktop ? () => setMobileMenuOpen(false) : undefined}
          onSignOut={handleSignOut}
          onToggleMobileMenu={!isDesktop ? () => setMobileMenuOpen(false) : undefined}
          showMobileClose={!isDesktop && mobileMenuOpen}
        />
      </motion.aside>

      {/* Mobile overlay */}
      {!isDesktop && mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </>
  );
}

