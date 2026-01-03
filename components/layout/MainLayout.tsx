import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { mode } = useUIStore();
  const isGenerator = mode === 'generator';

  return (
    <div className={cn(
        "flex flex-col min-h-screen",
        isGenerator ? "h-screen overflow-hidden bg-black" : "pt-24 pb-12 px-4 overflow-y-auto"
    )}>
      {/* 
         In Generator mode, Header is still fixed/absolute at top. 
         We add top padding or spacing inside the children container if needed, 
         but GeneratorLayout handles its own spacing.
      */}
      <div className={cn(isGenerator ? "absolute top-0 left-0 right-0 z-50" : "")}>
        <Header />
      </div>

      <main className={cn(
          "flex-grow w-full mx-auto",
          isGenerator ? "h-full pt-[5.5rem] px-4 pb-4 max-w-[1920px]" : "max-w-7xl"
      )}>
        {children}
      </main>
      
      {!isGenerator && <Footer />}
    </div>
  );
};

export default MainLayout;
