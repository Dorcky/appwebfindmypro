import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link, useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { Search, Star, StarHalf, MapPin, List, Map, Heart } from "lucide-react";
import './SearchProviderView.css';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';

const RatingStars = ({ rating }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<StarHalf key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    } else {
      stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
    }
  }
  return <div className="flex gap-1">{stars}</div>;
};
RatingStars.propTypes = {
  rating: PropTypes.number.isRequired,
};

const SearchProviderView = () => {
  const [searchText, setSearchText] = useState('');
  const [center, setCenter] = useState([45.5017, -73.5673]); // Default to Montréal
  const [serviceProviders, setServiceProviders] = useState([]);
  const [filteredServiceProviders, setFilteredServiceProviders] = useState([]);
  const [favoriteProviderIds, setFavoriteProviderIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userProfileImageURL, setUserProfileImageURL] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [reviews, setReviews] = useState({}); // Store reviews for each provider
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserProfile(user.uid);
      }
    });

    fetchServiceProviders();
    getUserLocation();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setFavoriteProviderIds(new Set());
      return;
    }

    // Créer une requête pour les favoris de l'utilisateur courant
    const q = query(
      collection(db, 'favorites'),
      where('user_id', '==', currentUser.uid)
    );

    // Mettre en place le listener temps réel
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const favoriteIds = snapshot.docs.map(doc => doc.data().service_provider_id);
      setFavoriteProviderIds(new Set(favoriteIds));
    }, (error) => {
      console.error("Erreur lors de l'écoute des favoris:", error);
    });

    // Nettoyer le listener quand le composant est démonté ou que l'utilisateur change
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    filterProviders();
  }, [searchText]);

  useEffect(() => {
    if (filteredServiceProviders.length > 0) {
      filteredServiceProviders.forEach((provider) => {
        fetchReviews(provider.id);  // Charger les avis à chaque fois que les fournisseurs sont filtrés
      });
    }
  }, [filteredServiceProviders]);

  const fetchUserProfile = async (userId) => {
    try {
      const userDocRef = doc(db, 'normal_users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUserProfileImageURL(userDocSnap.data().profileImageURL || 'https://via.placeholder.com/40');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setCenter([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    } else {
      console.log('Geolocation is not available in your browser.');
    }
  };

  const fetchServiceProviders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'service_providers'));
      const providers = querySnapshot.docs.map((doc) => {
        const data = doc.data();

        let gpsLocation = null;
        if (data.gpsLocation) {
          if (Array.isArray(data.gpsLocation) && data.gpsLocation.length === 2) {
            gpsLocation = {
              latitude: data.gpsLocation[0],
              longitude: data.gpsLocation[1],
            };
          } else if (typeof data.gpsLocation.latitude === 'number' && typeof data.gpsLocation.longitude === 'number') {
            gpsLocation = {
              latitude: data.gpsLocation.latitude,
              longitude: data.gpsLocation.longitude,
            };
          }
        }

        if (gpsLocation) {
          return {
            ...data,
            gpsLocation,
            id: doc.id,
            profileImageURL: data.profileImageURL || 'https://via.placeholder.com/40',
          };
        } else {
          console.warn(`Prestataire ${doc.id} ignoré à cause de coordonnées GPS manquantes`);
          return null;
        }
      }).filter((provider) => provider !== null);

      setServiceProviders(providers);
      setFilteredServiceProviders(providers);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error fetching service providers:', error);
    }
  };

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

  const filterProviders = () => {
    if (searchText.trim() === '') {
      setFilteredServiceProviders(serviceProviders);
    } else {
      const filtered = serviceProviders.filter((provider) =>
        provider.name.toLowerCase().includes(searchText.toLowerCase()) ||
        provider.serviceType.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredServiceProviders(filtered);
    }
  };

  const isFavorite = (providerId) => favoriteProviderIds.has(providerId);

  const toggleFavoriteStatus = async (providerId) => {
    if (!currentUser) {
      return;
    }

    try {
      const favoritesRef = collection(db, 'favorites');
      const q = query(
        favoritesRef,
        where('user_id', '==', currentUser.uid),
        where('service_provider_id', '==', providerId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Si le provider est déjà dans les favoris, le retirer
        await deleteDoc(querySnapshot.docs[0].ref);
        setFavoriteProviderIds((prev) => {
          const newFavorites = new Set(prev);
          newFavorites.delete(providerId);
          return newFavorites;
        });
      } else {
        // Sinon, l'ajouter aux favoris
        await addDoc(favoritesRef, { service_provider_id: providerId, user_id: currentUser.uid });
        setFavoriteProviderIds((prev) => new Set(prev).add(providerId));
      }
    } catch (error) {
      console.error('Error toggling favorite status:', error);
    }
  };

  const createCustomIcon = (profileImageURL) =>
    L.divIcon({
      html: `<div class="custom-marker-icon" style="background-image: url('${profileImageURL || 'https://via.placeholder.com/40'}'); background-size: cover;"></div>`,
      className: 'leaflet-div-icon custom-marker',
      iconSize: [40, 40],
    });

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const MapUpdater = () => {
    const map = useMap();
    useEffect(() => {
      if (userLocation) {
        map.setView(userLocation, 13);
      }
    }, [userLocation, map]);
    return null;
  };

  const handleProviderClick = (providerId) => {
    navigate(`/provider/${providerId}`);
  };

  return (
    <div className="min-h-screen pt-12 bg-gradient-to-b from-[rgb(217,237,247)] to-[rgb(235,245,250)]">
      <header className="bg-gradient-to-r from-[rgb(51,77,102)] to-[rgb(71,97,122)] text-white py-12 text-center shadow-lg">
        <h1 className="text-4xl font-bold tracking-wide">FindMyPro</h1>
        <p className="mt-2 text-lg text-[rgb(217,237,247)]">Découvrez nos prestataires de qualité</p>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row gap-2 bg-white rounded-xl shadow-lg p-2 mb-8 transition-all duration-300 hover:shadow-xl">
          <input
            type="text"
            placeholder="Rechercher un prestataire..."
            className="flex-1 px-6 py-3 text-lg outline-none"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button
            className="bg-[rgb(102,148,191)] hover:bg-[rgb(82,128,171)] text-white rounded-xl px-8 py-3 flex items-center transition-all duration-300 hover:shadow-md"
          >
            <Search className="w-5 h-5 mr-2" />
            Rechercher
          </button>
        </div>

        <div className="flex justify-center mb-8">
          <button
            className={`px-4 py-2 rounded-l-full ${viewMode === 'list' ? 'bg-[rgb(102,148,191)] text-white' : 'bg-white text-[rgb(102,148,191)]'}`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-5 h-5 inline-block mr-2" />
            Liste
          </button>
          <button
            className={`px-4 py-2 rounded-r-full ${viewMode === 'map' ? 'bg-[rgb(102,148,191)] text-white' : 'bg-white text-[rgb(102,148,191)]'}`}
            onClick={() => setViewMode('map')}
          >
            <Map className="w-5 h-5 inline-block mr-2" />
            Carte
          </button>
        </div>

        {isLoading ? (
          <div className="loading-message">Chargement...</div>
        ) : filteredServiceProviders.length === 0 ? (
          <div className="no-results">Aucun prestataire trouvé ou un prestataire a été ignoré à cause de coordonnées GPS manquantes.</div>
        ) : viewMode === 'list' ? (
          <div className="space-y-8">
            {filteredServiceProviders.map((provider) => (
              <div
                key={provider.id}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex flex-col md:flex-row items-center">
                  <img
                    src={provider.profileImageURL}
                    alt={provider.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-[rgb(51,77,102)] mr-8 shadow-md"
                  />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[rgb(51,77,102)] mb-2">
                      {provider.name}
                    </h2>
                    <p className="text-gray-600 mb-4 text-lg">{provider.serviceType}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      {provider.address}
                      {userLocation && (
                        <span className="ml-2">
                          {calculateDistance(
                            userLocation[0], userLocation[1],
                            provider.gpsLocation.latitude, provider.gpsLocation.longitude
                          ).toFixed(2)} km
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center">
                      <div className="flex items-center mb-4 md:mb-0">
                        <RatingStars rating={reviews[provider.id]?.averageRating || 0} />
                        <span className="ml-2 text-gray-600">({reviews[provider.id]?.averageRating?.toFixed(1) || 0})</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          className="bg-[rgb(102,148,191)] hover:bg-[rgb(82,128,171)] text-white rounded-xl px-8 py-3 transition-all duration-300 hover:shadow-md text-sm font-semibold"
                          onClick={() => handleProviderClick(provider.id)}
                        >
                          Voir Profil
                        </button>
                        <button
                          onClick={() => toggleFavoriteStatus(provider.id)}
                          className={`text-2xl ${isFavorite(provider.id) ? 'text-red-500' : 'text-gray-400'} transition-all duration-300 hover:text-red-600`}
                        >
                          <Heart />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <MapContainer center={center} zoom={13} style={{ height: '600px', width: '100%' }}>
            <MapUpdater />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {userLocation && (
              <Marker position={userLocation} icon={createCustomIcon(userProfileImageURL)}>
                <Popup>Vous êtes ici</Popup>
              </Marker>
            )}
            {filteredServiceProviders.map((provider) => (
              <Marker
                key={provider.id}
                position={[provider.gpsLocation.latitude, provider.gpsLocation.longitude]}
                icon={createCustomIcon(provider.profileImageURL)}
                eventHandlers={{
                  click: () => handleProviderClick(provider.id),
                }}
              >
                <Popup>
                  <strong>{provider.name}</strong>
                  <br />
                  {provider.serviceType}
                  <br />
                  <img src={provider.profileImageURL || 'https://via.placeholder.com/100'} alt={provider.name} className="rounded-image" />
                  {userLocation && (
                    <p>Distance: {calculateDistance(
                      userLocation[0], userLocation[1],
                      provider.gpsLocation.latitude, provider.gpsLocation.longitude
                    ).toFixed(2)} km</p>
                  )}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </main>
    </div>
  );
};

export default SearchProviderView;