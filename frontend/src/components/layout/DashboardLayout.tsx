import React, { useState } from "react";
import { Sidebar, navItems } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useAuth } from "../../context/AuthContext";

interface DashboardLayoutProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeTab,
  onSelectTab,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const currentItem = navItems.find((item) => item.id === activeTab);
  const activeTitle = currentItem ? currentItem.label : "Dashboard";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar activeTab={activeTab} onSelectTab={onSelectTab} />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 z-10 flex h-full">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={onSelectTab}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Navbar
          activeTabTitle={activeTitle}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
