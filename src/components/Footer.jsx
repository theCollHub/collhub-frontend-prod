import React from "react";

export default function Footer() {
  return (
    <footer className="w-full text-center text-xs text-gray-500 py-6">
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-3">
        <span>About</span>
        <span>Help</span>
        <span>Privacy</span>
        <span>Terms</span>
        <span>Contact</span>
      </div>
      <p>© {new Date().getFullYear()} CollHub</p>
    </footer>
  );
}