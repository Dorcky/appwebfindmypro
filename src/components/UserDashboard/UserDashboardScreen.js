import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  // Assurez-vous d'importer useNavigate
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './UserDashboardScreen.css';

function UserDashboardScreen() {
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();  // Initialisez useNavigate
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Tableau de bord</h1>

      <button className="dashboard-button" onClick={() => navigate('/user-profile')}>
        Mon profil
      </button>
      <button className="dashboard-button" onClick={() => navigate('/search-provider')}>
        Rechercher un prestataire
      </button>

      {userId ? (
        <>
          <button className="dashboard-button" onClick={() => navigate('/favorites')}>
            Mes favoris
          </button>
          {/* Modification du bouton ici */}
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
      ) : (
        <p>Utilisateur non connecté</p>
      )}
    </div>
  );
}

export default UserDashboardScreen;
