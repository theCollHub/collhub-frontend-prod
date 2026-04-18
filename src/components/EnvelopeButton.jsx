import { Mail } from "lucide-react";

export default function EnvelopeButton({ unreadTotal = 0, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative p-3 rounded-xl hover:bg-blue-50 active:bg-blue-100 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 transition-all duration-200 ease-in-out
                 group"
      aria-label={`Messages${unreadTotal > 0 ? `, ${unreadTotal} unread` : ""}`}
    >
      {/* Envelope Icon */}
      <Mail className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors duration-200"/>

      {/* Badge */}
      {unreadTotal > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 sm:min-w-[1.5rem] sm:h-6
                     px-1.5 rounded-full bg-gradient-to-br from-red-500 to-red-600 
                     text-white text-[10px] sm:text-xs
                     flex items-center justify-center shadow-lg
                     border-2 border-white
                     animate-[pulse_2s_ease-in-out_infinite]
                     select-none"
          style={{ fontWeight: 600 }}
          aria-live="polite"
          aria-atomic="true"
        >
          {unreadTotal > 99 ? "99+" : unreadTotal}
        </span>
      )}
    </button>
  );
}