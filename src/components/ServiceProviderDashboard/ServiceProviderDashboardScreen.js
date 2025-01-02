import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './ServiceProviderDashboardScreen.css';
import ProviderNavbar from './ProviderNavBar';

function ServiceProviderDashboardScreen () {
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
      <ProviderNavbar userId={userId} />

    </div>
  );
};

export default ServiceProviderDashboardScreen;
