import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Importez useAuth
import './ProviderNavBar.css';

function ProviderNavbar() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth(); // Utilisez currentUser et logout depuis AuthContext

  const handleLogout = () => {
    logout(); // Appelez la fonction de déconnexion
    navigate('/login'); // Redirigez vers LoginScreen
  };

  return (
    <nav className="navbar">
      <ul className="navbar-list">
        <li className="navbar-item">
          <button
            className="dashboard-item"
            onClick={() => navigate(`/my-provider-profile/${currentUser?.id}`)}
          >
            Mon profil
          </button>
        </li>

        {currentUser ? (
          <>
            <li className="navbar-item">
              <button
                className="dashboard-button"
                onClick={() => navigate('/provider-chat-list')}
              >
                Mes messages
              </button>
            </li>
            <li className="navbar-item">
              <button
                className="dashboard-item"
                onClick={() => navigate('/availability-list')}
              >
                Mes disponibilités
              </button>
            </li>
            <li className="navbar-item">
              <button
                className="navbar-button"
                onClick={() => navigate('/appointments')}
              >
                Mes rendez-vous
              </button>
            </li>
            <li className="navbar-item">
              <button
                className="logout-button"
                onClick={handleLogout} // Bouton de déconnexion
              >
                Déconnexion
              </button>
            </li>
          </>
        ) : (
          <li className="navbar-item">
            <p>Utilisateur non connecté</p>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default ProviderNavbar;