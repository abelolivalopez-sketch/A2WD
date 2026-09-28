// =====================================================================
//  Idiomas del portal para clientes: ES · FR · IT · EN
//  Comparte la preferencia con la web principal (localStorage 'a2wd_lang').
//  El panel de creadores se mantiene en español.
// =====================================================================
export const IDIOMAS = ['es', 'fr', 'it', 'en'];
const LOCALES = { es: 'es-ES', fr: 'fr-FR', it: 'it-IT', en: 'en-GB' };

function elegir() {
  const q = new URLSearchParams(location.search).get('lang');
  if (IDIOMAS.includes(q)) { try { localStorage.setItem('a2wd_lang', q); } catch {} return q; }
  try { const g = localStorage.getItem('a2wd_lang'); if (IDIOMAS.includes(g)) return g; } catch {}
  for (const l of navigator.languages || [navigator.language || 'es']) {
    const c = String(l).slice(0, 2).toLowerCase(); if (IDIOMAS.includes(c)) return c;
  }
  return 'es';
}
export const LANG = elegir();
export const LOCALE = LOCALES[LANG];
document.documentElement.lang = LANG;

const T = {
  es: {
    salir: 'Salir', contrasena: 'Contraseña', web: '← Web', web_title: 'Volver a la web de A2WD', mi_proyecto: 'mi proyecto', hola: 'Hola, {n}',
    // login
    area_privada: 'Área privada', accede: 'Accede a tu proyecto', accede_sub: 'Clientes y equipo de A2WD.', correo: 'Correo', contrasena_label: 'Contraseña',
    entrar: 'Entrar', olvidaste: '¿Olvidaste tu contraseña?', volver_web: '← Volver a la web', err_login: 'Correo o contraseña incorrectos.',
    rec_eyebrow: 'Recuperar acceso', rec_titulo: 'Te enviamos un enlace', rec_sub: 'Escribe tu correo y recibirás un enlace para crear una contraseña nueva.',
    enviar_enlace: 'Enviar enlace', volver: '← Volver', bienvenido: 'Bienvenido', crea_pw: 'Crea tu contraseña', nueva_pw_titulo: 'Nueva contraseña',
    pw_sub: 'Mínimo 8 caracteres. La usarás junto a tu correo para entrar.', nueva_pw: 'Nueva contraseña', repite_pw: 'Repítela', guardar_entrar: 'Guardar y entrar',
    no_coinciden: 'Las contraseñas no coinciden.', err_enlace: 'El enlace ha caducado o ya se usó. Pide uno nuevo con "¿Olvidaste tu contraseña?".',
    err_perfil: 'Tu cuenta no tiene perfil en el portal. Contacta con A2WD.', toast_rec: 'Si el correo está registrado, recibirás un enlace en unos minutos.',
    err_guardar_pw: 'No se pudo guardar: {e}',
    // panel cliente
    cargando: 'Cargando…', err_proyectos: 'No se pudieron cargar tus proyectos. Recarga la página.',
    preparando: 'Tu proyecto se está preparando', preparando_sub: 'En cuanto lo demos de alta, aquí verás la web y los avances. Mientras tanto, escríbenos aquí abajo para lo que necesites.',
    estado_proyecto: 'Estado del proyecto', entrega: 'entrega {f}', abrir_web: 'Abrir web ↗',
    vista_previa_de: 'Vista previa de {n}', vista_pronto: 'La vista previa de tu web estará disponible pronto.', avances: 'Avances', ver: 'Ver ↗', sin_avances: 'Aún no hay avances publicados.',
    dudas: 'Dudas y comentarios', dudas_sub: 'Escríbenos lo que quieras cambiar o preguntar.', tu: 'Tú', sin_mensajes: 'Todavía no hay mensajes.',
    escribe_msg: 'Escribe tu mensaje…', enviar: 'Enviar', msg_enviado: 'Mensaje enviado', msg_error: 'No se pudo enviar el mensaje',
    fase_diseno: 'Diseño', fase_desarrollo: 'Desarrollo', fase_revision: 'Revisión', fase_entregado: 'Entregado',
    // contraseña
    cambiar_pw: 'Cambiar contraseña', min8: 'Mínimo 8 caracteres.', cancelar: 'Cancelar', guardar: 'Guardar', pw_ok: 'Contraseña actualizada', cerrar: 'Cerrar',
    // Rodolfo
    rod_sub: 'Asistente virtual de A2WD', rod_hola: '¡Hola! Soy Rodolfo, el asistente virtual de A2WD. Pregúntame sobre tu proyecto o sobre cómo funciona el portal.',
    rod_ph: 'Escribe tu pregunta…', rod_sug: ['¿Cómo va mi web?', '¿Cómo pido un cambio?', '¿Qué significa la fase actual?'],
    rod_pasar: 'Pasar la pregunta al equipo', rod_pasada: '✓ Enviada al equipo. Te responderán en "Dudas y comentarios".', rod_sin_proy: 'No hay proyecto al que enviar la pregunta',
    rod_err_envio: 'No se pudo enviar', rod_error: 'No he podido responder ahora mismo. Inténtalo en un momento.', rod_abrir: 'Abrir el asistente Rodolfo',
    rod_prefijo: '[Pregunta al asistente] ',
  },
  fr: {
    salir: 'Déconnexion', contrasena: 'Mot de passe', web: '← Site', web_title: 'Retour au site d’A2WD', mi_proyecto: 'mon projet', hola: 'Bonjour {n}',
    area_privada: 'Espace privé', accede: 'Accédez à votre projet', accede_sub: 'Clients et équipe d’A2WD.', correo: 'E-mail', contrasena_label: 'Mot de passe',
    entrar: 'Se connecter', olvidaste: 'Mot de passe oublié ?', volver_web: '← Retour au site', err_login: 'E-mail ou mot de passe incorrect.',
    rec_eyebrow: 'Récupérer l’accès', rec_titulo: 'Nous vous envoyons un lien', rec_sub: 'Saisissez votre e-mail et vous recevrez un lien pour créer un nouveau mot de passe.',
    enviar_enlace: 'Envoyer le lien', volver: '← Retour', bienvenido: 'Bienvenue', crea_pw: 'Créez votre mot de passe', nueva_pw_titulo: 'Nouveau mot de passe',
    pw_sub: '8 caractères minimum. Vous l’utiliserez avec votre e-mail pour vous connecter.', nueva_pw: 'Nouveau mot de passe', repite_pw: 'Confirmez-le', guardar_entrar: 'Enregistrer et entrer',
    no_coinciden: 'Les mots de passe ne correspondent pas.', err_enlace: 'Le lien a expiré ou a déjà été utilisé. Demandez-en un nouveau avec « Mot de passe oublié ? ».',
    err_perfil: 'Votre compte n’a pas de profil sur le portail. Contactez A2WD.', toast_rec: 'Si l’e-mail est enregistré, vous recevrez un lien dans quelques minutes.',
    err_guardar_pw: 'Impossible d’enregistrer : {e}',
    cargando: 'Chargement…', err_proyectos: 'Impossible de charger vos projets. Rechargez la page.',
    preparando: 'Votre projet est en préparation', preparando_sub: 'Dès qu’il sera créé, vous verrez ici le site et l’avancement. En attendant, écrivez-nous ci-dessous pour tout ce dont vous avez besoin.',
    estado_proyecto: 'État du projet', entrega: 'livraison {f}', abrir_web: 'Ouvrir le site ↗',
    vista_previa_de: 'Aperçu de {n}', vista_pronto: 'L’aperçu de votre site sera bientôt disponible.', avances: 'Avancement', ver: 'Voir ↗', sin_avances: 'Aucune mise à jour publiée pour le moment.',
    dudas: 'Questions et commentaires', dudas_sub: 'Écrivez-nous ce que vous souhaitez modifier ou demander.', tu: 'Vous', sin_mensajes: 'Pas encore de messages.',
    escribe_msg: 'Écrivez votre message…', enviar: 'Envoyer', msg_enviado: 'Message envoyé', msg_error: 'Impossible d’envoyer le message',
    fase_diseno: 'Design', fase_desarrollo: 'Développement', fase_revision: 'Révision', fase_entregado: 'Livré',
    cambiar_pw: 'Changer le mot de passe', min8: '8 caractères minimum.', cancelar: 'Annuler', guardar: 'Enregistrer', pw_ok: 'Mot de passe mis à jour', cerrar: 'Fermer',
    rod_sub: 'Assistant virtuel d’A2WD', rod_hola: 'Bonjour ! Je suis Rodolfo, l’assistant virtuel d’A2WD. Posez-moi vos questions sur votre projet ou sur le fonctionnement du portail.',
    rod_ph: 'Écrivez votre question…', rod_sug: ['Où en est mon site ?', 'Comment demander une modification ?', 'Que signifie la phase actuelle ?'],
    rod_pasar: 'Transmettre la question à l’équipe', rod_pasada: '✓ Transmise à l’équipe. Réponse dans « Questions et commentaires ».', rod_sin_proy: 'Aucun projet auquel envoyer la question',
    rod_err_envio: 'Envoi impossible', rod_error: 'Je ne peux pas répondre pour le moment. Réessayez dans un instant.', rod_abrir: 'Ouvrir l’assistant Rodolfo',
    rod_prefijo: '[Question à l’assistant] ',
  },
  it: {
    salir: 'Esci', contrasena: 'Password', web: '← Sito', web_title: 'Torna al sito di A2WD', mi_proyecto: 'il mio progetto', hola: 'Ciao {n}',
    area_privada: 'Area riservata', accede: 'Accedi al tuo progetto', accede_sub: 'Clienti e team di A2WD.', correo: 'Email', contrasena_label: 'Password',
    entrar: 'Accedi', olvidaste: 'Password dimenticata?', volver_web: '← Torna al sito', err_login: 'Email o password errate.',
    rec_eyebrow: 'Recupera l’accesso', rec_titulo: 'Ti inviamo un link', rec_sub: 'Scrivi la tua email e riceverai un link per creare una nuova password.',
    enviar_enlace: 'Invia link', volver: '← Indietro', bienvenido: 'Benvenuto', crea_pw: 'Crea la tua password', nueva_pw_titulo: 'Nuova password',
    pw_sub: 'Minimo 8 caratteri. La userai insieme alla tua email per accedere.', nueva_pw: 'Nuova password', repite_pw: 'Ripetila', guardar_entrar: 'Salva ed entra',
    no_coinciden: 'Le password non coincidono.', err_enlace: 'Il link è scaduto o è già stato usato. Richiedine uno nuovo con «Password dimenticata?».',
    err_perfil: 'Il tuo account non ha un profilo nel portale. Contatta A2WD.', toast_rec: 'Se l’email è registrata, riceverai un link tra pochi minuti.',
    err_guardar_pw: 'Impossibile salvare: {e}',
    cargando: 'Caricamento…', err_proyectos: 'Impossibile caricare i tuoi progetti. Ricarica la pagina.',
    preparando: 'Il tuo progetto è in preparazione', preparando_sub: 'Appena lo attiveremo, qui vedrai il sito e gli avanzamenti. Nel frattempo, scrivici qui sotto per qualsiasi cosa.',
    estado_proyecto: 'Stato del progetto', entrega: 'consegna {f}', abrir_web: 'Apri il sito ↗',
    vista_previa_de: 'Anteprima di {n}', vista_pronto: 'L’anteprima del tuo sito sarà disponibile a breve.', avances: 'Avanzamenti', ver: 'Vedi ↗', sin_avances: 'Ancora nessun avanzamento pubblicato.',
    dudas: 'Domande e commenti', dudas_sub: 'Scrivici cosa vuoi cambiare o chiedere.', tu: 'Tu', sin_mensajes: 'Ancora nessun messaggio.',
    escribe_msg: 'Scrivi il tuo messaggio…', enviar: 'Invia', msg_enviado: 'Messaggio inviato', msg_error: 'Impossibile inviare il messaggio',
    fase_diseno: 'Design', fase_desarrollo: 'Sviluppo', fase_revision: 'Revisione', fase_entregado: 'Consegnato',
    cambiar_pw: 'Cambia password', min8: 'Minimo 8 caratteri.', cancelar: 'Annulla', guardar: 'Salva', pw_ok: 'Password aggiornata', cerrar: 'Chiudi',
    rod_sub: 'Assistente virtuale di A2WD', rod_hola: 'Ciao! Sono Rodolfo, l’assistente virtuale di A2WD. Chiedimi del tuo progetto o di come funziona il portale.',
    rod_ph: 'Scrivi la tua domanda…', rod_sug: ['Come va il mio sito?', 'Come chiedo una modifica?', 'Cosa significa la fase attuale?'],
    rod_pasar: 'Passa la domanda al team', rod_pasada: '✓ Inviata al team. Ti risponderanno in «Domande e commenti».', rod_sin_proy: 'Nessun progetto a cui inviare la domanda',
    rod_err_envio: 'Invio non riuscito', rod_error: 'Al momento non riesco a rispondere. Riprova tra poco.', rod_abrir: 'Apri l’assistente Rodolfo',
    rod_prefijo: '[Domanda all’assistente] ',
  },
  en: {
    salir: 'Log out', contrasena: 'Password', web: '← Website', web_title: 'Back to the A2WD website', mi_proyecto: 'my project', hola: 'Hi {n}',
    area_privada: 'Private area', accede: 'Access your project', accede_sub: 'A2WD clients and team.', correo: 'Email', contrasena_label: 'Password',
    entrar: 'Log in', olvidaste: 'Forgot your password?', volver_web: '← Back to the website', err_login: 'Incorrect email or password.',
    rec_eyebrow: 'Recover access', rec_titulo: 'We’ll send you a link', rec_sub: 'Enter your email and you’ll receive a link to create a new password.',
    enviar_enlace: 'Send link', volver: '← Back', bienvenido: 'Welcome', crea_pw: 'Create your password', nueva_pw_titulo: 'New password',
    pw_sub: 'At least 8 characters. You’ll use it with your email to log in.', nueva_pw: 'New password', repite_pw: 'Repeat it', guardar_entrar: 'Save and continue',
    no_coinciden: 'Passwords don’t match.', err_enlace: 'The link has expired or was already used. Request a new one with “Forgot your password?”.',
    err_perfil: 'Your account has no profile in the portal. Please contact A2WD.', toast_rec: 'If the email is registered, you’ll receive a link in a few minutes.',
    err_guardar_pw: 'Couldn’t save: {e}',
    cargando: 'Loading…', err_proyectos: 'Your projects couldn’t be loaded. Please reload the page.',
    preparando: 'Your project is being prepared', preparando_sub: 'As soon as we set it up, you’ll see the website and updates here. In the meantime, message us below for anything you need.',
    estado_proyecto: 'Project status', entrega: 'delivery {f}', abrir_web: 'Open website ↗',
    vista_previa_de: 'Preview of {n}', vista_pronto: 'Your website preview will be available soon.', avances: 'Updates', ver: 'View ↗', sin_avances: 'No updates published yet.',
    dudas: 'Questions and comments', dudas_sub: 'Tell us what you’d like to change or ask.', tu: 'You', sin_mensajes: 'No messages yet.',
    escribe_msg: 'Write your message…', enviar: 'Send', msg_enviado: 'Message sent', msg_error: 'The message couldn’t be sent',
    fase_diseno: 'Design', fase_desarrollo: 'Development', fase_revision: 'Review', fase_entregado: 'Delivered',
    cambiar_pw: 'Change password', min8: 'At least 8 characters.', cancelar: 'Cancel', guardar: 'Save', pw_ok: 'Password updated', cerrar: 'Close',
    rod_sub: 'A2WD’s virtual assistant', rod_hola: 'Hi! I’m Rodolfo, A2WD’s virtual assistant. Ask me about your project or how the portal works.',
    rod_ph: 'Type your question…', rod_sug: ['How is my website going?', 'How do I request a change?', 'What does the current phase mean?'],
    rod_pasar: 'Send the question to the team', rod_pasada: '✓ Sent to the team. They’ll reply in “Questions and comments”.', rod_sin_proy: 'No project to send the question to',
    rod_err_envio: 'Couldn’t send', rod_error: 'I can’t answer right now. Please try again in a moment.', rod_abrir: 'Open the Rodolfo assistant',
    rod_prefijo: '[Question to the assistant] ',
  },
};

export function t(clave, vars = {}) {
  const v = (T[LANG] && T[LANG][clave]) ?? T.es[clave] ?? clave;
  if (Array.isArray(v)) return v;
  return String(v).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

// Selector ES · FR · IT · EN (recarga la página en el idioma elegido)
export function selectorIdioma(destino) {
  if (!destino) return;
  destino.classList.add('lang-switch');
  destino.setAttribute('role', 'group');
  destino.setAttribute('aria-label', 'Idioma / Langue / Lingua / Language');
  destino.innerHTML = IDIOMAS.map((l) => `<button type="button" data-lang="${l}" class="${l === LANG ? 'on' : ''}" aria-pressed="${l === LANG}">${l.toUpperCase()}</button>`).join('');
  destino.querySelectorAll('button').forEach((b) => (b.onclick = () => {
    try { localStorage.setItem('a2wd_lang', b.dataset.lang); } catch {}
    const u = new URL(location.href); u.searchParams.delete('lang'); location.replace(u.pathname + u.search + u.hash);
  }));
}
