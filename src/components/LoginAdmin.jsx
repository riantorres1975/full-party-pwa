import { useState } from 'react';

export default function LoginAdmin({ onLogin, loading, error }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'linear-gradient(135deg, #1a0733 0%, #2a0f50 50%, #3d1a6e 100%)' }}>

      {/* Card */}
      <div className="w-full max-w-sm">

        {/* Logo / título */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎪</div>
          <h1 className="font-display text-3xl text-white mb-1">Panel Admin</h1>
          <p className="text-sm font-body text-purple-300">Gestión de pedidos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-body font-black text-purple-300 mb-1.5 pl-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@tutienda.com"
              required
              autoComplete="email"
              className="w-full rounded-2xl px-4 py-3 text-sm font-body font-semibold
                         outline-none transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '2px solid rgba(168,85,247,0.3)',
                color: 'white',
              }}
              onFocus={e  => e.target.style.borderColor = '#a855f7'}
              onBlur={e   => e.target.style.borderColor = 'rgba(168,85,247,0.3)'}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-body font-black text-purple-300 mb-1.5 pl-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full rounded-2xl px-4 py-3 pr-12 text-sm font-body font-semibold
                           outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '2px solid rgba(168,85,247,0.3)',
                  color: 'white',
                }}
                onFocus={e => e.target.style.borderColor = '#a855f7'}
                onBlur={e  => e.target.style.borderColor = 'rgba(168,85,247,0.3)'}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400
                           hover:text-purple-200 transition-colors p-1"
                aria-label={showPass ? 'Ocultar' : 'Mostrar'}
              >
                {showPass ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
                         a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878
                         9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59
                         3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025
                         10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                         -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl px-4 py-3 text-sm font-body font-bold text-red-300
                            animate-fade-in"
                 style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3.5 rounded-2xl font-body font-black text-base text-white
                       transition-all duration-200 active:scale-[0.98] disabled:opacity-50
                       disabled:cursor-not-allowed mt-2"
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
  );
}
