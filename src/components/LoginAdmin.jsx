import { useState, useRef, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export default function LoginAdmin({ onLogin, loading, error }) {
  const { t } = useLanguage();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onLogin(email, password);
  };

  const inputClasses = `w-full rounded-xl pl-10 pr-4 py-3 text-sm font-body font-semibold
                        bg-white/[0.07] border border-white/10 text-white
                        placeholder:text-purple-400/50
                        focus:border-purple-400/60 focus:bg-white/[0.10] focus:ring-0
                        outline-none transition-all duration-200`;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0f0320 0%, #1a0733 40%, #2d1055 100%)' }}
    >
      {/* Glow blobs */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ff3dac, transparent 70%)' }}
        />
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-3xl p-8 sm:p-10 animate-[scaleIn_400ms_ease-out]"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)' }}
          >
            <span className="text-white font-display text-xl tracking-wide">FP</span>
          </div>
          <h1 className="font-display text-2xl text-white mb-1 tracking-wide">Full Party</h1>
          <div className="flex items-center gap-1.5 mt-2">
            <ShieldCheck size={13} className="text-purple-400" />
            <p className="text-xs font-body text-purple-400">{t('login.adminPanel')}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.07] mb-8" />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-body font-bold text-purple-300/80 mb-2 pl-0.5 tracking-wide uppercase">
              {t('login.email')}
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400/70" />
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@tutienda.com"
                required
                autoComplete="email"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-body font-bold text-purple-300/80 mb-2 pl-0.5 tracking-wide uppercase">
              {t('login.password')}
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400/70" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className={`${inputClasses} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/60
                           hover:text-purple-300 transition-colors p-1 rounded-lg"
                aria-label={showPass ? t('login.hidePassword') : t('login.showPassword')}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-body font-semibold text-red-300
                            bg-red-500/10 border border-red-500/25 animate-[scaleIn_200ms_ease-out]">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3.5 rounded-xl font-body font-bold text-sm text-white mt-1
                       transition-all duration-200 active:scale-[0.98]
                       disabled:opacity-40 disabled:cursor-not-allowed
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a0733]"
            style={{
              background: loading || !email || !password
                ? 'rgba(168,85,247,0.4)'
                : 'linear-gradient(135deg, #ff3dac, #a855f7)',
              boxShadow: loading || !email || !password
                ? 'none'
                : '0 4px 24px rgba(255,61,172,0.35)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                {t('login.loggingIn')}
              </span>
            ) : t('login.submit')}
          </button>
        </form>

        {/* Volver */}
        <p className="text-center mt-7">
          <a
            href="/"
            className="text-xs font-body text-purple-400/70 hover:text-purple-300
                       transition-colors underline underline-offset-2"
          >
            {t('login.backToCatalog')}
          </a>
        </p>
      </div>
    </div>
  );
}
