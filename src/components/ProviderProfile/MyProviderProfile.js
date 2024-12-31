import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './MyProviderProfile.css';

const MyProviderProfile = () => {
  const [profile, setProfile] = useState({
    address: '',
    description: '',
    email: '',
    gpsLocation: null,
    hourlyRate: '',
    isAvailable: false,
    name: '',
    phoneNumber: '',
    profileImageURL: '',
    serviceType: '',
    website: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    fetchProfileData();
    loadGoogleMapsScript();
  }, []);

  const loadGoogleMapsScript = () => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    
    script.onload = initAutocomplete;
  };

  const initAutocomplete = () => {
    const input = document.getElementById('address-input');
    if (!input) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['address'],
      componentRestrictions: { country: 'CA' }
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      setProfile(prev => ({
        ...prev,
        address: place.formatted_address,
        gpsLocation: [
          place.geometry.location.lat(),
          place.geometry.location.lng()
        ]
      }));
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      // Use the place data for the selected address
      setProfile(prev => ({
        ...prev,
        address: place.formatted_address,
        gpsLocation: [
          place.geometry.location.lat(),
          place.geometry.location.lng()
        ]
      }));
    });
  };

  const fetchProfileData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const docRef = doc(db, 'service_providers', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddressChange = (e) => {
    const { value } = e.target;
    setProfile(prev => ({
      ...prev,
      address: value
    }));

    if (value.length > 2) {
      fetchAddressSuggestions(value);
    } else {
      setAddressSuggestions([]);
    }
  };

  const fetchAddressSuggestions = async (query) => {
    const service = new window.google.maps.places.AutocompleteService();
    service.getQueryPredictions({ input: query }, (predictions, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setAddressSuggestions(predictions);
      }
    });
  };

  const handleAddressSelect = (suggestion) => {
    setProfile(prev => ({
      ...prev,
      address: suggestion.description
    }));
    setAddressSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const docRef = doc(db, 'service_providers', userId);
      await updateDoc(docRef, profile);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!auth.currentUser) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="provider-profile">
      <h1>Mon Profil Professionnel</h1>
      
      {!isEditing ? (
        <div className="profile-view">
          <img src={profile.profileImageURL} alt={profile.name} className="profile-image" />
          <div className="profile-info">
            <h2>{profile.name}</h2>
            <p><strong>Service:</strong> {profile.serviceType}</p>
            <p><strong>Tarif horaire:</strong> {profile.hourlyRate}</p>
            <p><strong>Description:</strong> {profile.description}</p>
            <p><strong>Adresse:</strong> {profile.address}</p>
            <p><strong>Téléphone:</strong> {profile.phoneNumber}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Site web:</strong> {profile.website}</p>
            <p><strong>Disponible:</strong> {profile.isAvailable ? 'Oui' : 'Non'}</p>
          </div>
          <button onClick={() => setIsEditing(true)} className="edit-button">
            Modifier le profil
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Nom</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profile.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="serviceType">Type de service</label>
            <input
              type="text"
              id="serviceType"
              name="serviceType"
              value={profile.serviceType}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Adresse</label>
            <input
              type="text"
              id="address-input"
              name="address"
              value={profile.address}
              onChange={handleAddressChange}
              required
              placeholder="Entrez votre adresse"
            />
            {addressSuggestions.length > 0 && (
              <ul className="address-suggestions">
                {addressSuggestions.map((suggestion) => (
                  <li key={suggestion.place_id} onClick={() => handleAddressSelect(suggestion)}>
                    {suggestion.description}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={profile.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="hourlyRate">Tarif horaire</label>
            <input
              type="text"
              id="hourlyRate"
              name="hourlyRate"
              value={profile.hourlyRate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Téléphone</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={profile.phoneNumber}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">Site web</label>
            <input
              type="url"
              id="website"
              name="website"
              value={profile.website}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="isAvailable"
                checked={profile.isAvailable}
                onChange={handleInputChange}
              />
              Disponible pour des services
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)}>
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MyProviderProfile;
