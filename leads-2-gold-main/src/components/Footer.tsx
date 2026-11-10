import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full p-4 bg-leather/80 backdrop-blur-sm flex flex-col justify-center items-center text-center rounded-t-lg mt-8 gap-2">
      <p className="text-dust text-sm">
        Designed by Crowell Digital Marketplace - Marcus@cdmweb.store - 940-236-2236 Frisco, Texas. 75036 | &copy; 2025 All rights reserved.
      </p>
      <div className="flex gap-4 text-xs text-dust/80">
        <Link to="/terms" className="hover:text-dust hover:underline">Terms & Conditions</Link>
        <span>·</span>
        <Link to="/privacy" className="hover:text-dust hover:underline">Privacy Policy</Link>
      </div>
    </footer>
  );
};

export default Footer;