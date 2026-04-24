/**
 * Genera il testo predefinito dei Termini e Condizioni con il nome dell'azienda dinamico
 * @param {string} companyName - Il nome dell'azienda (es: "ECO SOLUTION S.a.s." o il nome custom)
 * @returns {string} Il testo dei Termini e Condizioni con il nome dell'azienda inserito
 */
export function getDefaultTermsAndConditions(companyName) {
  return `1. Validità del preventivo. Il presente preventivo ha validità di 30 (trenta) giorni dalla data di emissione. Decorso tale termine, ${companyName} si riserva il diritto di aggiornare i prezzi indicati.

2. Prezzi e imposte. Tutti gli importi indicati nel presente documento sono da intendersi al netto di IVA, che verrà applicata nella misura di legge vigente al momento della fatturazione.

3. Modalità di pagamento. I pagamenti dovranno essere effettuati secondo le modalità e le tempistiche indicate nella sezione "Condizioni di Pagamento". In caso di mancato o ritardato pagamento, ${companyName} si riserva il diritto di sospendere immediatamente l'esecuzione dei lavori e di applicare gli interessi moratori previsti dal D.Lgs. 231/2002.

4. Variazioni in corso d'opera. Eventuali variazioni, integrazioni o lavorazioni aggiuntive rispetto a quanto descritto nel presente preventivo dovranno essere concordate per iscritto tra le parti prima della loro esecuzione. Le variazioni comporteranno un adeguamento dei costi e dei tempi di consegna.

5. Tempi di esecuzione. I tempi indicati nel presente preventivo sono da considerarsi indicativi e non vincolanti. Eventuali ritardi dovuti a cause di forza maggiore, condizioni meteorologiche avverse, ritardi nella fornitura di materiali da terzi o impedimenti nell'accesso ai locali non potranno essere imputati a ${companyName}.

6. Obblighi del committente. Il committente si impegna a garantire il libero e sicuro accesso alle aree oggetto dell'intervento, a fornire l'allacciamento alla rete elettrica e idrica ove necessario, e a sgomberare preventivamente le aree di lavoro da arredi e oggetti personali. Eventuali danni a beni non rimossi dal committente non saranno imputabili a ${companyName}.

7. Responsabilità e assicurazione. ${companyName} è coperta da polizza assicurativa di responsabilità civile per danni a terzi derivanti dall'esecuzione dei lavori. Resta esclusa ogni responsabilità per danni preesistenti o non direttamente riconducibili alle opere oggetto del presente preventivo.

8. Smaltimento materiali. Lo smaltimento dei materiali di risulta è incluso nel preventivo solo se espressamente indicato nelle singole voci di spesa. In caso contrario, lo smaltimento sarà a carico del committente.

9. Risoluzione e recesso. In caso di recesso unilaterale da parte del committente dopo l'accettazione del preventivo, ${companyName} avrà diritto al pagamento dei lavori già eseguiti, dei materiali già acquistati e di un indennizzo pari al 20% dell'importo residuo non eseguito.

10. Privacy. I dati personali raccolti saranno trattati in conformità al Regolamento UE 2016/679 (GDPR) e utilizzati esclusivamente per le finalità connesse all'esecuzione del presente incarico.`;
}

/**
 * Ottiene il nome dell'azienda da visualizzare
 * @param {Object} companyData - Oggetto con i dati aziendali personalizzati o preset
 * @returns {string} Il nome dell'azienda (custom, preset selezionato o default ECO)
 */
export function getCompanyDisplayName(companyData) {
  if (companyData?.useCustom && companyData?.name) {
    return companyData.name;
  }
  // Mapping rapido dei preset (evita import circolare con companyPresets)
  const presetNames = {
    eco: 'ECO SOLUTION S.a.s.',
    procasa: 'Pro Casa Parquet Milano',
  };
  const presetId = companyData?.preset || 'eco';
  return presetNames[presetId] || 'ECO SOLUTION S.a.s.';
}
