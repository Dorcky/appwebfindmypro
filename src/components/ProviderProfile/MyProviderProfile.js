import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { loadGoogleMapsScript } from '../utils/googleMaps';
import './MyProviderProfile.css';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
    website: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [geocoder, setGeocoder] = useState(null);
  const [autocompleteInstance, setAutocompleteInstance] = useState(null);
  const storage = getStorage();
  const [profileImage, setProfileImage] = useState(null);  

  const [user, setUser] = useState(null); // Ajoutez un état pour l'utilisateur

  const auth = getAuth();

  useEffect(() => {
    // Écoutez les changements d'état d'authentification
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Utilisateur authentifié :", user);
        setUser(user); // Mettez à jour l'état de l'utilisateur
        fetchProfileData(user.uid); // Récupérez les données de l'utilisateur
      } else {
        console.log('Aucun utilisateur authentifié');
        setUser(null); // Réinitialisez l'état de l'utilisateur
      }
    });

    // Chargez Google Maps
    loadGoogleMapsScript(() => {
      setGeocoder(new window.google.maps.Geocoder());
      initAutocomplete();
    });

    // Nettoyez l'écouteur lors du démontage du composant
    return () => unsubscribe();
  }, [auth]);

  const initAutocomplete = () => {
    const input = document.getElementById('address-input');
    if (!input) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['address'],
      componentRestrictions: { country: 'CA' },
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      setProfile((prev) => ({
        ...prev,
        address: place.formatted_address,
        gpsLocation: [
          place.geometry.location.lat(),
          place.geometry.location.lng(),
        ],
      }));
    });

    setAutocompleteInstance(autocomplete);
  };

  const geocodeAddress = async (address) => {
    if (!geocoder) return null;

    try {
      const response = await geocoder.geocode({ address });
      if (response.results && response.results[0]) {
        const location = response.results[0].geometry.location;
        return [location.lat(), location.lng()];
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const fetchProfileData = async (userId) => {
    try {
      const docRef = doc(db, 'service_providers', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        console.log('Aucun document trouvé pour cet utilisateur');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil :', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddressChange = (e) => {
    const { value } = e.target;
    setProfile((prev) => ({
      ...prev,
      address: value,
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
    setProfile((prev) => ({
      ...prev,
      address: suggestion.description,
    }));
    setAddressSuggestions([]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
    }
  };

  const uploadProfileImage = async (imageFile) => {
    if (!imageFile) return null;

    const storageRef = ref(storage, `profile_images/${auth.currentUser?.uid}`);
    try {
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      let coordinates = profile.gpsLocation;
      if (!coordinates && profile.address.trim() !== "") {
        coordinates = await geocodeAddress(profile.address);
      }

      let profileImageURL = profile.profileImageURL;
      if (profileImage) {
        profileImageURL = await uploadProfileImage(profileImage);
      }

      const updatedProfile = {
        ...profile,
        gpsLocation: coordinates,
        profileImageURL,
      };

      const docRef = doc(db, 'service_providers', userId);
      await updateDoc(docRef, updatedProfile);
      setProfile(updatedProfile);
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
    <div className="bg-[rgb(217,237,247)] min-h-screen p-4 sm:p-8 md:p-12">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden mt-10 md:mt-20">
        <div className="flex flex-col md:flex-row">
          {/* Colonne de gauche : Photo et boutons */}
          <div className="w-full md:w-1/3 bg-[rgb(102,148,191)] p-6 md:p-8 flex flex-col items-center justify-center space-y-4 md:space-y-6">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img
                src={profile.profileImageURL || "/api/placeholder/192/192"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white text-center">{profile.name}</h1>
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-2 px-4 md:py-3 md:px-6 bg-white text-[rgb(51,77,102)] rounded-xl hover:bg-[rgb(217,237,247)] transition-colors text-base md:text-lg font-semibold shadow-md"
            >
              Edit Profile
            </button>
            <button className="w-full py-2 px-4 md:py-3 md:px-6 bg-[rgb(51,77,102)] text-white rounded-xl hover:bg-[rgb(73,104,133)] transition-colors text-base md:text-lg font-semibold shadow-md">
              Change Password
            </button>
          </div>

          {/* Colonne de droite : Informations */}
          <div className="w-full md:w-2/3 p-6 md:p-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(51,77,102)] mb-6 md:mb-8">My Profile</h2>
            {!isEditing ? (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Full Name</h3>
                  <p className="text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">{profile.name}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Email Address</h3>
                  <p className="text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">{profile.email}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Address</h3>
                  <p className="text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">{profile.address}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Service Type</h3>
                  <p className="text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">{profile.serviceType}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Hourly Rate</h3>
                  <p className="text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">{profile.hourlyRate}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Availability</h3>
                  <p className="text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">
                    {profile.isAvailable ? 'Available' : 'Not Available'}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div>
                  <label htmlFor="name" className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profile.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border-2 border-[rgb(217,237,247)] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    className="w-full p-2 border-2 border-[rgb(217,237,247)] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="address" className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Address</label>
                  <input
                    type="text"
                    id="address-input"
                    name="address"
                    value={profile.address}
                    onChange={handleAddressChange}
                    className="w-full p-2 border-2 border-[rgb(217,237,247)] rounded-lg"
                    required
                  />
                  {addressSuggestions.length > 0 && (
                    <ul className="mt-2 bg-white border border-gray-300 rounded-lg">
                      {addressSuggestions.map((suggestion) => (
                        <li
                          key={suggestion.place_id}
                          onClick={() => handleAddressSelect(suggestion)}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {suggestion.description}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label htmlFor="serviceType" className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Service Type</label>
                  <input
                    type="text"
                    id="serviceType"
                    name="serviceType"
                    value={profile.serviceType}
                    onChange={handleInputChange}
                    className="w-full p-2 border-2 border-[rgb(217,237,247)] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="hourlyRate" className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Hourly Rate</label>
                  <input
                    type="text"
                    id="hourlyRate"
                    name="hourlyRate"
                    value={profile.hourlyRate}
                    onChange={handleInputChange}
                    className="w-full p-2 border-2 border-[rgb(217,237,247)] rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="isAvailable" className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Availability</label>
                  <input
                    type="checkbox"
                    id="isAvailable"
                    name="isAvailable"
                    checked={profile.isAvailable}
                    onChange={handleInputChange}
                    className="ml-2"
                  />
                </div>
                <div>
                  <label htmlFor="profileImage" className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Profile Image</label>
                  <input
                    type="file"
                    id="profileImage"
                    name="profileImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-2 border-2 border-[rgb(217,237,247)] rounded-lg"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-4 md:py-3 md:px-6 bg-[rgb(51,77,102)] text-white rounded-xl hover:bg-[rgb(102,148,191)] transition-colors text-base md:text-lg font-semibold shadow-md"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="w-full py-2 px-4 md:py-3 md:px-6 bg-white text-[rgb(51,77,102)] rounded-xl hover:bg-[rgb(217,237,247)] transition-colors text-base md:text-lg font-semibold shadow-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProviderProfile;