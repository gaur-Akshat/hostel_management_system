import { useEffect } from "react";

export default function Login() {
  useEffect(() => {
    // Handle URL parameters for errors
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error) {
      const errorDiv = document.getElementById("error-message");
      if (errorDiv) {
        errorDiv.textContent = error;
        errorDiv.classList.remove("hidden");
      }
    }
  }, []);

  // Toggle Password Visibility
  const togglePassword = () => {
    const passwordInput = document.getElementById("password");
    const eyeIcon = document.getElementById("eye-icon");
    const eyeOffIcon = document.getElementById("eye-off-icon");

    if (!passwordInput || !eyeIcon || !eyeOffIcon) return;

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      eyeIcon.classList.add("hidden");
      eyeOffIcon.classList.remove("hidden");
    } else {
      passwordInput.type = "password";
      eyeIcon.classList.remove("hidden");
      eyeOffIcon.classList.add("hidden");
    }
  };

  return (
    <div
      className="min-h-screen bg-[url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069')] bg-cover bg-center bg-fixed flex items-center justify-center px-4 font-sans relative"
    >
      {/* Purple/Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-slate-900/40 to-slate-900/60"></div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-purple-200 text-sm font-medium">
            Hostel Management System
          </p>
        </div>

        {/* Error Message */}
        <div
          id="error-message"
          className="hidden p-3 rounded-lg text-sm bg-red-500/20 border border-red-500/50 text-red-100 mb-6 text-center"
        ></div>

        <form action="auth/login.php" method="POST" className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-purple-200 uppercase tracking-wider mb-2">
              Email or Username
            </label>
            <input
              type="text"
              name="email"
              required
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-200 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                name="password"
                required
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-10"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={togglePassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-200 hover:text-white transition-colors focus:outline-none"
              >
                {/* Eye Icon */}
                <svg
                  id="eye-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>

                {/* Eye Off Icon */}
                <svg
                  id="eye-off-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 hidden"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-200 uppercase tracking-wider mb-2">
              Select Role
            </label>
            <div className="relative">
              <select
                name="role"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-slate-800 transition-all cursor-pointer"
              >
                <option value="student" className="text-slate-900">
                  Student
                </option>
                <option value="warden" className="text-slate-900">
                  Warden
                </option>
                <option value="admin" className="text-slate-900">
                  Administrator
                </option>
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-purple-300">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            name="login"
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-purple-900/50 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Log In
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-white/10">
          <p className="text-sm text-gray-300">
            New Student?{" "}
            <a
              href="#"
              onClick={() =>
                alert(
                  "Student Registration is managed by Wardens. Please contact the office."
                )
              }
              className="text-purple-400 hover:text-purple-300 font-semibold hover:underline transition-colors"
            >
              Register Here
            </a>
          </p>
          <p className="mt-3">
            <a
              href="index.html"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Back to Portal
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}