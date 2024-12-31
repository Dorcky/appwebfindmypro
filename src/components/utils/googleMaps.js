// src/googleMaps.js

export const loadGoogleMapsScript = (callback) => {
  // Vérifier si l'API est déjà chargée
  if (window.google && window.google.maps) {
    // L'API est déjà chargée, on peut appeler le callback immédiatement
    callback();
    return;
  }

  // Récupérer la clé API depuis le fichier .env
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Vérifier si la clé API est définie
  if (!apiKey) {
    console.error("La clé API Google Maps est manquante !");
    return;
  }

  // Ajouter le script de l'API Google Maps à la page, mais seulement si il n'est pas déjà ajouté
  const existingScript = document.querySelector('script[src^="https://maps.googleapis.com/maps/api/js"]');
  if (existingScript) {
    // Le script est déjà présent, mais vérifier que l'API est prête avant de lancer le callback
    if (window.google && window.google.maps) {
      callback();
    }
    return;
  }

  // Créer un nouveau script
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callback.name}`;

  // Ajouter un gestionnaire d'erreur en cas de problème avec le script
  script.onerror = () => {
    console.error("Erreur lors du chargement de l'API Google Maps. Vérifiez votre clé API.");
  };

  // Charger le script de manière optimale
  script.async = true;
  script.defer = true;

  // Ajouter le script au head du document
  document.head.appendChild(script);
};
