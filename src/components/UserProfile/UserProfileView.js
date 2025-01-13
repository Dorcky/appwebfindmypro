import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebaseConfig'; // Assurez-vous d'importer la configuration Firebase
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadProfileImage } from '../utils/imageUpload'; // Assurez-vous d'importer la fonction utilitaire pour télécharger l'image
import { loadGoogleMapsScript } from '../utils/googleMaps'; // Fonction pour charger l'API Google Maps

const UserProfileView = () => {
  const [userData, setUserData] = useState(null);  // État pour les données de l'utilisateur
  const [isEditing, setIsEditing] = useState(false); // Pour gérer le mode édition
  const [profileImage, setProfileImage] = useState(null); // Pour gérer l'image de profil sélectionnée
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    language: '',
    notificationsEnabled: false,
  });
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false); // Indicateur pour savoir si Google Maps est chargé

  // Charge les informations de l'utilisateur depuis Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'normal_users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
          setFormData(userSnap.data());
        } else {
          console.log("Aucun document trouvé pour cet utilisateur");
        }
      }
    };

    fetchUserData();

    // Charger Google Maps API uniquement si elle n'est pas déjà chargée
    loadGoogleMapsScript(() => setGoogleMapsLoaded(true));
  }, []);

  // Initialiser l'auto-complétion de l'adresse quand Google Maps est chargé
  useEffect(() => {
    if (googleMapsLoaded && window.google && isEditing) {
      const input = document.getElementById('address-input');
      if (input) {
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          types: ['geocode'],
        });
        autocomplete.setFields(['address_component', 'formatted_address']);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const address = place.formatted_address;
          setFormData((prevData) => ({
            ...prevData,
            address: address || '',
          }));
        });
      }
    }
  }, [googleMapsLoaded, isEditing]);

  // Fonction pour gérer les changements de formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Fonction pour gérer l'ajout d'une image
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
    }
  };

  // Fonction pour sauvegarder les modifications
  const handleSaveChanges = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'normal_users', user.uid);
        if (profileImage) {
          await uploadProfileImage(profileImage, storage, formData, userRef);
        } else {
          await updateDoc(userRef, formData);
        }
        setUserData(prevData => ({
          ...prevData,
          ...formData,
        }));
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil", error);
    }
  };

  // Fonction pour passer en mode édition
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Affichage pendant le chargement des données utilisateur
  if (!userData) return <div>Chargement...</div>;

  return (
    <div className="bg-[rgb(217,237,247)] h-[40vh] p-12 pt-20 w-full">

      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden mt-20">
        <div className="flex">
          {/* Colonne de gauche : Photo et boutons */}
          <div className="w-1/3 bg-[rgb(102,148,191)] p-8 flex flex-col items-center justify-center space-y-6">
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img 
                src={userData.profileImageURL || '/default-profile.png'}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-3xl font-bold text-white text-center">{userData.fullName}</h1>
            <button 
              className="w-full py-3 px-6 bg-white text-[rgb(51,77,102)] rounded-full hover:bg-[rgb(217,237,247)] transition-colors text-lg font-semibold shadow-md"
              onClick={handleEdit}
            >
              Edit Profile
            </button>
            <button className="w-full py-3 px-6 bg-[rgb(51,77,102)] text-white rounded-full hover:bg-[rgb(102,148,191)] transition-colors text-lg font-semibold shadow-md">
              Change Password
            </button>
          </div>

          {/* Colonne de droite : Informations */}
          <div className="w-2/3 p-12">
            <h2 className="text-4xl font-bold text-[rgb(51,77,102)] mb-8">My Profile</h2>
            {isEditing ? (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Full Name</h3>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full text-2xl text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Email Address</h3>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="w-full text-2xl text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Phone Number</h3>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full text-2xl text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Address</h3>
                  <input
                    type="text"
                    id="address-input"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full text-2xl text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Language</h3>
                  <input
                    type="text"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full text-2xl text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Profile Image</h3>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full text-2xl text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2"
                  />
                </div>
                <div>
                  <label className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">
                    <input
                      type="checkbox"
                      checked={formData.notificationsEnabled}
                      onChange={() => setFormData({ ...formData, notificationsEnabled: !formData.notificationsEnabled })}
                    />
                    <span className="ml-2">Notifications Enabled</span>
                  </label>
                </div>
                <button 
                  className="w-full py-3 px-6 bg-[rgb(51,77,102)] text-white rounded-full hover:bg-[rgb(102,148,191)] transition-colors text-lg font-semibold shadow-md"
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Full Name</h3>
                  <p className="text-2xl text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">{userData.fullName}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Email Address</h3>
                  <p className="text-2xl text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">{userData.email}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Phone Number</h3>
                  <p className="text-2xl text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">{userData.phoneNumber}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Address</h3>
                  <p className="text-2xl text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">{userData.address}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Language</h3>
                  <p className="text-2xl text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">{userData.language}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[rgb(51,77,102)] mb-2">Notifications Enabled</h3>
                  <p className="text-2xl text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">{userData.notificationsEnabled ? 'Yes' : 'No'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;