import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/favicon.png";

export default function SplashScreen() {
  const navigate = useNavigate();
  const { authenticated } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (authenticated) {
        navigate("/campus-feed", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }, 3800); // ⏱ must match animation length

    return () => clearTimeout(timer);
  }, [authenticated, navigate]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-black px-4"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, delay: 3.2 }}
    >
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          className="relative mb-6 sm:mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{
            scale: [0, 1.2, 1],
            rotate: [-180, 10, 0],
          }}
          transition={{
            duration: 1.2,
            times: [0, 0.6, 1],
            ease: [0.34, 1.56, 0.64, 1],
          }}
        >
          <motion.div
            className="absolute inset-0 blur-2xl opacity-50"
            animate={{ opacity: [0.5, 0.7, 0.5] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <img
              src={logo}
              alt=""
              className="w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 object-contain"
            />
          </motion.div>

          <img
            src={logo}
            alt="CollHub"
            className="w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 object-contain relative z-10 drop-shadow-2xl"
          />
        </motion.div>

        {/* Title */}
        <motion.div
          className="overflow-hidden mb-2 sm:mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          <h1 className="font-bold text-white tracking-wider flex text-4xl sm:text-5xl md:text-7xl">
            {"CollHub".split("").map((letter, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.9 + index * 0.08,
                  duration: 0.25,
                  ease: "easeOut",
                }}
              >
                {letter}
              </motion.span>
            ))}
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="text-sm sm:text-lg md:text-2xl text-white/90 font-light tracking-wide text-center"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.7 }}
        >
          Where Students Connect & Collaborate
        </motion.p>
      </div>
    </motion.div>
  );
}