import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import UserNavBar from './UserNavbar'; // Assurez-vous que le fichier Navbar.js existe dans le même répertoire
import './UserDashboardScreen.css';

function UserDashboardScreen() {
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });

    return () => unsubscribe(); // Nettoyer l'abonnement lors du démontage du composant
  }, [auth]);

  return (

    <div className="dashboard-container">
      <h1 className="dashboard-title">Tableau de bord</h1>

      {/* Boutons du tableau de bord */}
      <button className="dashboard-button" onClick={() => navigate('/user-profile')}>
        Mon profil
      </button>
      <button className="dashboard-button" onClick={() => navigate('/search-provider')}>
        Rechercher un prestataire
      </button>

      {userId  ? (
        <>
          <button className="dashboard-button" onClick={() => navigate('/favorites')}>
            Mes favoris
          </button>
          <button className="dashboard-button" onClick={() => navigate('/user-chat-list')}>
            Mes messages
          </button>
          <button className="dashboard-button" onClick={() => navigate('/appointment-booking')}>
            Prendre un rendez-vous
          </button>
          <button className="dashboard-button" onClick={() => navigate('/appointments')}>
            Mes rendez-vous
          </button>
        </>
      )  : (
        <p>Utilisateur non connecté</p>
      ) }

      {/* Intégration de la Navbar */}

      <UserNavBar userId={userId} />


    </div>
  );
}

export default UserDashboardScreen;
