import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 text-center text-slate-500 text-sm">
      <p>&copy; {new Date().getFullYear()} Ultimate Favicon Generator. Local & Privacy Focused.</p>
    </footer>
  );
};

export default Footer;