import React from 'react';
import ResponsiveLayout from './ResponsiveLayout';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <ResponsiveLayout>
      {children}
    </ResponsiveLayout>
  );
};

export default Layout;
