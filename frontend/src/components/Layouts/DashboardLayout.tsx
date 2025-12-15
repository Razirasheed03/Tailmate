// src/components/Layouts/DashboardLayout.tsx

import React, { useState } from "react";
import Sidebar from "@/components/UiComponents/Sidebar";
import Navbar from "@/components/UiComponents/AdminNavbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content area */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Navbar
          title={title}
          onMobileMenuToggle={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-6 pt-24 lg:pt-28">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
