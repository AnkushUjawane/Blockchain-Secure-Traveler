import { useState } from "react";

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLogin) {
      const users = JSON.parse(localStorage.getItem("Avinya_users") || "[]");
      const user = users.find(
        (u) => u.email === formData.email && u.password === formData.password
      );

      if (user) {
        localStorage.setItem("Avinya_current_user", JSON.stringify(user));
        onLogin(user);
      } else {
        alert("Invalid credentials");
      }
    } else {
      // Register logic
      const users = JSON.parse(localStorage.getItem("Avinya_users") || "[]");

      if (users.find((u) => u.email === formData.email)) {
        alert("Email already registered");
        return;
      }

      const newUser = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };

      users.push(newUser);
      localStorage.setItem("Avinya_users", JSON.stringify(users));
      localStorage.setItem("Avinya_current_user", JSON.stringify(newUser));
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-indigo-900/20"></div>

      <div className="relative z-10 max-w-sm mx-auto">
        {/* Main Card */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 rounded-3xl shadow-2xl border border-gray-700 backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-lg inline-block mb-6 transform hover:scale-105 transition-transform duration-300">
              <span className="text-xl">🛡️</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-1">
              Avinya
            </h1>
            <p className="text-blue-100 text-lg font-bold mb-1">
              Smart Tourist Safety Monitor
            </p>
            <p className="text-gray-400 text-sm mb-1">
              Protecting travelers worldwide with real-time safety intelligence
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {!isLogin && (
              <div className="relative flex gap-2 p-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-2xl">👤</span>
                </div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300"
                  required
                />
              </div>
            )}

            <div className="relative flex gap-2 p-2">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-2xl">📧</span>
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300"
                required
              />
            </div>

            <div className="relative flex gap-2 p-2">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-2xl">🔒</span>
              </div>
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300"
                required
              />
            </div>

            <div className="px-4 mt-1 px-2">
              <button
                type="submit"
                className={`w-full border-none py-3 px-6 rounded-lg font-bold text-base transition-all duration-300 shadow-lg transform hover:scale-105 hover:shadow-xl ${
                  isLogin
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white"
                }`}
              >
                {isLogin ? "🚀 Enter Avinya" : "✨ Join Avinya"}
              </button>
            </div>
          </form>

          {/* Tab Switcher */}
          <div className="flex rounded-xl p-2 mb-6 gap-2">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
                isLogin
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🔐 Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
                !isLogin
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              📝 Register
            </button>
          </div>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-xs text-center mb-4">
              Trusted by travelers worldwide
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-xs">
                <div className="text-green-400 text-lg mb-1">🗺️</div>
                <div className="text-gray-300 font-medium">Live Maps</div>
              </div>
              <div className="text-xs">
                <div className="text-yellow-400 text-lg mb-1">⚡</div>
                <div className="text-gray-300 font-medium">Real-time</div>
              </div>
              <div className="text-xs">
                <div className="text-red-400 text-lg mb-1">🆘</div>
                <div className="text-gray-300 font-medium">Emergency</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
