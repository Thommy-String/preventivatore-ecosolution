import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import QuotePage from './pages/QuotePage';
import EditQuotePage from './pages/EditQuotePage';
import ContractPage from './pages/ContractPage';
import EditContractPage from './pages/EditContractPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ─── LOGIN (pubblica) ─── */}
        <Route path="/login" element={<LoginPage />} />

        {/* ─── PAGINE PUBBLICHE (link cliente) — uniche accessibili senza login ─── */}
        <Route path="/quote/:quoteId" element={<QuotePage />} />
        <Route path="/contract/:quoteId" element={<ContractPage />} />

        {/* ─── DASHBOARD (protetta) ─── */}
        <Route path="/" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

        {/* ─── EDITOR ADMIN (protetti) ─── */}
        <Route path="/admin/quote/:quoteId/edit" element={<ProtectedRoute><EditQuotePage /></ProtectedRoute>} />
        <Route path="/admin/contract/:quoteId/edit" element={<ProtectedRoute><EditContractPage /></ProtectedRoute>} />

        {/* ─── ANTEPRIME ADMIN (protette) ─── */}
        <Route path="/admin/quote/:quoteId/preview" element={<ProtectedRoute><QuotePage adminMode /></ProtectedRoute>} />
        <Route path="/admin/contract/:quoteId/preview" element={<ProtectedRoute><ContractPage adminMode /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;