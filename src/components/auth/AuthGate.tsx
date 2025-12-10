import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../../lib/supabaseClient';

type AuthGateProps = {
  children: ReactNode;
};

const AuthGate = ({ children }: AuthGateProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionAvailable, setSessionAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error) throw error;
        const sess = data?.session ?? null;
        setSessionAvailable(Boolean(sess));
      } catch (err: any) {
        if (!active) return;
        setSessionError(err?.message ?? 'No se pudo recuperar la sesión.');
      } finally {
        if (active) setLoading(false);
      }
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSessionAvailable(Boolean(newSession));
      setSessionError(null);
      setLoading(false);
    });

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setSessionError(err?.message ?? 'No se pudo iniciar sesión.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f3f1]">
        <div className="text-sm text-gray-600">Cargando sesión...</div>
      </div>
    );
  }

  if (!sessionAvailable) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background:
            'radial-gradient(circle at 18% 18%, rgba(210,236,221,0.85), transparent 36%), radial-gradient(circle at 80% 12%, rgba(255,232,225,0.8), transparent 36%), radial-gradient(circle at 50% 82%, rgba(207,224,212,0.7), transparent 36%), #f8f1ed',
        }}
      >
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute -top-10 -left-10 h-24 w-24 rounded-full bg-emerald-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-14 -right-12 h-28 w-28 rounded-full bg-rose-100/60 blur-3xl" />
          <div
            className="w-full relative rounded-3xl shadow-[0_20px_50px_-18px_rgba(0,0,0,0.28)] p-8 space-y-6 backdrop-blur-xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,249,246,0.9) 100%)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shadow-sm">
                🎄
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">Acceso POS Navidad</div>
                <p className="text-sm text-gray-600">Ingresa con tu usuario.</p>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-borderSoft px-3 py-2 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  placeholder="usuario@navidadpos.cl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-borderSoft px-3 py-2 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              {sessionError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {sessionError}
                </div>
              )}
              <button
                type="submit"
                className="w-full h-11 rounded-lg bg-emerald-600 text-white font-semibold shadow-soft hover:shadow-card transition"
              >
                Ingresar
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGate;
