import ecoLogo from '../assets/images/eco-solutions-logo-.jpeg';
import proCasaLogo from '../assets/images/pro casa parquet logo.png';

// Preset aziendali predefiniti.
// Ogni quote può avere companyData.preset = 'eco' | 'procasa' | (assente => 'eco' di default)
// oppure companyData.useCustom = true → usa i campi custom dentro companyData.

export const COMPANY_PRESETS = {
  eco: {
    id: 'eco',
    name: 'ECO SOLUTION S.a.s.',
    shortName: 'ECO Solution',
    tagline: 'Azienda Edile',
    logo: ecoLogo,
    address: 'Via Roma, 8',
    addressLine2: '20823 Lentate sul Seveso (MB)',
    legalAddress: 'Via Primo Maggio, 3\n23892 Bulciago (LC)',
    phone: '+39 334 222 1212',
    email: 'info@ecosolutionsas.it',
    website: '',
    vatId: '04640600161',
    taxId: '04640600161',
    bankName: 'Banca di Credito Cooperativo di Barlassina',
    bankBranch: 'Filiale di Lentate sul Seveso (MB)\nVia Papa Giovanni XXIII, 6\n20823 Lentate sul Seveso (MB)',
    accountNumber: '06/605276',
    iban: 'IT29 L083 7433 2400 0000 6605 276',
    sdi: 'T9K4ZHO',
  },
  procasa: {
    id: 'procasa',
    name: 'Pro Casa Parquet Milano',
    shortName: 'Pro Casa Parquet',
    tagline: 'Posa Pavimenti & Parquet',
    logo: proCasaLogo,
    address: 'Via Roma, 8',
    addressLine2: '20823 Lentate sul Seveso (MB)',
    phone: '+39 334 222 1212',
    email: 'info@posaparquetmilano.it',
    website: 'www.posaparquetmilano.it',
    vatId: '01914870330',
    taxId: 'DSCNDR88R22Z129B',
    bankName: '',
    bankBranch: '',
    accountNumber: '',
    iban: 'DSCNDR88R22Z129B',
    sdi: '',
  },
};

export const PRESET_LIST = Object.values(COMPANY_PRESETS);

/**
 * Risolve i dati aziendali effettivi da usare per un preventivo.
 * - Se useCustom: ritorna i campi custom (con fallback a stringhe vuote).
 * - Se preset specificato: ritorna il preset corrispondente.
 * - Default: ECO Solution.
 */
export function resolveCompanyData(companyData) {
  if (!companyData) return COMPANY_PRESETS.eco;
  if (companyData.useCustom) {
    return {
      id: 'custom',
      name: companyData.name || 'Azienda',
      shortName: companyData.name || 'Azienda',
      logo: companyData.logo || null,
      address: companyData.address || '',
      addressLine2: companyData.addressLine2 || '',
      legalAddress: companyData.legalAddress || '',
      phone: companyData.phone || '',
      email: companyData.email || '',
      website: companyData.website || '',
      vatId: companyData.vatId || '',
      taxId: companyData.taxId || '',
      bankName: companyData.bankName || '',
      bankBranch: companyData.bankBranch || '',
      accountNumber: companyData.accountNumber || '',
      iban: companyData.iban || '',
      sdi: companyData.sdi || '',
    };
  }
  const preset = companyData.preset || 'eco';
  return COMPANY_PRESETS[preset] || COMPANY_PRESETS.eco;
}
