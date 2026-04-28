import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Wrapper per pagine che richiedono autenticazione admin.
 * - Se loading: mostra spinner
 * - Se non loggato: redirect a /login (memorizza la pagina richiesta per redirect post-login)
 * - Se loggato: renderizza i children
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <Loader2 className="animate-spin text-[#86868b]" size={28} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
