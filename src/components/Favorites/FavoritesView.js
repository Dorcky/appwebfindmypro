import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import './FavoritesView.css';

const FavoritesView = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceProviders, setServiceProviders] = useState({});  // Changed to an object for better lookup

  useEffect(() => {
    const fetchFavorites = async () => {
      const user = auth.currentUser;

      if (user) {
        try {
          // Fetch favorites
          const favoritesRef = collection(db, 'favorites');
          const q = query(favoritesRef, where('user_id', '==', user.uid));
          const querySnapshot = await getDocs(q);

          const favoritesList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          setFavorites(favoritesList);

          // Get unique service provider IDs
          const serviceProviderIds = [...new Set(favoritesList
            .map(favorite => favorite.service_provider_id)
            .filter(Boolean))];
          
          if (serviceProviderIds.length > 0) {
            await fetchServiceProviders(serviceProviderIds);
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

  const fetchServiceProviders = async (serviceProviderIds) => {
    try {
      const providersRef = collection(db, 'service_providers');
      const providers = {};

      // Fetch each service provider individually since we need to match document IDs
      for (const id of serviceProviderIds) {
        const providerDoc = doc(db, 'service_providers', id);
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

  const handleDeleteFavorite = async (favoriteId) => {
    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error("Error deleting favorite:", error);
    }
  };

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

  if (loading) {
    return <div className="favorites-container">Chargement des favoris...</div>;
  }

  return (
    <div className="favorites-container" style={{ paddingTop: '80px' }}> {/* Ajout de padding-top pour éviter que le contenu soit masqué par la navbar */}
      <h1>Mes Favoris</h1>
      
      {favorites.length === 0 ? (
        <p>Aucun favori trouvé.</p>
      ) : (
        <div>
          <button className="delete-all-button" onClick={handleDeleteAllFavorites}>
            Supprimer tous les favoris
          </button>
          <ul className="favorites-list">
            {favorites.map(favorite => {
              const serviceProvider = serviceProviders[favorite.service_provider_id];

              if (!serviceProvider) {
                return null;
              }

              return (
                <li key={favorite.id} className="favorite-item">
                  <div className="favorite-provider-info">
                    <img 
                      src={serviceProvider.profileImageURL || 'https://via.placeholder.com/100'} 
                      alt={serviceProvider.name} 
                      className="provider-profile-image" 
                    />
                    
                    <div>
                      <p><strong>{serviceProvider.name}</strong></p>
                      <p>{serviceProvider.serviceType}</p>
                    </div>
                  </div>
                  <button
                    className="delete-favorite-button"
                    onClick={() => handleDeleteFavorite(favorite.id)}
                  >
                    Supprimer
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FavoritesView;