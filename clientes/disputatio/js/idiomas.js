const CLAVE_IDIOMA = "disputatio-idioma";
const DISPONIBLES = ["fr", "en"];

const TEXTOS = {
  fr: {
    tituloSitio: "Disputatio",
    tituloCreacion: "Disputatio, espace de création",
    cafePhilo: "Café philo",
    cerrar: "Fermer",
    cantidad: (numero) => `${numero} disputatio`,
    etiquetaCiudad: (ciudad, numero) => `${ciudad}, ${numero} disputatio`,
    entrada: "Chaque point marque un disputatio. Sélectionnez-en un pour découvrir ce qui s'y est passé.",
    entradaLista: "Choisissez un disputatio pour découvrir ce qui s'y est passé.",
    escena: "Globe des disputatio",
    redes: "Réseaux sociaux",
    idioma: "Langue",
    anterior: "Précédent",
    siguiente: "Suivant",
    otras: "Autres disputatio",
    enlaces: "Liens",
    volverGlobo: "Retour au globe",
    noEncontrada: "Ce disputatio n'existe pas ou n'est plus publié.",
    tituloPagina: (titulo) => `${titulo}, Disputatio`,
    coordenadasGrados: (lat, lng) => `${gradosMinutos(lat)} ${lat >= 0 ? "N" : "S"}, ${gradosMinutos(lng)} ${lng >= 0 ? "E" : "O"}`,
    espacioCreacion: "Espace de création",
    verGlobo: "Voir le globe",
    vuestras: "Vos disputatio",
    demo: "Mode démo : ce que vous créez ici est enregistré uniquement dans ce navigateur.",
    anadir: "Ajouter un disputatio",
    vacio: "Aucun disputatio pour l'instant. Ajoutez le premier en plaçant un point sur le globe.",
    ejemplo: "Exemple",
    borrador: "Brouillon",
    exportar: "Exporter (JSON)",
    reiniciar: "Réinitialiser la démo",
    confirmarReinicio: "Effacer tout ce qui a été créé dans ce navigateur ?",
    siReiniciar: "Effacer",
    noReiniciar: "Garder",
    paso1: "Placer le point",
    paso2: "Écrire le disputatio",
    nueva: "Nouveau disputatio",
    editarTitulo: "Modifier le disputatio",
    colocarAyuda: "Cliquez ou touchez le globe à l'endroit où s'est tenu le disputatio. Vous pourrez déplacer le point ensuite.",
    sinPunto: "Aucun point placé.",
    coordenadas: (lat, lng) => `${grados(lat, "fr")} ${lat >= 0 ? "N" : "S"}, ${grados(lng, "fr")} ${lng >= 0 ? "E" : "O"}`,
    continuar: "Continuer",
    cancelar: "Annuler",
    moverPunto: "Déplacer le point",
    modoEditar: "Rédaction",
    modoPrevia: "Aperçu",
    modos: "Mode d'affichage",
    idiomaTexto: "Langue du texte",
    campoTitulo: "Titre",
    campoParticipantes: "Intervenants (facultatif)",
    ayudaParticipantes: "Tel qu'il apparaîtra sous le titre. Ex. : Avec Julien d'Huy, docteur en histoire.",
    campoCiudad: "Ville",
    campoPais: "Pays",
    campoFecha: "Date",
    campoImagen: "Image (facultative)",
    elegirImagen: "Choisir une image",
    cambiarImagen: "Changer d'image",
    quitarImagen: "Retirer l'image",
    campoImagenDescripcion: "Description de l'image",
    ayudaImagenDescripcion: "Pour les personnes qui ne voient pas l'image.",
    campoTexto: "Texte",
    ayudaTexto: "Laissez une ligne vide entre les paragraphes. Pour un lien dans le texte : [texte](https://…).",
    insertarEnlace: "Insérer un lien",
    textoEnlace: "texte du lien",
    ayudaEnlaces: "Vidéo, article de presse, inscription…",
    anadirEnlace: "Ajouter un lien",
    enlaceTexto: "Texte affiché",
    enlaceUrl: "Adresse (https://…)",
    quitarEnlace: "Retirer ce lien",
    publicar: "Publier",
    guardarBorrador: "Enregistrer en brouillon",
    borrar: "Supprimer ce disputatio",
    confirmarBorrado: "Supprimer ce disputatio ? Il disparaîtra du globe.",
    siBorrar: "Supprimer",
    noBorrar: "Garder",
    avisoPublicada: "Disputatio publié",
    avisoBorrador: "Brouillon enregistré",
    avisoBorrada: "Disputatio supprimé",
    avisoReinicio: "Démo réinitialisée",
    verPublicacion: "Voir la publication",
    errorTitulo: "Indiquez un titre.",
    errorCiudad: "Indiquez la ville.",
    errorPais: "Indiquez le pays.",
    errorFecha: "Choisissez la date.",
    errorTexto: "Écrivez le texte du disputatio.",
    errorEnlaceTexto: "Ajoutez le texte affiché pour ce lien.",
    errorEnlaceEnTexto: "Un lien du texte n'a pas d'adresse complète : remplacez https:// par l'adresse du lien.",
    errorEnlaceUrl: "Cette adresse doit commencer par https://",
    errorImagen: "Ce fichier n'est pas une image. Choisissez un JPG, un PNG ou un WebP.",
    errorEspacio: "Ce navigateur n'a plus de place pour la démo. Retirez l'image ou choisissez-en une plus légère.",
    errorFormulario: "Certains champs sont à compléter.",
    sin3d: "Ce navigateur ne peut pas afficher le globe. Ouvrez cette page dans une version récente de Chrome, Firefox, Safari ou Edge."
  },
  en: {
    tituloSitio: "Disputatio",
    tituloCreacion: "Disputatio, creation space",
    cafePhilo: "Philosophy café",
    cerrar: "Close",
    cantidad: (numero) => `${numero} disputatio${numero > 1 ? "s" : ""}`,
    etiquetaCiudad: (ciudad, numero) => `${ciudad}, ${numero} disputatio${numero > 1 ? "s" : ""}`,
    entrada: "Each point marks a disputatio. Select one to see what happened there.",
    entradaLista: "Choose a disputatio to see what happened there.",
    escena: "Globe of disputatios",
    redes: "Social media",
    idioma: "Language",
    anterior: "Previous",
    siguiente: "Next",
    otras: "Other disputatios",
    enlaces: "Links",
    volverGlobo: "Back to the globe",
    noEncontrada: "This disputatio doesn't exist or is no longer published.",
    tituloPagina: (titulo) => `${titulo}, Disputatio`,
    coordenadasGrados: (lat, lng) => `${gradosMinutos(lat)} ${lat >= 0 ? "N" : "S"}, ${gradosMinutos(lng)} ${lng >= 0 ? "E" : "W"}`,
    espacioCreacion: "Creation space",
    verGlobo: "View the globe",
    vuestras: "Your disputatios",
    demo: "Demo mode: what you create here is saved in this browser only.",
    anadir: "Add a disputatio",
    vacio: "No disputatios yet. Add the first one by placing a point on the globe.",
    ejemplo: "Example",
    borrador: "Draft",
    exportar: "Export (JSON)",
    reiniciar: "Reset the demo",
    confirmarReinicio: "Erase everything created in this browser?",
    siReiniciar: "Erase",
    noReiniciar: "Keep",
    paso1: "Place the point",
    paso2: "Write the disputatio",
    nueva: "New disputatio",
    editarTitulo: "Edit the disputatio",
    colocarAyuda: "Click or tap the globe where the disputatio took place. You can move the point afterwards.",
    sinPunto: "No point placed yet.",
    coordenadas: (lat, lng) => `${grados(lat, "en")} ${lat >= 0 ? "N" : "S"}, ${grados(lng, "en")} ${lng >= 0 ? "E" : "W"}`,
    continuar: "Continue",
    cancelar: "Cancel",
    moverPunto: "Move the point",
    modoEditar: "Writing",
    modoPrevia: "Preview",
    modos: "View mode",
    idiomaTexto: "Text language",
    campoTitulo: "Title",
    campoParticipantes: "Speakers (optional)",
    ayudaParticipantes: "As it will appear under the title. E.g.: With Julien d'Huy, historian.",
    campoCiudad: "City",
    campoPais: "Country",
    campoFecha: "Date",
    campoImagen: "Image (optional)",
    elegirImagen: "Choose an image",
    cambiarImagen: "Change image",
    quitarImagen: "Remove image",
    campoImagenDescripcion: "Image description",
    ayudaImagenDescripcion: "For people who can't see the image.",
    campoTexto: "Text",
    ayudaTexto: "Leave a blank line between paragraphs. For a link in the text: [text](https://…).",
    insertarEnlace: "Insert a link",
    textoEnlace: "link text",
    ayudaEnlaces: "Video, press article, sign-up…",
    anadirEnlace: "Add a link",
    enlaceTexto: "Link text",
    enlaceUrl: "Address (https://…)",
    quitarEnlace: "Remove this link",
    publicar: "Publish",
    guardarBorrador: "Save as draft",
    borrar: "Delete this disputatio",
    confirmarBorrado: "Delete this disputatio? It will disappear from the globe.",
    siBorrar: "Delete",
    noBorrar: "Keep",
    avisoPublicada: "Disputatio published",
    avisoBorrador: "Draft saved",
    avisoBorrada: "Disputatio deleted",
    avisoReinicio: "Demo reset",
    verPublicacion: "View the publication",
    errorTitulo: "Add a title.",
    errorCiudad: "Add the city.",
    errorPais: "Add the country.",
    errorFecha: "Choose the date.",
    errorTexto: "Write the text of the disputatio.",
    errorEnlaceTexto: "Add the text shown for this link.",
    errorEnlaceEnTexto: "A link in the text has no full address: replace https:// with the link's address.",
    errorEnlaceUrl: "This address must start with https://",
    errorImagen: "This file isn't an image. Choose a JPG, PNG or WebP.",
    errorEspacio: "This browser has no room left for the demo. Remove the image or choose a lighter one.",
    errorFormulario: "Some fields need completing.",
    sin3d: "This browser can't show the globe. Open this page in a recent version of Chrome, Firefox, Safari or Edge."
  }
};

let actual = idiomaInicial();

function grados(valor, codigo) {
  return `${new Intl.NumberFormat(codigo, { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(Math.abs(valor))}°`;
}

function gradosMinutos(valor) {
  const minutosTotales = Math.round(Math.abs(valor) * 60);
  return `${Math.floor(minutosTotales / 60)}° ${String(minutosTotales % 60).padStart(2, "0")}′`;
}

function leerGuardado() {
  try {
    return window.localStorage.getItem(CLAVE_IDIOMA);
  } catch {
    return null;
  }
}

function guardar(codigo) {
  try {
    window.localStorage.setItem(CLAVE_IDIOMA, codigo);
  } catch {
    return;
  }
}

function idiomaInicial() {
  const guardado = leerGuardado();
  if (DISPONIBLES.includes(guardado)) return guardado;
  const preferidos = (navigator.languages || [navigator.language || ""]).map((codigo) => codigo.slice(0, 2).toLowerCase());
  return preferidos.find((codigo) => DISPONIBLES.includes(codigo)) || "en";
}

export function idioma() {
  return actual;
}

export function t(clave, ...datos) {
  const valor = TEXTOS[actual][clave] ?? TEXTOS.fr[clave] ?? clave;
  return typeof valor === "function" ? valor(...datos) : valor;
}

export function formatearFecha(texto) {
  const [anio, mes, dia] = String(texto).split("-").map(Number);
  if (!anio || !mes || !dia) return "";
  return new Intl.DateTimeFormat(actual, { day: "numeric", month: "long", year: "numeric" }).format(new Date(anio, mes - 1, dia));
}

export function aplicarTextos(raiz = document) {
  document.documentElement.lang = actual;
  raiz.querySelectorAll("[data-t]").forEach((elemento) => {
    elemento.textContent = t(elemento.dataset.t);
  });
  raiz.querySelectorAll("[data-t-aria]").forEach((elemento) => {
    elemento.setAttribute("aria-label", t(elemento.dataset.tAria));
  });
  raiz.querySelectorAll("[data-t-placeholder]").forEach((elemento) => {
    elemento.placeholder = t(elemento.dataset.tPlaceholder);
  });
  document.querySelectorAll("[data-idioma]").forEach((boton) => {
    boton.setAttribute("aria-pressed", String(boton.dataset.idioma === actual));
  });
}

export function cambiarIdioma(codigo) {
  if (!DISPONIBLES.includes(codigo) || codigo === actual) return;
  actual = codigo;
  guardar(codigo);
  aplicarTextos();
  document.dispatchEvent(new CustomEvent("cambio-idioma"));
}

export function conectarSelectorIdioma() {
  document.querySelectorAll("[data-idioma]").forEach((boton) => {
    boton.addEventListener("click", () => cambiarIdioma(boton.dataset.idioma));
  });
}
