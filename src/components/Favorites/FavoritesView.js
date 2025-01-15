import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faSearch, faTrash, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import './FavoritesView.css';

const FavoritesView = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceProviders, setServiceProviders] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [reviews, setReviews] = useState({}); // Pour stocker les avis et les moyennes
  const navigate = useNavigate();

  // Fonction pour charger les avis et calculer la moyenne
  const fetchReviews = async (providerId) => {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('service_provider_id', '==', providerId)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = reviewsData.length > 0 ? totalRating / reviewsData.length : 0;

      setReviews((prevReviews) => ({
        ...prevReviews,
        [providerId]: { reviews: reviewsData, averageRating },
      }));
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  // Charger les favoris et les prestataires associés
  useEffect(() => {
    const fetchFavorites = async () => {
      const user = auth.currentUser;

      if (user) {
        try {
          // Récupérer les favoris de l'utilisateur
          const favoritesRef = collection(db, 'favorites');
          const q = query(favoritesRef, where('user_id', '==', user.uid));
          const querySnapshot = await getDocs(q);

          const favoritesList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          setFavorites(favoritesList);

          // Récupérer les IDs des prestataires favoris
          const serviceProviderIds = [...new Set(favoritesList
            .map(favorite => favorite.service_provider_id)
            .filter(Boolean))];

          // Charger les prestataires et leurs avis
          if (serviceProviderIds.length > 0) {
            await fetchServiceProviders(serviceProviderIds);
            serviceProviderIds.forEach((id) => fetchReviews(id));
          }

        } catch (error) {
          console.error("Error fetching favorites:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  // Charger les prestataires de service
  const fetchServiceProviders = async (serviceProviderIds) => {
    try {
      const providersRef = collection(db, 'service_providers');
      const providers = {};

      for (const id of serviceProviderIds) {
        const providerSnap = await getDocs(query(collection(db, 'service_providers'), where('__name__', '==', id)));

        if (!providerSnap.empty) {
          const providerData = providerSnap.docs[0].data();
          providers[id] = {
            id,
            ...providerData
          };
        }
      }

      setServiceProviders(providers);
    } catch (error) {
      console.error("Error fetching service providers:", error);
    }
  };

  // Supprimer un favori
  const handleDeleteFavorite = async (favoriteId) => {
    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error("Error deleting favorite:", error);
    }
  };

  // Supprimer tous les favoris
  const handleDeleteAllFavorites = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const deletionPromises = favorites
          .filter(favorite => favorite.user_id === user.uid)
          .map(favorite => deleteDoc(doc(db, 'favorites', favorite.id)));

        await Promise.all(deletionPromises);
        setFavorites([]);
      } catch (error) {
        console.error("Error deleting all favorites:", error);
      }
    }
  };

  // Filtrer les favoris en fonction de la recherche
  const filteredFavorites = favorites.filter(favorite => {
    const provider = serviceProviders[favorite.service_provider_id];
    if (!provider) return false;

    return (
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return <div className="loading-message">Chargement des favoris...</div>;
  }

  return (
    <div className="min-h-screen bg-[#D9E7F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-[#334C66] text-center mb-12 mt-20" >Mes Prestataires Favoris</h1>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-8">
          <div className="relative w-full sm:w-2/3 mb-4 sm:mb-0">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 rounded-full border border-[#A0C3E8] focus:outline-none focus:ring-2 focus:ring-[#A0C3E8]"
              placeholder="Rechercher un prestataire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-[#A0C3E8]" />
          </div>
          <button
            className="w-full sm:w-auto px-6 py-3 bg-[#669BC2] text-white rounded-full hover:bg-[#5A8DA0] transition duration-300 ease-in-out flex items-center justify-center"
            onClick={handleDeleteAllFavorites}
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Supprimer tous les favoris
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map(favorite => {
            const provider = serviceProviders[favorite.service_provider_id];
            if (!provider) return null;

            const averageRating = reviews[provider.id]?.averageRating || 0;

            return (
              <div key={favorite.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform transition duration-500 hover:scale-105">
                <div className="p-6">
                  <img
                    src={provider.profileImageURL || 'https://via.placeholder.com/100'}
                    alt={provider.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-[#A0C3E8]"
                  />
                  <h2 className="text-2xl font-semibold text-[#334C66] mb-2 text-center">{provider.name}</h2>
                  <p className="text-[#808080] mb-4 text-center">{provider.serviceType}</p>
                  <div className="flex items-center justify-center mb-4">
                    <span className="text-yellow-500 mr-1">{averageRating.toFixed(1)}</span>
                    <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="flex-1 px-4 py-2 bg-[#669BC2] text-white rounded-xl hover:bg-[#5A8DA0] transition duration-300 ease-in-out flex items-center justify-center"
                      onClick={() => navigate(`/service-provider-availability/${provider.id}`)}
                    >
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                      Réserver
                    </button>
                    <button
                      className="flex-1 px-4 py-2 bg-red-100 text-red-500 rounded-xl hover:bg-red-200 transition duration-300 ease-in-out"
                      onClick={() => handleDeleteFavorite(favorite.id)}
                    >
                      Retirer des favoris
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FavoritesView;
