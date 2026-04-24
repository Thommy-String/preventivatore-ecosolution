import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import QuotePage from './pages/QuotePage';
import EditQuotePage from './pages/EditQuotePage';
import ContractPage from './pages/ContractPage';
import EditContractPage from './pages/EditContractPage';

function App() {
  return (
    <Routes>
      {/* ─── DASHBOARD ─── */}
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />

      {/* ─── EDITOR ADMIN ─── */}
      <Route path="/admin/quote/:quoteId/edit" element={<EditQuotePage />} />
      <Route path="/admin/contract/:quoteId/edit" element={<EditContractPage />} />

      {/* ─── ANTEPRIME ADMIN (stesse pagine pubbliche + toolbar admin) ─── */}
      <Route path="/admin/quote/:quoteId/preview" element={<QuotePage adminMode />} />
      <Route path="/admin/contract/:quoteId/preview" element={<ContractPage adminMode />} />

      {/* ─── PAGINE PUBBLICHE (link cliente) — solo download PDF, NESSUNA azione ─── */}
      <Route path="/quote/:quoteId" element={<QuotePage />} />
      <Route path="/contract/:quoteId" element={<ContractPage />} />
    </Routes>
  );
}

export default App;