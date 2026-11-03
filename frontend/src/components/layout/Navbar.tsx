import React, { useEffect, useState } from "react";
import { Sun, Moon, LogOut, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../common/Badge";
import { api } from "../../api/client";

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  activeTabTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  activeTabTitle,
}) => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const [isReady, setIsReady] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getReadiness()
      .then((res) => {
        if (mounted) setIsReady(res.status === "ok");
      })
      .catch(() => {
        if (mounted) setIsReady(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border/60 bg-background/70 backdrop-blur-2xl px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-muted-foreground hover:bg-muted apple-button"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
          {activeTabTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* System Health Pulse - Apple style monochrome */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-muted/40 text-[11px] font-medium text-foreground">
          {isReady === true ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white dark:bg-white animate-pulse" />
              <span className="text-muted-foreground">Neural Engine Online</span>
            </>
          ) : isReady === false ? (
            <>
              <span className="w-2 h-2 rounded-full border border-zinc-500" />
              <span className="text-muted-foreground">Offline</span>
            </>
          ) : (
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-ping" />
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted apple-button transition-colors"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-zinc-200" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-800" />
          )}
        </button>

        {/* User profile capsule */}
        {user && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-border/60">
            <div className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black border border-border flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {user.name.substring(0, 2)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-foreground leading-tight tracking-tight">
                {user.name}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight font-mono">
                @{user.username}
              </p>
            </div>
            <Badge role={user.role} className="hidden lg:inline-flex" />

            <button
              onClick={logout}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted apple-button transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
