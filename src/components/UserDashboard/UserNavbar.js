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
          <span className="navbar-link" onClick={() => navigate('/user-profile')}>
            <FontAwesomeIcon icon={faUser} className="navbar-icon" /> Mon profil
          </span>
        </li>
        <li className="navbar-item">
          <span className="navbar-link" onClick={() => navigate('/search-provider')}>
            <FontAwesomeIcon icon={faSearch} className="navbar-icon" /> Rechercher un prestataire
          </span>
        </li>
        {currentUser ? (
          <>
            <li className="navbar-item">
              <span className="navbar-link" onClick={() => navigate('/favorites')}>
                <FontAwesomeIcon icon={faStar} className="navbar-icon" /> Mes favoris
              </span>
            </li>
            <li className="navbar-item">
              <span className="navbar-link" onClick={() => navigate('/user-chat-list')}>
                <FontAwesomeIcon icon={faEnvelope} className="navbar-icon" /> Mes messages
              </span>
            </li>
            <li className="navbar-item">
              <span className="navbar-link" onClick={() => navigate('/appointment-booking')}>
                <FontAwesomeIcon icon={faCalendar} className="navbar-icon" /> Prendre un rendez-vous
              </span>
            </li>
            <li className="navbar-item">
              <span className="navbar-link" onClick={() => navigate('/appointments')}>
                <FontAwesomeIcon icon={faCalendar} className="navbar-icon" /> Mes rendez-vous
              </span>
            </li>
            <li className="navbar-item">
              <span className="navbar-link logout-link" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} className="navbar-icon" /> Déconnexion
              </span>
            </li>
          </>
        ) : (
          <li className="navbar-item">
            <p className="not-connected">Utilisateur non connecté</p>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default UserNavbar;