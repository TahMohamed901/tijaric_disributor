export const forceReloadFromServer = () => {
  try {
    // Ajouter un paramètre unique pour bypass le cache
    const url = new URL(window.location.href);
    url.searchParams.set('t', Date.now().toString());

    // Redirection vers Vercel avec cache bypass
    window.location.href = url.toString();
  } catch (err) {
    console.error('Erreur reload:', err);
    // fallback simple
    window.location.reload();
  }
};