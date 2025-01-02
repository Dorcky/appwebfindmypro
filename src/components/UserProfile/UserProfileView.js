import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebaseConfig'; // Assurez-vous d'importer la configuration Firebase
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadProfileImage } from '../utils/imageUpload'; // Assurez-vous d'importer la fonction utilitaire pour télécharger l'image

import './UserProfileView.css'; // Import du fichier CSS pour le style
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
    console.log("Vérification de l'état de googleMapsLoaded :", googleMapsLoaded);
  
    if (googleMapsLoaded && window.google && isEditing) {
      console.log("L'API Google Maps est prête. Initialisation de l'autocomplétion...");
  
      const input = document.getElementById('address-input');
      if (input) {
        console.log("Élément input trouvé dans le DOM.");
  
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          types: ['geocode'],
        });
        autocomplete.setFields(['address_component', 'formatted_address']);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const address = place.formatted_address;
          console.log("Adresse sélectionnée :", address);
          setFormData((prevData) => ({
            ...prevData,
            address: address || '',
          }));
        });
  
        console.log("Autocomplétion initialisée avec succès.");
      } else {
        console.error("Élément input non trouvé dans le DOM.");
      }
    } else {
      console.log("L'API Google Maps n'est pas encore chargée ou le mode édition est désactivé.");
    }
  }, [googleMapsLoaded, isEditing]); // Ajoutez isEditing comme dépendance
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

 // Dans la fonction handleSaveChanges
 const handleSaveChanges = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, 'normal_users', user.uid);
      console.log("Données à sauvegarder :", formData);

      // Sauvegarder les données dans Firestore
      if (profileImage) {
        await uploadProfileImage(profileImage, storage, formData, userRef);
      } else {
        await updateDoc(userRef, formData);
      }

      // Mise à jour immédiate du state pour refléter les changements
      setUserData(prevData => ({
        ...prevData,
        ...formData,
      }));

      setIsEditing(false);
      console.log("Profil mis à jour avec succès.");
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
    <div className="user-profile-container">
      <h1>Mon Profil</h1>

      <div className="profile-card">
        {/* Avatar */}
        <div className="avatar">
          <img src={userData.profileImageURL || '/default-profile.png'} alt="Profil" />
        </div>

        <div className="profile-info">
          {isEditing ? (
            <div className="edit-form">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Nom complet"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                disabled
              />
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Numéro de téléphone"
              />
              <input
                type="text"
                id="address-input" // Important pour l'auto-complétion
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Adresse"
              />
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                placeholder="Langue"
              />
              <input
                type="file"
                onChange={handleFileChange}
              />
              <div className="toggle-notifications">
                <label>
                  Notifications activées
                  <input
                    type="checkbox"
                    checked={formData.notificationsEnabled}
                    onChange={() => setFormData({ ...formData, notificationsEnabled: !formData.notificationsEnabled })}
                  />
                </label>
              </div>
              <button onClick={handleSaveChanges}>Sauvegarder</button>
            </div>
          ) : (
            <div>
              <p><strong>Nom:</strong> {userData.fullName}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Téléphone:</strong> {userData.phoneNumber}</p>
              <p><strong>Adresse:</strong> {userData.address}</p>
              <p><strong>Langue:</strong> {userData.language}</p>
              <p><strong>Notifications activées:</strong> {userData.notificationsEnabled ? 'Oui' : 'Non'}</p>
              <button onClick={handleEdit}>Modifier</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
