// =========================================================
// AGRI TG — supabaseClient.js
// Client Supabase global partagé entre les différentes pages
// =========================================================

const SUPABASE_URL = 'https://lzyxqzlfxstdmrnqbadc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_hYWBgCz4GhKA76E1SBHJ7A_3bomXX3Z';

// Initialiser le client Supabase
// (s'assure que le CDN Supabase a bien été chargé au préalable)
if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("Erreur: le script CDN de Supabase n'est pas chargé.");
}
