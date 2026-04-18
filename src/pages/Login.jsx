import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import Footer from "../components/Footer";
import loginImage from "../assets/login_image.jpg";

export default function CombinedLogin() {
  const [selectedLoginTab, setSelectedLoginTab] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password, selectedLoginTab);
    setLoading(false);

    if (success) {
      navigate("/campus-feed", { replace: true });
    } else {
      alert("Login failed. Check your email and password.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white px-4 sm:px-6">
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-center">
          
          {/* Left Image */}
          <div className="hidden md:flex flex-[1.3] items-center justify-end">
            <img
              src={loginImage}
              alt="CollHub illustration"
              className="max-h-[600px] w-[90%] object-contain"
            />
          </div>

          {/* Login Card */}
          <div className="flex w-full md:flex-[0.9] items-center justify-center md:justify-start md:-ml-6">
            <div className="w-full max-w-sm mx-auto bg-white border border-gray-200 rounded-xl shadow-lg">
              
              {/* Tabs */}
              <div className="flex gap-2 p-4 pb-0">
                <button
                  className={`flex-1 py-3 px-4 rounded-lg transition-all duration-300 ${
                    selectedLoginTab === "student"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedLoginTab("student")}
                  type="button"
                >
                  Student Login
                </button>
                <button
                  className={`flex-1 py-3 px-4 rounded-lg transition-all duration-300 ${
                    selectedLoginTab === "company"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedLoginTab("company")}
                  type="button"
                >
                  Company Login
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="p-8 pt-6 flex flex-col"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl mb-2">
                    {selectedLoginTab === "student"
                      ? "Student Login"
                      : "Company Login"}
                  </h2>
                </div>

                <div className="mb-4">
                  <label className="block text-left text-sm text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder={
                      selectedLoginTab === "student"
                        ? "student@college.edu"
                        : "you@company.com"
                    }
                    className="border border-gray-300 bg-gray-50 p-3.5 rounded-lg w-full focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-2">
                  <label className="block text-left text-sm text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="border border-gray-300 bg-gray-50 p-3.5 rounded-lg w-full pr-12 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="mb-6 text-right">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`text-white rounded-full w-full py-3.5 transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 ${
                    selectedLoginTab === "student"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30 hover:shadow-blue-500/40"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/30 hover:shadow-purple-500/40"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging In...
                    </span>
                  ) : (
                    "Log In"
                  )}
                </button>

                {selectedLoginTab === "student" && (
                  <div className="mt-6 text-center">
                    <p className="text-gray-600 text-sm">
                      Don&apos;t have an account?{" "}
                      <Link to="/signup" className="text-blue-600 hover:text-blue-700 hover:underline">
                        Sign Up
                      </Link>
                    </p>
                  </div>
                )}
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