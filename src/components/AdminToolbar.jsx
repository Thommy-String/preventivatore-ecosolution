import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Pencil, Eye, FileText, FileSignature,
  Link as LinkIcon, Download, Check, ExternalLink
} from 'lucide-react';

/**
 * Barra admin sticky usata in TUTTE le pagine admin
 * (editor preventivo, preview preventivo, editor contratto, preview contratto).
 *
 * NON viene mai mostrata sulle pagine pubbliche (`/quote/:id`, `/contract/:id`).
 *
 * Props:
 *  - quoteId: string                    (id del preventivo)
 *  - clientName, projectName: string    (mostrati come breadcrumb)
 *  - active: 'edit-quote' | 'preview-quote' | 'edit-contract' | 'preview-contract'
 *  - hasContract: boolean               (se false → mostra "Genera Contratto" invece di "Editor Contratto")
 *  - onSave?: () => Promise|void        (se passata, mostra il pulsante Salva)
 *  - saving?: boolean
 *  - onDownloadPdf?: () => void         (mostrato solo nelle preview)
 *  - extraRight?: ReactNode             (slot opzionale per pulsanti specifici della pagina)
 */
export default function AdminToolbar({
  quoteId,
  clientName,
  projectName,
  active,
  hasContract = true,
  onSave,
  saving = false,
  onDownloadPdf,
  extraRight,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [savedFlash, setSavedFlash] = useState(false);
  const [linkCopied, setLinkCopied] = useState(null); // 'quote' | 'contract' | null

  // Cmd/Ctrl+S → Salva (solo se onSave è disponibile)
  useEffect(() => {
    if (!onSave) return;
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        triggerSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSave]);

  const triggerSave = async () => {
    if (!onSave || saving) return;
    try {
      await onSave();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    } catch (e) {
      // l'errore lo gestisce la pagina chiamante
    }
  };

  const copyLink = (kind) => {
    const path = kind === 'quote' ? `/quote/${quoteId}` : `/contract/${quoteId}`;
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(kind);
      setTimeout(() => setLinkCopied(null), 1800);
    });
  };

  const tabBase =
    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap';
  const tabActive = 'bg-black text-white';
  const tabIdle = 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-gray-100';

  const tabs = [
    { id: 'edit-quote',     label: 'Editor',         icon: Pencil,        to: `/admin/quote/${quoteId}/edit` },
    { id: 'preview-quote',  label: 'Anteprima',      icon: Eye,           to: `/admin/quote/${quoteId}/preview` },
    {
      id: 'edit-contract',
      label: hasContract ? 'Editor Contratto' : '+ Genera Contratto',
      icon: FileSignature,
      to: `/admin/contract/${quoteId}/edit`,
    },
    { id: 'preview-contract', label: 'Anteprima Contratto', icon: FileText, to: `/admin/contract/${quoteId}/preview` },
  ];

  return (
    <header className="bg-white/85 backdrop-blur-xl border-b border-[#e8e8ed] sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex items-center gap-3 flex-wrap">

        {/* ── SX: back + breadcrumb ── */}
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 text-[#86868b] hover:text-[#1d1d1f] transition-colors shrink-0"
          title="Torna alla Dashboard"
        >
          <ArrowLeft size={16} />
          <span className="text-[12px] font-semibold hidden sm:inline">Dashboard</span>
        </button>

        <div className="hidden md:flex items-center gap-2 min-w-0 pl-3 border-l border-[#e8e8ed]">
          <span className="text-[11px] text-[#a1a1a6] font-medium">Cliente:</span>
          <span className="text-[12px] font-bold text-[#1d1d1f] truncate max-w-[140px]">
            {clientName || '—'}
          </span>
          <span className="text-[#d2d2d7]">·</span>
          <span className="text-[12px] text-[#86868b] truncate max-w-[200px]">
            {projectName || 'Senza titolo'}
          </span>
        </div>

        {/* ── CENTRO: tab di navigazione ── */}
        <nav className="flex items-center gap-1 ml-auto md:ml-3">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <Link
                key={t.id}
                to={t.to}
                className={`${tabBase} ${isActive ? tabActive : tabIdle}`}
                title={t.label}
              >
                <Icon size={13} />
                <span className="hidden lg:inline">{t.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── DX: azioni rapide ── */}
        <div className="flex items-center gap-1.5 ml-auto md:ml-0">
          {/* Copy link cliente */}
          <button
            onClick={() => copyLink('quote')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-[#0071e3] bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
            title="Copia link preventivo per il cliente"
          >
            {linkCopied === 'quote' ? <Check size={12} /> : <LinkIcon size={12} />}
            <span className="hidden md:inline">{linkCopied === 'quote' ? 'Copiato!' : 'Link Preventivo'}</span>
          </button>

          {hasContract && (
            <button
              onClick={() => copyLink('contract')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all"
              title="Copia link contratto per il cliente"
            >
              {linkCopied === 'contract' ? <Check size={12} /> : <LinkIcon size={12} />}
              <span className="hidden md:inline">{linkCopied === 'contract' ? 'Copiato!' : 'Link Contratto'}</span>
            </button>
          )}

          {/* Apri pagina pubblica in nuovo tab (utile per testare) */}
          <a
            href={
              active === 'preview-contract' || active === 'edit-contract'
                ? `/contract/${quoteId}`
                : `/quote/${quoteId}`
            }
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center justify-center w-8 h-8 text-[#86868b] hover:text-[#1d1d1f] hover:bg-gray-100 rounded-lg transition-all"
            title="Apri pagina cliente in una nuova scheda"
          >
            <ExternalLink size={13} />
          </a>

          {/* Download PDF (solo nelle preview) */}
          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all"
              title="Scarica PDF"
            >
              <Download size={12} />
              <span className="hidden md:inline">PDF</span>
            </button>
          )}

          {extraRight}

          {/* Salva (solo nelle pagine editor) */}
          {onSave && (
            <button
              onClick={triggerSave}
              disabled={saving}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-bold text-white rounded-lg transition-all disabled:opacity-50 ${
                savedFlash ? 'bg-emerald-600' : 'bg-black hover:bg-gray-800'
              }`}
              title="Salva (⌘S / Ctrl+S)"
            >
              {savedFlash ? <Check size={13} /> : null}
              {saving ? 'Salvataggio…' : savedFlash ? 'Salvato' : 'Salva'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
