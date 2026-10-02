import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { homeFor, useAuth } from '../../store/auth';
import { ErrorBox, Logo } from '../../components/ui';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [phoneDigits, setPhoneDigits] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const signedIn = await login(`+998${phoneDigits}`, password);
      navigate(from ?? homeFor(signedIn.role), { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-900 px-4">
      <img src="/images/hero/dasturxon.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/80 to-brand-900/60" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo light />
        </div>
        <form onSubmit={submit} className="card space-y-4 p-6 sm:p-8">
          <div>
            <h1 className="text-xl font-extrabold">Xodimlar uchun kirish</h1>
            <p className="mt-1 text-sm text-stone-500">Boshqaruv paneli, oshxona va kuryerlar</p>
          </div>
          <div>
            <label className="label" htmlFor="login-phone">
              Telefon raqam
            </label>
            <div className="flex">
              <span className="flex items-center rounded-l-xl border border-r-0 border-stone-200 bg-stone-100 px-3 text-sm font-semibold text-stone-600">+998</span>
              <input
                id="login-phone"
                className="input rounded-l-none"
                inputMode="numeric"
                autoComplete="username"
                placeholder="901234567"
                value={phoneDigits}
                onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 9))}
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="login-password">
              Parol
            </label>
            <input id="login-password" type="password" className="input" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error != null && <ErrorBox error={error} />}
          <button className="btn-primary w-full py-3" disabled={busy || phoneDigits.length !== 9 || !password}>
            {busy ? 'Kirilmoqda…' : 'Kirish'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-stone-400 hover:text-white">
            ← Saytga qaytish
          </Link>
        </p>
      </div>
    </div>
  );
}
