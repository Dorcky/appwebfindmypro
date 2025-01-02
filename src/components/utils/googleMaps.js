export const loadGoogleMapsScript = (callback) => {
  console.log("Début du chargement de l'API Google Maps...");

  if (window.google && window.google.maps) {
    console.log("L'API Google Maps est déjà chargée.");
    callback();
    return;
  }

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("La clé API Google Maps est manquante !");
    return;
  }

  const existingScript = document.querySelector('script[src^="https://maps.googleapis.com/maps/api/js"]');
  if (existingScript) {
    console.log("Le script Google Maps est déjà présent dans le DOM.");
    if (window.google && window.google.maps) {
      callback();
    }
    return;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.onerror = () => {
    console.error("Erreur lors du chargement de l'API Google Maps. Vérifiez votre clé API.");
  };
  script.async = true;
  script.defer = true;

  script.onload = () => {
    console.log("L'API Google Maps a été chargée avec succès.");
    callback();
  };

  document.head.appendChild(script);
};