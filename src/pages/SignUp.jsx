import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Footer from "../components/Footer";
import signupImage from "../assets/login_image.jpg";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  // Send OTP
  const handleSendOtp = async () => {
    setOtpLoading(true);
    setError("");
    setMessage("");

    if (!email.endsWith("@gmail.com")) {
      setError("Only college email (@gmail.com) is allowed.");
      setOtpLoading(false);
      return;
    }

    try {
      await api.post("/auth/request-otp", { email });
      setMessage(`✅ OTP sent to ${email}`);
      setOtpSent(true);
    } catch {
      setError("Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // Signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!otpSent || !otp) {
      setError("Please enter the OTP sent to your email.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      await api.post(
        "/auth/signup",
        { email, username, password, otp },
        { withCredentials: true }
      );
      navigate("/profile-setup");
    } catch (error) {
      setError(error.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl flex items-center">
          {/* Left Image */}
          <div className="hidden md:flex flex-[1.3] items-center justify-end">
            <img
              src={signupImage}
              alt="CollHub illustration"
              className="max-h-[520px] w-[90%] object-contain"
            />
          </div>

          {/* Signup Card */}
          <div className="flex flex-[0.9] items-center justify-start md:-ml-6">
            <div className="w-full max-w-sm bg-white border border-gray-300 rounded-lg shadow-sm max-h-[80vh] overflow-y-auto">
              <form
                onSubmit={handleSubmit}
                className="p-6 sm:p-8 flex flex-col items-center text-center"
              >
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                  Sign Up
                </h2>

                {error && (
                  <div className="mb-3 sm:mb-4 p-3 bg-red-100 text-red-700 rounded w-full text-sm">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="mb-3 sm:mb-4 p-3 bg-green-100 text-green-700 rounded w-full text-sm">
                    {message}
                  </div>
                )}

                <input
                  type="email"
                  placeholder="College Email"
                  className="border border-gray-300 p-2.5 rounded mb-3 w-full text-center text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="bg-blue-600 text-white text-sm font-semibold rounded w-full py-2 mb-3 hover:bg-blue-800 transition"
                >
                  {otpLoading ? "Sending OTP..." : "Send OTP"}
                </button>

                {otpSent && (
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    className="border border-gray-300 p-2.5 rounded mb-3 w-full text-center text-sm"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                )}

                <input
                  type="text"
                  placeholder="Name"
                  className="border border-gray-300 p-2.5 rounded mb-3 w-full text-center text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                {/* Password */}
                <div className="relative w-full mb-3">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="border border-gray-300 p-2.5 rounded w-full text-center pr-10 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative w-full mb-4">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter Password"
                    className="border border-gray-300 p-2.5 rounded w-full text-center pr-10 text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gray-800 text-white text-sm font-semibold rounded w-full py-2.5 hover:bg-black transition"
                >
                  {loading ? "Signing Up..." : "Sign Up"}
                </button>

                <p className="mt-4 sm:mt-6 text-gray-600 text-xs sm:text-sm">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-600 hover:underline">
                    Log In
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}