import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import QuotePage from './pages/QuotePage';
import EditQuotePage from './pages/EditQuotePage';
import ContractPage from './pages/ContractPage';
import { mockQuote } from './data/mockQuote';

function App() {
  const [quotes, setQuotes] = useState([mockQuote]);

  return (
    <Routes>
      <Route 
        path="/" 
        element={<AdminDashboard quotes={quotes} setQuotes={setQuotes} />} 
      />
      <Route 
        path="/admin" 
        element={<AdminDashboard quotes={quotes} setQuotes={setQuotes} />} 
      />
      <Route 
        path="/quote/:quoteId" 
        element={<QuotePage quotes={quotes} />} 
      />
      <Route 
        path="/admin/quote/:quoteId/edit" 
        element={<EditQuotePage quotes={quotes} setQuotes={setQuotes} />} 
      />
      <Route 
        path="/contract/:quoteId" 
        element={<ContractPage />} 
      />
    </Routes>
  );
}

export default App;