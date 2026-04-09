import { useState, useRef, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginAdmin({ onLogin, loading, error }) {
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
                        bg-white/[0.08] border-2 border-purple-500/30 text-white
                        placeholder:text-purple-400/60
                        focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20
                        outline-none transition-all duration-200`;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12"
           style={{ background: 'linear-gradient(135deg, #1a0733 0%, #2a0f50 50%, #3d1a6e 100%)' }}>
        <div className="max-w-sm text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-fiesta-magenta to-fiesta-cyan flex items-center justify-center mx-auto mb-8 shadow-lg">
            <span className="text-white font-display text-2xl">FP</span>
          </div>
          <h2 className="font-display text-3xl text-white mb-3">Full Party</h2>
          <p className="text-sm font-body text-purple-300 leading-relaxed">
            Gestiona pedidos, inventario y clientes desde un solo lugar.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center px-4 min-h-screen lg:min-h-0"
           style={{ background: 'linear-gradient(135deg, #1a0733 0%, #2a0f50 50%, #3d1a6e 100%)' }}>
        <div className="w-full max-w-sm animate-[scaleIn_400ms_ease-out]">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:mb-10">
            <div className="lg:hidden w-16 h-16 rounded-2xl bg-gradient-to-br from-fiesta-magenta to-fiesta-cyan flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white font-display text-xl">FP</span>
            </div>
            <h1 className="font-display text-2xl lg:text-3xl text-white mb-1">Bienvenido de vuelta</h1>
            <p className="text-sm font-body text-purple-300">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-body font-black text-purple-300 mb-1.5 pl-1">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
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
              <label className="block text-xs font-body font-black text-purple-300 mb-1.5 pl-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400
                             hover:text-purple-200 transition-colors p-1"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-body font-bold text-red-300
                              bg-red-500/15 border-2 border-red-500/30 animate-[scaleIn_200ms_ease-out]">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-xl font-body font-black text-base text-white
                         transition-all duration-200 active:scale-[0.98] disabled:opacity-50
                         disabled:cursor-not-allowed mt-2
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2a0f50]"
              style={{
                background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
                boxShadow: loading ? 'none' : '0 4px 20px #ff3dac44',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Entrando...
                </span>
              ) : 'Entrar al panel'}
            </button>
          </form>

          {/* Link de regreso */}
          <p className="text-center mt-6">
            <a href="/" className="text-xs font-body text-purple-400 hover:text-purple-200
                                    transition-colors underline underline-offset-2">
              ← Volver al catálogo
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
