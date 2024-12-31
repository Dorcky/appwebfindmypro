import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './ServiceProviderDashboardScreen.css';

const ServiceProviderDashboardScreen = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        console.log('Aucun utilisateur connecté');
      }
    });
    return () => unsubscribe();
  }, [auth]);

  return (
    <div className="dashboard-container">
      <h1>Tableau de bord du prestataire</h1>
      {userId ? (
        <>
          <button className="dashboard-item" onClick={() => navigate(`/my-provider-profile/${userId}`)}>
            Mon profil
          </button>
          
          <button className="dashboard-button" onClick={() => navigate('/provider-chat-list')}>
            Mes messages
          </button>
          <button className="dashboard-item" onClick={() => navigate('/availability-list')}>
            Mes disponibilités
          </button>

          {/* Nouveau bouton pour accéder aux avis */}
          <button className="dashboard-item" onClick={() => navigate(`/my-user-reviews/${userId}`)}>
            Mes avis
          </button>
        </>
      ) : (
        <p>Chargement de l'ID utilisateur...</p>
      )}
    </div>
  );
};

export default ServiceProviderDashboardScreen;
