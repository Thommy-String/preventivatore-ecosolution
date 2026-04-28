import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ecoLogo from '../assets/images/eco-solutions-logo-.jpeg';

export default function LoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Se già loggato → vai direttamente alla dashboard
  if (!authLoading && user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      // Mappa errori Firebase a messaggi italiani
      const code = err?.code || '';
      let msg = 'Accesso non riuscito. Riprova.';
      if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
        msg = 'Email o password non corretti.';
      } else if (code.includes('too-many-requests')) {
        msg = 'Troppi tentativi. Riprova tra qualche minuto.';
      } else if (code.includes('network')) {
        msg = 'Errore di rete. Controlla la connessione.';
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-4 py-10 font-sans">
      <div className="w-full max-w-[380px]">

        {/* Logo + titolo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={ecoLogo}
            alt="Eco Solution"
            className="w-14 h-14 rounded-2xl object-cover border border-[#e8e8ed] shadow-sm mb-4"
          />
          <h1 className="text-[20px] font-bold text-[#1d1d1f] tracking-tight">
            Area riservata
          </h1>
          <p className="text-[12px] text-[#86868b] mt-1">
            Accedi per gestire i preventivi
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-[#e8e8ed] p-6 shadow-sm"
        >
          {/* Email */}
          <label className="block mb-3">
            <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5 block">
              Email
            </span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1a6]" size={15} />
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@azienda.it"
                className="w-full pl-9 pr-3 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] outline-none transition-all"
              />
            </div>
          </label>

          {/* Password */}
          <label className="block mb-4">
            <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5 block">
              Password
            </span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1a6]" size={15} />
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-[13px] text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] outline-none transition-all"
              />
            </div>
          </label>

          {/* Errore */}
          {error && (
            <div className="flex items-start gap-2 mb-4 p-2.5 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-700 leading-snug">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !email.trim() || !password}
            className="w-full h-11 flex items-center justify-center gap-2 bg-[#0071e3] hover:bg-[#0077ED] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-xl transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Accesso in corso…
              </>
            ) : (
              'Accedi'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[10px] text-[#a1a1a6] mt-6">
          Solo personale autorizzato. Ogni accesso viene registrato.
        </p>
      </div>
    </div>
  );
}
