import React, { useEffect, useState } from "react";
import { Sun, Moon, LogOut, CheckCircle2, AlertTriangle, Menu } from "lucide-react";
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
    <header className="sticky top-0 z-30 h-16 border-b border-border/60 bg-card/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted tactile-button"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          {activeTabTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* System Health Pulse */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-border/70 bg-muted/40 text-xs font-medium text-muted-foreground">
          {isReady === true ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Engine Active</span>
            </>
          ) : isReady === false ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Offline / Loading</span>
            </>
          ) : (
            <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-ping" />
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted tactile-button transition-colors"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>

        {/* User profile capsule */}
        {user && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-border/60">
            <div className="w-8 h-8 rounded-full bg-primary-600/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs uppercase">
              {user.name.substring(0, 2)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {user.name}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                @{user.username}
              </p>
            </div>
            <Badge role={user.role} className="hidden lg:inline-flex" />

            <button
              onClick={logout}
              className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 tactile-button transition-colors ml-1"
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
