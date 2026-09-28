// =====================================================================
//  Configuración de Supabase
//  Supabase → Project Settings → API (o botón "Connect")
//  Estas dos claves son PÚBLICAS y pueden ir en la web.
//  NUNCA pongas aquí la clave "service_role" / "secret".
// =====================================================================
export const SUPABASE_URL = 'https://vsqxcxmsvsektvsceqpx.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_W0nqmsiA9O9H3mgBxpQlNQ_UBlMH_kk';

// Clave pública para las notificaciones en el móvil (Web Push).
// La privada está guardada solo en Supabase (privado.ajustes).
export const VAPID_PUBLIC_KEY = 'BNfJy3T-J99H0CkuX5y3eQgw4D4B3jY6RH0rxUl5kjADLAQua0njZHEC7AspaqxaGbOlmIHRBkOZUUlXjS5svI4';
