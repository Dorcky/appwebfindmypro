import React, { useEffect, useState } from 'react';
import { db, auth, storage } from '../firebaseConfig'; // Assurez-vous d'importer la configuration Firebase
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

import './UserProfileView.css'; // Import du fichier CSS pour le style

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

  // Charge les informations de l'utilisateur depuis Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
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
  }, []);

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

  // Fonction pour sauvegarder les modifications dans Firebase
  const handleSaveChanges = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        
        // Si un fichier image est sélectionné, on le télécharge dans Firebase Storage
        if (profileImage) {
          const storageRef = ref(storage, `profile_images/${profileImage.name}`);
          const uploadTask = uploadBytesResumable(storageRef, profileImage);
          
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log('Upload is ' + progress + '% done');
            }, 
            (error) => {
              console.error('Erreur lors du téléchargement', error);
            }, 
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              // Mettre à jour le profil dans Firestore avec l'URL de l'image
              await updateDoc(userRef, {
                ...formData,
                profileImageURL: downloadURL,
              });
            }
          );
        } else {
          // Si aucune image n'est sélectionnée, on met simplement à jour les autres informations
          await updateDoc(userRef, formData);
        }
        setIsEditing(false); // Quitter le mode édition après la sauvegarde
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
      <div className="profile-info">
        <div className="profile-image">
          <img src={userData.profileImageURL || '/default-profile.png'} alt="Profil" />
        </div>
        <div className="profile-details">
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
