/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import './SearchProviderView.css';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserProfile(user.uid);
      }
    });

    fetchServiceProviders();
    fetchFavorites();
    getUserLocation();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [searchText]);

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

        // Handle different formats of gpsLocation
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
      }).filter((provider) => provider !== null); // Filter out providers with missing data

      setServiceProviders(providers);
      setFilteredServiceProviders(providers);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error fetching service providers:', error);
    }
  };

  const fetchFavorites = async () => {
    if (!currentUser) {
      setFavoriteProviderIds(new Set());
      return;
    }

    try {
      const q = query(collection(db, 'favorites'), where('user_id', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const favoriteIds = querySnapshot.docs.map((doc) => doc.data().service_provider_id);
      setFavoriteProviderIds(new Set(favoriteIds));
    } catch (error) {
      console.error('Error fetching favorites:', error);
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
        // Si le favori existe, le supprimer
        await deleteDoc(querySnapshot.docs[0].ref);
        setFavoriteProviderIds((prev) => new Set([...prev].filter((id) => id !== providerId)));
      } else {
        // Si le favori n'existe pas, l'ajouter
        await addDoc(favoritesRef, { service_provider_id: providerId, user_id: currentUser.uid });
        setFavoriteProviderIds((prev) => new Set([...prev, providerId]));
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

  return (
    <div className="search-provider-view">
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Rechercher un prestataire"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="loading-message">Chargement...</div>
      ) : filteredServiceProviders.length === 0 ? (
        <div className="no-results">Aucun prestataire trouvé ou un prestataire a été ignoré à cause de coordonnées GPS manquantes.</div>
      ) : (
        <>
          <div className="provider-list">
            {filteredServiceProviders.map((provider) => (
              <div key={provider.id} className="provider-item">
                <Link to={`/provider/${provider.id}`} className="provider-link">
                  <h3>{provider.name}</h3>
                  <p>{provider.serviceType}</p>
                  {userLocation && (
                    <p>Distance: {calculateDistance(
                      userLocation[0], userLocation[1],
                      provider.gpsLocation.latitude, provider.gpsLocation.longitude
                    ).toFixed(2)} km</p>
                  )}
                </Link>
                <button onClick={() => toggleFavoriteStatus(provider.id)} className="favorite-btn">
                  {isFavorite(provider.id) ? 'Enlever des favoris' : 'Ajouter aux favoris'}
                </button>
              </div>
            ))}
          </div>

          <MapContainer center={center} zoom={13} style={{ height: '400px', width: '100%' }}>
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
        </>
      )}
    </div>
  );
};

export default SearchProviderView;
