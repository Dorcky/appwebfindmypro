import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebaseConfig'; // Assurez-vous d'importer la configuration Firebase
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadProfileImage } from '../utils/imageUpload'; // Assurez-vous d'importer la fonction utilitaire pour télécharger l'image
import { loadGoogleMapsScript } from '../utils/googleMaps'; // Fonction pour charger l'API Google Maps
import { useTranslation } from 'react-i18next';

const UserProfileView = () => {
  const [userData, setUserData] = useState(null); // État pour les données de l'utilisateur
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

  const { t } = useTranslation();

  // Charge les informations de l'utilisateur depuis Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("Utilisateur authentifié :", user); // Log pour vérifier l'utilisateur authentifié
        const fetchUserData = async () => {
          const userRef = doc(db, 'normal_users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            console.log("Données de l'utilisateur :", userSnap.data()); // Log pour vérifier les données récupérées
            setUserData(userSnap.data());
            setFormData(userSnap.data());
          } else {
            console.log('Aucun document trouvé pour cet utilisateur');
          }
        };
  
        fetchUserData();
      } else {
        console.log('Aucun utilisateur authentifié');
      }
    });
  
    return () => unsubscribe(); // Nettoyer l'abonnement lors du démontage du composant
  }, []);

    useEffect(() => {
      // Charger Google Maps API uniquement si elle n'est pas déjà chargée
      loadGoogleMapsScript(() => setGoogleMapsLoaded(true));
    }, [googleMapsLoaded]); // Add googleMapsLoaded as a dependency

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
    setFormData((prevData) => ({
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
        console.log("Données à sauvegarder :", formData);
  
        // Si une image de profil est sélectionnée, téléchargez-la et mettez à jour Firestore avec l'URL
        let profileImageURL = userData.profileImageURL; // Conserver l'ancienne URL si l'image n'a pas été changée
  
        if (profileImage) {
          // Téléchargement de l'image et récupération de l'URL
          profileImageURL = await uploadProfileImage(profileImage, storage, formData, userRef);
        }
  
        // Mise à jour des données utilisateur dans Firestore (y compris l'URL de l'image si l'image a été changée)
        await updateDoc(userRef, {
          ...formData,
          profileImageURL, // Inclure l'URL de l'image si elle a été mise à jour
        });
  
        // Mise à jour immédiate du state pour refléter les changements
        setUserData(prevData => ({
          ...prevData,
          ...formData,
          profileImageURL, // Inclure l'URL de l'image dans le state aussi
        }));
  
        setIsEditing(false); // Désactive le mode édition
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

  // Fonction pour annuler les modifications et revenir à la vue primaire
  const handleCancel = () => {
    setIsEditing(false);
    setFormData(userData); // Réinitialiser les données du formulaire avec les données actuelles de l'utilisateur
    setProfileImage(null); // Réinitialiser l'image de profil sélectionnée
  };

  // Affichage pendant le chargement des données utilisateur
  if (!userData) return <div>{t('UserProfile.loading')}</div>;

  return (
    <div className="bg-[rgb(217,237,247)] min-h-screen px-4 pt-28 w-full">
      <div className="max-w-5xl mx-auto mb-8 bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Colonne de gauche : Photo et boutons */}
          <div className="w-full md:w-1/3 bg-[rgb(102,148,191)] p-6 md:p-8 flex flex-col items-center justify-center space-y-4 md:space-y-6">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img
                src={userData.profileImageURL || '/default-profile.png'}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white text-center">{userData.fullName}</h1>
            <button
              className="w-full py-3 px-4 md:px-6 bg-white text-[rgb(51,77,102)] rounded-xl hover:bg-[rgb(217,237,247)] transition-colors text-base md:text-lg font-semibold shadow-md"
              onClick={handleEdit}
            >
             {t('UserProfile.editProfile')}
            </button>
            <button className="w-full py-3 px-4 md:px-6 bg-[rgb(51,77,102)] text-white rounded-xl hover:bg-[rgb(73,104,133)] transition-colors text-base md:text-lg font-semibold shadow-md">
            {t('UserProfile.changePassword')}
            </button>
          </div>

          {/* Colonne de droite : Informations */}
          <div className="w-full md:w-2/3 p-6 md:p-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(51,77,102)] mb-6 md:mb-8">{t('UserProfile.profileHeader')}</h2> 
            {isEditing ? (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-[rgb(51,77,102)] mb-2">{t('UserProfile.fullName')}</h3>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2"
                  />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-[rgb(51,77,102)] mb-2">{t('UserProfile.email')}</h3>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="w-full text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2"
                  />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-[rgb(51,77,102)] mb-2">{t('UserProfile.phoneNumber')}</h3>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2"
                  />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-[rgb(51,77,102)] mb-2">{t('UserProfile.address')}</h3>
                  <input
                    type="text"
                    id="address-input"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2"
                  />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-[rgb(51,77,102)] mb-2">{t('UserProfile.language')}</h3>
                  <input
                    type="text"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2"
                  />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-[rgb(51,77,102)] mb-2">{t('UserProfile.profileImage')}</h3>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2"
                  />
                </div>
                <div>
                  <label className="text-lg md:text-xl font-semibold text-[rgb(51,77,102)] mb-2">
                    <input
                      type="checkbox"
                      checked={formData.notificationsEnabled}
                      onChange={() =>

                        setFormData({ ...formData, notificationsEnabled: !formData.notificationsEnabled })
                      }
                    />
                    <span className="ml-2">{t('UserProfile.notificationsEnabled')}</span>
                  </label>
                </div>
                <div className="flex space-x-4">
                  <button
                    className="w-1/2 py-2 md:py-3 px-4 md:px-6 bg-[rgb(51,77,102)] text-white rounded-xl hover:bg-[rgb(102,148,191)] transition-colors text-base md:text-lg font-semibold shadow-md"
                    onClick={handleSaveChanges}
                  >
                    {t('UserProfile.saveChanges')}
                  </button>
                  <button
                    className="w-1/2 py-2 md:py-3 px-4 md:px-6 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors text-base md:text-lg font-semibold shadow-md"
                    onClick={handleCancel}
                  >
                  {t('UserProfile.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-[rgb(51,77,102)] mb-2">{t('UserProfile.fullName')}</h3>
                  <p className="text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">
                    {userData.fullName}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-[rgb(51,77,102)] mb-2">{t('UserProfile.email')}</h3>
                  <p className="text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">
                    {userData.email}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-[rgb(51,77,102)] mb-2">{t('UserProfile.fullName')}</h3>
                  <p className="text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">
                    {userData.phoneNumber}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-[rgb(51,77,102)] mb-2">{t('UserProfile.address')}</h3>
                  <p className="text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">
                    {userData.address}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-[rgb(51,77,102)] mb-2">{t('UserProfile.language')}</h3>
                  <p className="text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">
                    {userData.language}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-[rgb(51,77,102)] mb-2">{t('UserProfile.language')}</h3>
                  <p className="text-base text-[rgb(128,128,128)] border-b-2 border-[rgb(217,237,247)] pb-2">
                  {userData.notificationsEnabled ? t('UserProfile.notifications.enabled') : t('UserProfile.notifications.disabled')}
                  </p>
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
