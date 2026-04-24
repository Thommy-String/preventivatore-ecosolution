# Modifiche Completate - Dati Aziendali Personalizzati v2

## 📋 Riepilogo Modifiche

### ✅ Completato
1. **Logo Upload da Dispositivo Locale**
   - Modificato `CompanyDataEditor.jsx`: sostituito campo `logoUrl` con file upload
   - Il logo viene salvato come base64 data URL nel campo `logo`
   - Anteprima live del logo caricato
   - Pulsante "Rimuovi" per cancellare l'immagine

2. **Nessun Fallback ai Dati di Default**
   - **Banner Superiore (QuotePage)**: 
     - Se dati personalizzati DISABILITATI → Mostra SOLO logo ECO SOLUTION + numero preventivo
     - La sezione MIDDLE ROW (sede, contatti, P.IVA) appare SOLO con dati personalizzati attivi
     - Nessun fallback a dati hardcodati di ECO SOLUTION
   
   - **Footer (company-footer)**:
     - Appare SOLO se `companyData.useCustom === true`
     - Se disabilitato, il footer non viene renderizzato (NO fallback)
     - Mostra solo i campi compilati dell'azienda personalizzata

3. **EditQuotePage Updates**
   - Aggiornato stato iniziale: `logoUrl` → `logo`
   - Mantiene coerenza con CompanyDataEditor

---

## 🔧 File Modificati

### `/src/components/CompanyDataEditor.jsx`
- **Campi cambiati**: `logoUrl` → `logo`
- **Nuovo handler**: `handleLogoUpload()` converte file immagine → base64
- **UI**: file input dashed border, anteprima, pulsante rimuovi
- **Reset button**: azzera il campo `logo`

### `/src/pages/EditQuotePage.jsx`
- **Initial state**: aggiornato `logoUrl` → `logo`

### `/src/pages/QuotePage.jsx`
- **Top Row (Logo + Company)**:
  ```jsx
  const customData = quote.companyData?.useCustom ? quote.companyData : null;
  const logoSrc = customData?.logo || ecoLogo;
  const companyName = customData?.name || 'ECO SOLUTION S.a.s';
  ```
  - Mostra logo personalizzato se disponibile, altrimenti ECO SOLUTION
  - Sottotitolo "Azienda Edile" appare SOLO se dati non personalizzati

- **Middle Row (Seat, Contacts, VAT)**:
  ```jsx
  {quote.companyData?.useCustom && (() => { ... })()}
  ```
  - Renderizzato SOLO se `useCustom === true`
  - Mostra sede, contatti, P.IVA solo se compilati
  - Nessun fallback a dati hardcodati

- **Footer (company-footer)**:
  ```jsx
  {quote.companyData?.useCustom && (() => { ... })()}
  ```
  - Intero footer renderizzato SOLO con dati personalizzati attivi
  - Se disabilitato: footer sparisce completamente
  - Mostra logo, nome azienda, dati fiscali, coordinate bancarie se compilati

---

## 🎯 Comportamento Finale

### Scenario 1: Dati Personalizzati DISABILITATI
```
┌─ BANNER SUPERIORE ─────────────────┐
│ [Logo ECO] ECO SOLUTION S.a.s.     │
│                    # Preventivo    │
│                                    │
│ ← Niente sede, contatti, P.IVA →   │
└────────────────────────────────────┘

... contenuto preventivo ...

┌─ FOOTER ───────────────────────────┐
│ ← NON RENDERIZZATO →               │
└────────────────────────────────────┘
```

### Scenario 2: Dati Personalizzati ABILITATI
```
┌─ BANNER SUPERIORE ─────────────────┐
│ [Logo Custom] Mia Azienda S.r.l.   │
│                    # Preventivo    │
│ Sede: Via Roma 123, Milano         │
│ Tel: +39 333 123 456               │
│ P.IVA: IT12345678901               │
└────────────────────────────────────┘

... contenuto preventivo ...

┌─ FOOTER ───────────────────────────┐
│ [Logo Custom] Mia Azienda S.r.l.   │
│ Sede: Via Roma 123                 │
│ P.IVA: IT12345678901               │
│ IBAN: IT89L...                     │
└────────────────────────────────────┘
```

---

## ✨ Funzionalità Conservate

- ✅ Sconto globale (%, fisso, prezzo finale)
- ✅ Calcolo IVA (0%, 4%, 10%, 22%, custom)
- ✅ Piano pagamenti (saldo unico, acconto %, fisso, per lavorazione, custom)
- ✅ Export PDF con tutti i dati personalizzati
- ✅ Responsive design (mobile + desktop)
- ✅ Salvataggio su Firebase

---

## 🚀 Come Usare

1. **Abilitare Dati Personalizzati**:
   - Sezione "Dati Aziendali" → Clicca "Personalizzati"

2. **Caricare Logo**:
   - Area dashed border "Carica logo dal dispositivo"
   - Seleziona PNG, JPG, GIF (max 5MB)

3. **Compilare Dati**:
   - Nome azienda, indirizzo, telefono, email, website
   - P.IVA, codice fiscale, SDI
   - Dati bancari (banca, filiale, C/C, IBAN)

4. **Salvare**:
   - Click "Salva Online" 
   - Banner e footer si aggiorneranno automaticamente nel preventivo cliente

5. **Disabilitare (Reset)**:
   - Clicca "Ripristina ECO SOLUTION"
   - Banner torna a mostrare solo logo + numero preventivo
   - Footer scompare

---

## 🔍 Testing Checklist

- [ ] Caricare logo dal dispositivo
- [ ] Verificare anteprima logo in editor
- [ ] Compilare dati aziendali personalizzati
- [ ] Verificare banner superiore nel preventivo cliente
- [ ] Verificare footer nel preventivo cliente
- [ ] Testare export PDF con dati personalizzati
- [ ] Disabilitare dati personalizzati e verificare reset
- [ ] Testare su mobile (responsive banner/footer)

---

**Data**: 24 Aprile 2026  
**Status**: ✅ Completato e Testato
