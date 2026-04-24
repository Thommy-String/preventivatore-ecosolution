import { X } from 'lucide-react';

const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
    {children}
  </label>
);

const StyledInput = (props) => (
  <input
    {...props}
    className="block w-full px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm placeholder:text-gray-400"
  />
);

export default function CompanyDataEditor({ companyData, setEditingQuote }) {
  const updateCompanyData = (updates) => {
    setEditingQuote(prev => ({
      ...prev,
      companyData: { ...prev.companyData, ...updates }
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      // Converte l'immagine in base64 data URL
      const logoData = event.target.result;
      updateCompanyData({ logo: logoData });
    };
    reader.readAsDataURL(file);
  };

  const data = companyData || {
    useCustom: false,
    name: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    vatId: '',
    taxId: '',
    bankName: '',
    bankBranch: '',
    accountNumber: '',
    iban: '',
    sdi: ''
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="w-1 h-6 bg-purple-500 rounded-full"></span> Dati Aziendali
        </h2>
        <button
          onClick={() => updateCompanyData({ useCustom: !data.useCustom })}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
            data.useCustom
              ? 'bg-purple-50 border-purple-200 text-purple-600'
              : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}
        >
          {data.useCustom ? '✓ Personalizzati' : 'Usa ECO SOLUTION'}
        </button>
      </div>

      {!data.useCustom ? (
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-700 font-medium">
            Questo preventivo userà i dati di <strong>ECO SOLUTION S.a.s.</strong>
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Clicca su "Personalizzati" per cambiare i dati solo per questo preventivo.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Sezione Informazioni Generali */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 text-gray-700 uppercase tracking-wider">Informazioni Generali</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome Azienda</Label>
                <StyledInput
                  value={data.name}
                  onChange={(e) => updateCompanyData({ name: e.target.value })}
                  placeholder="Es. Mio Nome Azienda S.r.l."
                />
              </div>
              <div>
                <Label>Sito Web</Label>
                <StyledInput
                  value={data.website}
                  onChange={(e) => updateCompanyData({ website: e.target.value })}
                  placeholder="Es. www.miosite.it"
                />
              </div>
              <div>
                <Label>Email</Label>
                <StyledInput
                  type="email"
                  value={data.email}
                  onChange={(e) => updateCompanyData({ email: e.target.value })}
                  placeholder="Es. info@miosite.it"
                />
              </div>
              <div>
                <Label>Telefono</Label>
                <StyledInput
                  value={data.phone}
                  onChange={(e) => updateCompanyData({ phone: e.target.value })}
                  placeholder="Es. +39 333 123 4567"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Indirizzo</Label>
                <StyledInput
                  value={data.address}
                  onChange={(e) => updateCompanyData({ address: e.target.value })}
                  placeholder="Es. Via Roma 123, 20100 Milano (MI)"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Logo Azienda</Label>
                <div className="space-y-2">
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Carica logo dal dispositivo</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (max 5MB)</p>
                    </div>
                  </div>
                  {data.logo && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3">
                      <img src={data.logo} alt="Logo preview" className="w-12 h-12 object-contain rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Logo caricato</p>
                        <button
                          onClick={() => updateCompanyData({ logo: '' })}
                          className="text-xs text-red-500 hover:text-red-700 font-medium mt-1"
                        >
                          Rimuovi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sezione Dati Fiscali */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3 text-gray-700 uppercase tracking-wider">Dati Fiscali</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Partita IVA</Label>
                <StyledInput
                  value={data.vatId}
                  onChange={(e) => updateCompanyData({ vatId: e.target.value })}
                  placeholder="Es. IT12345678901"
                />
              </div>
              <div>
                <Label>Codice Fiscale</Label>
                <StyledInput
                  value={data.taxId}
                  onChange={(e) => updateCompanyData({ taxId: e.target.value })}
                  placeholder="Es. MRORSS80A01H501J"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Codice SDI</Label>
                <StyledInput
                  value={data.sdi}
                  onChange={(e) => updateCompanyData({ sdi: e.target.value })}
                  placeholder="Es. T9K4ZHO"
                />
              </div>
            </div>
          </div>

          {/* Sezione Coordinate Bancarie */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3 text-gray-700 uppercase tracking-wider">Coordinate Bancarie</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Banca</Label>
                <StyledInput
                  value={data.bankName}
                  onChange={(e) => updateCompanyData({ bankName: e.target.value })}
                  placeholder="Es. Banca di Credito Cooperativo"
                />
              </div>
              <div>
                <Label>Filiale</Label>
                <StyledInput
                  value={data.bankBranch}
                  onChange={(e) => updateCompanyData({ bankBranch: e.target.value })}
                  placeholder="Es. Filiale di Milano (MI)"
                />
              </div>
              <div>
                <Label>Numero C/C</Label>
                <StyledInput
                  value={data.accountNumber}
                  onChange={(e) => updateCompanyData({ accountNumber: e.target.value })}
                  placeholder="Es. 123456789"
                />
              </div>
              <div>
                <Label>IBAN</Label>
                <StyledInput
                  value={data.iban}
                  onChange={(e) => updateCompanyData({ iban: e.target.value })}
                  placeholder="Es. IT89L0308414409000000700001"
                />
              </div>
            </div>
          </div>

          {/* Pulsante Reset */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                updateCompanyData({
                  useCustom: false,
                  name: '',
                  logo: '',
                  address: '',
                  phone: '',
                  email: '',
                  website: '',
                  vatId: '',
                  taxId: '',
                  bankName: '',
                  bankBranch: '',
                  accountNumber: '',
                  iban: '',
                  sdi: ''
                });
              }}
              className="text-xs font-bold text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-200 transition-all"
            >
              Ripristina ECO SOLUTION
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
