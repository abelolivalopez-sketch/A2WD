/* =====================================================================
   TARIFAS DE A2WD  ·  el único sitio donde se cambian los precios
   ---------------------------------------------------------------------
   Lo usan:
     · la web (sección «Precios», en ES/FR/IT/EN)
     · el panel de creadores (pestaña «Tarifas», la chuleta)
   Para cambiar un precio: cambia el número de «precio» y guarda.
   Precios SIN IVA. «desde: true» muestra «desde 490 €».
   Las notas internas (márgenes, argumentos…) NO van aquí porque este
   archivo es público: están en el panel, guardadas en Supabase.
   ===================================================================== */
window.A2WD_TARIFAS = {
  actualizado: '2026-09-28',

  paquetes: [
    {
      id: 'esencial', precio: 490, desde: true, plazo: { es: '1 semana', fr: '1 semaine', it: '1 settimana', en: '1 week' },
      nombre: { es: 'Esencial', fr: 'Essentiel', it: 'Essenziale', en: 'Essential' },
      para: {
        es: 'Para estar en internet con buena imagen, rápido.',
        fr: 'Pour être en ligne avec une belle image, rapidement.',
        it: 'Per essere online con una bella immagine, in fretta.',
        en: 'Get online with a great look, fast.'
      },
      incluye: {
        es: ['Web de una página a medida', 'Perfecta en móvil', 'Botón de WhatsApp y llamada', 'Mapa y horarios', 'Enlaces a redes sociales'],
        fr: ['Site d’une page sur mesure', 'Parfait sur mobile', 'Bouton WhatsApp et appel', 'Plan et horaires', 'Liens vers vos réseaux sociaux'],
        it: ['Sito di una pagina su misura', 'Perfetto su smartphone', 'Pulsante WhatsApp e chiamata', 'Mappa e orari', 'Link ai social'],
        en: ['One-page custom website', 'Perfect on mobile', 'WhatsApp and call buttons', 'Map and opening hours', 'Social media links']
      }
    },
    {
      id: 'comercio', precio: 890, desde: true, destacado: true, plazo: { es: '2–3 semanas', fr: '2–3 semaines', it: '2–3 settimane', en: '2–3 weeks' },
      nombre: { es: 'Comercio', fr: 'Commerce', it: 'Negozio', en: 'Business' },
      para: {
        es: 'La web completa de tu negocio, lista para atraer clientes.',
        fr: 'Le site complet de votre commerce, prêt à attirer des clients.',
        it: 'Il sito completo della tua attività, pronto ad attirare clienti.',
        en: 'Your complete business website, ready to bring in customers.'
      },
      incluye: {
        es: ['Hasta 5 páginas a medida', 'Todo lo del paquete Esencial', 'Formulario de contacto', 'Ficha de Google optimizada', 'SEO básico para aparecer en Google', 'Galería de fotos o carta'],
        fr: ['Jusqu’à 5 pages sur mesure', 'Tout le pack Essentiel', 'Formulaire de contact', 'Fiche Google optimisée', 'SEO de base pour être trouvé sur Google', 'Galerie photos ou carte'],
        it: ['Fino a 5 pagine su misura', 'Tutto il pacchetto Essenziale', 'Modulo di contatto', 'Scheda Google ottimizzata', 'SEO di base per farti trovare su Google', 'Galleria foto o menù'],
        en: ['Up to 5 custom pages', 'Everything in Essential', 'Contact form', 'Optimised Google profile', 'Basic SEO to show up on Google', 'Photo gallery or menu']
      }
    },
    {
      id: 'reservas', precio: 1690, desde: true, plazo: { es: '4–6 semanas', fr: '4–6 semaines', it: '4–6 settimane', en: '4–6 weeks' },
      nombre: { es: 'Reservas / Tienda', fr: 'Réservations / Boutique', it: 'Prenotazioni / Shop', en: 'Bookings / Shop' },
      para: {
        es: 'Para vender o reservar online, también con la persiana bajada.',
        fr: 'Pour vendre ou réserver en ligne, même rideau baissé.',
        it: 'Per vendere o prenotare online, anche a serranda abbassata.',
        en: 'Sell or take bookings online, even when you’re closed.'
      },
      incluye: {
        es: ['Todo lo del paquete Comercio', 'Reservas online o tienda pequeña', 'Pago con tarjeta', 'Avisos por correo de cada pedido o reserva', 'Formación para gestionarlo tú'],
        fr: ['Tout le pack Commerce', 'Réservations en ligne ou petite boutique', 'Paiement par carte', 'Alerte e-mail à chaque commande ou réservation', 'Formation pour tout gérer vous-même'],
        it: ['Tutto il pacchetto Negozio', 'Prenotazioni online o piccolo shop', 'Pagamento con carta', 'Avviso via e-mail per ogni ordine o prenotazione', 'Formazione per gestirlo da solo'],
        en: ['Everything in Business', 'Online bookings or a small shop', 'Card payments', 'Email alert for every order or booking', 'Training so you can run it yourself']
      }
    }
  ],

  extras: [
    { id: 'idioma', precio: 150, nombre: { es: 'Idioma extra (traducción real)', fr: 'Langue supplémentaire (vraie traduction)', it: 'Lingua extra (traduzione vera)', en: 'Extra language (real translation)' }, unidad: { es: 'por idioma', fr: 'par langue', it: 'per lingua', en: 'per language' } },
    { id: 'pagina', precio: 90, nombre: { es: 'Página adicional', fr: 'Page supplémentaire', it: 'Pagina aggiuntiva', en: 'Extra page' }, unidad: { es: 'por página', fr: 'par page', it: 'per pagina', en: 'per page' } },
    { id: 'textos', precio: 120, nombre: { es: 'Redacción de textos', fr: 'Rédaction des textes', it: 'Scrittura dei testi', en: 'Copywriting' }, unidad: { es: 'por web', fr: 'par site', it: 'per sito', en: 'per site' } },
    { id: 'google', precio: 90, nombre: { es: 'Ficha de Google optimizada (paquete Esencial)', fr: 'Fiche Google optimisée (pack Essentiel)', it: 'Scheda Google ottimizzata (pacchetto Essenziale)', en: 'Optimised Google profile (Essential)' }, unidad: { es: 'una vez', fr: 'une fois', it: 'una volta', en: 'one-off' } },
    { id: 'logo', precio: 150, nombre: { es: 'Logotipo sencillo', fr: 'Logo simple', it: 'Logo semplice', en: 'Simple logo' }, unidad: { es: 'una vez', fr: 'une fois', it: 'una volta', en: 'one-off' } },
    { id: 'reservas', precio: 350, nombre: { es: 'Añadir reservas a una web existente', fr: 'Ajouter les réservations à un site existant', it: 'Aggiungere prenotazioni a un sito esistente', en: 'Add bookings to an existing site' }, unidad: { es: 'una vez', fr: 'une fois', it: 'una volta', en: 'one-off' } }
  ],

  mantenimiento: [
    {
      id: 'basico', precio: 29,
      nombre: { es: 'Mantenimiento', fr: 'Maintenance', it: 'Manutenzione', en: 'Care plan' },
      incluye: {
        es: ['Alojamiento y certificado de seguridad', 'Copias de seguridad', 'Pequeños cambios (30 min/mes)', 'Portal y app para pedirnos lo que necesites'],
        fr: ['Hébergement et certificat de sécurité', 'Sauvegardes', 'Petites modifications (30 min/mois)', 'Portail et app pour nous demander ce qu’il vous faut'],
        it: ['Hosting e certificato di sicurezza', 'Backup', 'Piccole modifiche (30 min/mese)', 'Portale e app per chiederci ciò che ti serve'],
        en: ['Hosting and security certificate', 'Backups', 'Small changes (30 min/month)', 'Client portal and app to ask us anything']
      }
    },
    {
      id: 'plus', precio: 59,
      nombre: { es: 'Mantenimiento Plus', fr: 'Maintenance Plus', it: 'Manutenzione Plus', en: 'Care plan Plus' },
      incluye: {
        es: ['Todo lo del Mantenimiento', 'Cambios y novedades (2 h/mes)', 'Informe mensual de visitas', 'Prioridad en las respuestas'],
        fr: ['Toute la Maintenance', 'Modifications et nouveautés (2 h/mois)', 'Rapport mensuel de visites', 'Réponses prioritaires'],
        it: ['Tutta la Manutenzione', 'Modifiche e novità (2 h/mese)', 'Report mensile delle visite', 'Risposte prioritarie'],
        en: ['Everything in Care plan', 'Changes and updates (2 h/month)', 'Monthly visitor report', 'Priority replies']
      }
    }
  ],

  // Textos fijos de la sección
  textos: {
    es: { desde: 'desde', mes: '/mes', iva: 'Precios sin IVA. Te damos presupuesto cerrado antes de empezar.', plazo: 'Plazo', extras: 'Extras', mant: 'Después de publicar', pedir: 'Pedir presupuesto', popular: 'El más elegido' },
    fr: { desde: 'à partir de', mes: '/mois', iva: 'Prix HT. Devis ferme avant de commencer.', plazo: 'Délai', extras: 'Options', mant: 'Après la mise en ligne', pedir: 'Demander un devis', popular: 'Le plus choisi' },
    it: { desde: 'da', mes: '/mese', iva: 'Prezzi IVA esclusa. Preventivo chiuso prima di iniziare.', plazo: 'Tempi', extras: 'Extra', mant: 'Dopo la pubblicazione', pedir: 'Chiedi un preventivo', popular: 'Il più scelto' },
    en: { desde: 'from', mes: '/month', iva: 'Prices exclude VAT. Fixed quote before we start.', plazo: 'Timeline', extras: 'Add-ons', mant: 'After launch', pedir: 'Get a quote', popular: 'Most popular' }
  }
};

/* Formato de precio: 1690 → «1.690 €» (es/it), «1 690 €» (fr), «€1,690» (en) */
window.A2WD_precio = function (n, lang) {
  var sep = { es: '.', it: '.', fr: '\u202F', en: ',' }[lang] || '.';
  var txt = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return lang === 'en' ? '€' + txt : txt + '\u00A0€';
};
