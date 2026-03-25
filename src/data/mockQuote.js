export const mockQuote = {
  id: "preventivo-123",
  clientName: "Mario Rossi",
  projectName: "Ristrutturazione Appartamento, Milano",
  date: "9 Gennaio 2026",
  
  company: {
    name: "Parquet Pro di Mario Rossi",
    address: "Via Garibaldi 10, 20121 Milano MI",
    vatId: "IT1234567890",
    email: "info@parquetpro.it",
    phone: "333 1234567"
  },

  sections: [
    {
      id: "sect-1",
      title: "Fornitura e Posa Parquet Rovere 'Eleganza Naturale'",
      description: "Parquet prefinito di alta qualità, spessore 14mm, finitura spazzolata e verniciata opaca. Una scelta di stile per un ambiente moderno e accogliente, che valorizza la luce e lo spazio.",
      photos: [
        { type: 'before', url: 'https://placehold.co/600x400/ccc/fff?text=Stato+Attuale', caption: 'Stato Attuale del Pavimento' },
        { type: 'after', url: 'https://placehold.co/600x400/8c8/fff?text=Lavoro+Finito', caption: 'Nuovo Parquet Installato' }
      ],
      items: [
        { description: "Parquet Rovere 'Eleganza Naturale'", quantity: 50, unit: "mq", price: 85.00 },
        { description: "Posa flottante con materassino acustico", quantity: 50, unit: "mq", price: 25.00 },
      ],
    },
    {
      id: "sect-2",
      title: "Finiture Perimetrali",
      description: "Installazione professionale di battiscopa e soglie per una finitura completa e armoniosa con il nuovo pavimento.",
      photos: [],
      items: [
        { description: "Battiscopa impiallacciato (7cm)", quantity: 60, unit: "ml", price: 12.00 },
        { description: "Posa battiscopa e soglie", quantity: 1, unit: "forfait", price: 450.00 },
        { description: "Trasporto e logistica di cantiere", quantity: 1, unit: "forfait", price: 200.00 },
      ],
    },
  ],

  summary: {
    subtotal: 6800.00,
    vatPercentage: 22,
    vat: 1496.00,
    total: 8296.00,
  },

  teamMembers: [
    {
      id: 'default-1',
      name: "Andrea",
      role: "Capo Parquettista",
      photoUrl: "https://ipizlwahdmkiweecetsx.supabase.co/storage/v1/object/public/demo/Screenshot%202026-01-10%20alle%2011.38.59.png",
      quirk: "Ha lavorato 9 anni in Germania del Nord in edilizia e posa pavimenti. Vederlo posare è un'arte."
    },
    {
      id: 'default-2',
      name: "Thomas",
      role: "Commerciale",
      phone: "00393342221212",
      photoUrl: "https://ipizlwahdmkiweecetsx.supabase.co/storage/v1/object/public/demo/thommy-Giacca%20e%20cravatta.jpg",
      quirk: "Il suo parquet preferito è la spina francese colore rovere naturale"
    }
  ],
  
  notes: "Questo preventivo ha una validità di 30 giorni. I tempi di consegna del materiale sono stimati in 15 giorni lavorativi dalla conferma dell'ordine."
};
