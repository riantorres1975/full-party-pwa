import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, User, Mail } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useLanguage } from '../../../hooks/useLanguage';

const BG = 'linear-gradient(135deg, #0f0320 0%, #1a0733 40%, #2d1055 100%)';

const inputClasses = `w-full rounded-xl pl-10 pr-4 py-3 text-sm font-body font-semibold
  bg-white/[0.07] border border-white/10 text-white
  placeholder:text-purple-400/50
  focus:border-purple-400/60 focus:bg-white/[0.10] focus:ring-0
  outline-none transition-all duration-200`;

function Glows() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
      <div className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #ff3dac, transparent 70%)' }} />
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="relative w-full max-w-md rounded-3xl p-8 sm:p-10"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
      {children}
    </div>
  );
}

export default function RegistroPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading | invalid | form | success
  const [invite, setInvite] = useState(null); // { email, role }

  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const nombreRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    supabase.rpc('get_invite_by_token', { p_token: token })
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          setStatus('invalid');
        } else {
          setInvite({ email: data[0].email, role: data[0].role });
          setStatus('form');
        }
      });
  }, [token]);

  useEffect(() => {
    if (status === 'form') {
      setTimeout(() => nombreRef.current?.focus(), 100);
    }
  }, [status]);

  function validate() {
    const errs = {};
    if (password.length < 8) errs.password = t('registro.passwordTooShort');
    if (password !== confirmPassword) errs.confirmPassword = t('registro.passwordMismatch');
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitError('');
    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          data: { nombre: nombre.trim() || undefined },
        },
      });

      if (error) throw error;

      // Si "Confirm email" está ON en Supabase, data.session será null
      if (!data.session) {
        setStatus('checkEmail');
        return;
      }

      // Sesión inmediata — redirigir al admin
      navigate('/admin', { replace: true });
    } catch (err) {
      console.error('[RegistroPage]', err);
      setSubmitError(err.message || 'Error al crear cuenta');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <Glows />
        <div className="w-8 h-8 rounded-full border-[3px] border-purple-700 border-t-purple-300 animate-spin" />
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
        <Glows />
        <Card>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)' }}>
              <span className="text-white font-display text-xl">FP</span>
            </div>
            <h1 className="font-display text-xl text-white">{t('registro.invalidToken')}</h1>
            <p className="text-sm font-body text-purple-300">{t('registro.invalidTokenDesc')}</p>
            <a href="/" className="text-sm underline text-purple-400 hover:text-purple-200 transition-colors">
              {t('registro.goHome')}
            </a>
          </div>
        </Card>
      </div>
    );
  }

  if (status === 'checkEmail') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
        <Glows />
        <Card>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)' }}>
              <Mail size={28} className="text-white" />
            </div>
            <h1 className="font-display text-xl text-white">{t('registro.checkEmail')}</h1>
            <p className="text-sm font-body text-purple-300">{invite?.email}</p>
          </div>
        </Card>
      </div>
    );
  }

  // status === 'form'
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
      <Glows />
      <Card>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)' }}>
            <span className="text-white font-display text-xl tracking-wide">FP</span>
          </div>
          <h1 className="font-display text-2xl text-white mb-1 tracking-wide">Full Party</h1>
          <div className="flex items-center gap-1.5 mt-2">
            <ShieldCheck size={13} className="text-purple-400" />
            <p className="text-xs font-body text-purple-400">{t('registro.subtitle')}</p>
          </div>
        </div>

        <div className="h-px bg-white/[0.07] mb-8" />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email — readonly */}
          <div>
            <label className="block text-xs font-body font-bold text-purple-300/80 mb-2 pl-0.5 tracking-wide uppercase">
              {t('registro.email')}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/60" />
              <input
                type="email"
                value={invite?.email ?? ''}
                readOnly
                className={`${inputClasses} opacity-60 cursor-not-allowed`}
              />
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-body font-bold text-purple-300/80 mb-2 pl-0.5 tracking-wide uppercase">
              {t('registro.nombre')}
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/60" />
              <input
                ref={nombreRef}
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-xs font-body font-bold text-purple-300/80 mb-2 pl-0.5 tracking-wide uppercase">
              {t('registro.password')}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/60" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                placeholder="••••••••"
                className={`${inputClasses} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/60 hover:text-purple-300 transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-xs text-red-400 pl-0.5">{errors.password}</p>}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-xs font-body font-bold text-purple-300/80 mb-2 pl-0.5 tracking-wide uppercase">
              {t('registro.confirmPassword')}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/60" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: '' })); }}
                placeholder="••••••••"
                className={`${inputClasses} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/60 hover:text-purple-300 transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400 pl-0.5">{errors.confirmPassword}</p>}
          </div>

          {submitError && (
            <p className="text-xs text-red-400 text-center">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !password || !confirmPassword}
            className="w-full py-3.5 rounded-xl text-sm font-body font-bold text-white transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)' }}
          >
            {submitting ? '...' : t('registro.submit')}
          </button>
        </form>
      </Card>
    </div>
  );
}
