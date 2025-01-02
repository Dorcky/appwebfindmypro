import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSearch, faStar, faEnvelope, faCalendar, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './UserNavBar.css';

function UserNavbar() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <ul className="navbar-list">
        <li className="navbar-item">
          <button className="navbar-button" onClick={() => navigate('/user-profile')}>
            <FontAwesomeIcon icon={faUser} /> Mon profil
          </button>
        </li>
        <li className="navbar-item">
          <button className="navbar-button" onClick={() => navigate('/search-provider')}>
            <FontAwesomeIcon icon={faSearch} /> Rechercher un prestataire
          </button>
        </li>
        {currentUser ? (
          <>
            <li className="navbar-item">
              <button className="navbar-button" onClick={() => navigate('/favorites')}>
                <FontAwesomeIcon icon={faStar} /> Mes favoris
              </button>
            </li>
            <li className="navbar-item">
              <button className="navbar-button" onClick={() => navigate('/user-chat-list')}>
                <FontAwesomeIcon icon={faEnvelope} /> Mes messages
              </button>
            </li>
            <li className="navbar-item">
              <button className="navbar-button" onClick={() => navigate('/appointment-booking')}>
                <FontAwesomeIcon icon={faCalendar} /> Prendre un rendez-vous
              </button>
            </li>
            <li className="navbar-item">
              <button className="navbar-button" onClick={() => navigate('/appointments')}>
                <FontAwesomeIcon icon={faCalendar} /> Mes rendez-vous
              </button>
            </li>
            <li className="navbar-item">
              <button className="logout-button" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} /> Déconnexion
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

export default UserNavbar;
