import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faCalendarAlt,
  faSignOutAlt,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import './ProviderNavBar.css';

function ProviderNavbar() {
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
          <span
            className="navbar-link"
            onClick={() => navigate(`/my-provider-profile/${currentUser?.id}`)}
          >
            <FontAwesomeIcon icon={faUser} className="navbar-icon" /> Mon profil
          </span>
        </li>

        {currentUser ? (
          <>
            <li className="navbar-item">
              <span
                className="navbar-link"
                onClick={() => navigate('/provider-chat-list')}
              >
                <FontAwesomeIcon icon={faEnvelope} className="navbar-icon" /> Mes messages
              </span>
            </li>
            <li className="navbar-item">
              <span
                className="navbar-link"
                onClick={() => navigate('/availability-list')}
              >
                <FontAwesomeIcon icon={faClock} className="navbar-icon" /> Mes disponibilités
              </span>
            </li>
            <li className="navbar-item">
              <span
                className="navbar-link"
                onClick={() => navigate('/appointments')}
              >
                <FontAwesomeIcon icon={faCalendarAlt} className="navbar-icon" /> Mes rendez-vous
              </span>
            </li>
            <li className="navbar-item">
              <span
                className="navbar-link logout-link"
                onClick={handleLogout}
              >
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

export default ProviderNavbar;