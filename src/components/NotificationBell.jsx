import { Bell } from "lucide-react";

export default function NotificationBell({ unreadTotal = 0, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative cursor-pointer p-2 text-slate-700 
                 hover:text-blue-600 hover:bg-blue-50
                 active:scale-95
                 transition-all duration-200 ease-in-out
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 rounded-full
                 group"
      aria-label={`Notifications${unreadTotal > 0 ? `, ${unreadTotal} unread` : ""}`}
    >
      {/* Bell icon with subtle animation */}
      <Bell 
        className="w-5 h-5 sm:w-6 sm:h-6 
                   group-hover:rotate-12 
                   transition-transform duration-300 ease-out" 
        strokeWidth={2} 
      />

      {/* Badge with glow effect */}
      {unreadTotal > 0 && (
        <>
          {/* Pulsing glow effect */}
          <span
            className="absolute -top-0.5 -right-0.5 
                       bg-red-500 rounded-full w-4 h-4 sm:w-5 sm:h-5
                       animate-ping opacity-75"
            aria-hidden="true"
          />
          
          {/* Main badge */}
          <span
            className="absolute -top-0.5 -right-0.5 
                       bg-gradient-to-br from-red-500 to-red-600 
                       text-white 
                       text-[10px] sm:text-xs 
                       rounded-full w-4 h-4 sm:w-5 sm:h-5 
                       flex items-center justify-center 
                       shadow-lg shadow-red-500/50
                       ring-2 ring-white
                       select-none
                       transition-transform duration-200
                       group-hover:scale-110"
            aria-live="polite"
            aria-atomic="true"
          >
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </span>
        </>
      )}
    </button>
  );
}