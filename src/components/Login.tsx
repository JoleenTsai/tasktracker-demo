import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Icons } from '../lib/utils';

export const Login = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/google/url');
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-container/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-center mb-8">
            <div className="h-12 w-12 bg-primary-container rounded-2xl flex items-center justify-center shadow-lg shadow-primary-container/30">
              <Icons.Sparkles className="text-white h-6 w-6" />
            </div>
          </div>
          
          <h1 className="text-3xl font-black text-center text-slate-900 dark:text-white mb-2 font-manrope">
            Welcome to TeamTask
          </h1>
          <p className="text-slate-500 text-center mb-8 font-medium">
            Sign in to access your productivity suite
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
          >
            {isLoading ? (
              <Icons.Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                <span>Continue with Google</span>
              </>
            )}
          </motion.button>
          
          <p className="text-center text-xs text-slate-400 mt-8">
            Secure internal SSO enabled.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
