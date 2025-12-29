import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />
      <main className="ml-64 mt-16 p-8" data-testid="dashboard-main-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
