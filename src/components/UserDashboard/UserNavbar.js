import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSearch, faStar, faEnvelope, faCalendar, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Menu, X } from 'lucide-react'; // Import des icônes de menu et de fermeture
import './UserNavBar.css';

function UserNavbar() {
  const navigate = useNavigate();
  const location = useLocation(); // Pour détecter la page active
  const { currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(''); // Pour gérer l'état actif du lien

  // Mettre à jour l'état actif du lien en fonction de l'URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('user-profile')) {
      setActiveLink('profile');
    } else if (path.includes('search-provider')) {
      setActiveLink('search');
    } else if (path.includes('favorites')) {
      setActiveLink('favorites');
    } else if (path.includes('user-chat-list')) {
      setActiveLink('messages');
    } else if (path.includes('appointments')) {
      setActiveLink('appointments');
    } else {
      setActiveLink('');
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50">
      <div className="mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href="#" className="text-2xl font-bold text-dark-blue">
              FindMyPro
            </a>
          </div>

          {/* Menu pour les écrans larges */}
          <div className="hidden lg:flex items-center space-x-4">
            <span
              className={`navbar-link ${activeLink === 'profile' ? 'active' : ''}`}
              onClick={() => navigate('/user-profile')}
            >
              <FontAwesomeIcon icon={faUser} className="mr-2" /> Mon profil
            </span>
            <span
              className={`navbar-link ${activeLink === 'search' ? 'active' : ''}`}
              onClick={() => navigate('/search-provider')}
            >
              <FontAwesomeIcon icon={faSearch} className="mr-2" /> Rechercher un prestataire
            </span>
            {currentUser ? (
              <>
                <span
                  className={`navbar-link ${activeLink === 'favorites' ? 'active' : ''}`}
                  onClick={() => navigate('/favorites')}
                >
                  <FontAwesomeIcon icon={faStar} className="mr-2" /> Mes favoris
                </span>
                <span
                  className={`navbar-link ${activeLink === 'messages' ? 'active' : ''}`}
                  onClick={() => navigate('/user-chat-list')}
                >
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" /> Mes messages
                </span>
                <span
                  className={`navbar-link ${activeLink === 'appointments' ? 'active' : ''}`}
                  onClick={() => navigate('/appointments')}
                >
                  <FontAwesomeIcon icon={faCalendar} className="mr-2" /> Mes rendez-vous
                </span>
                <span
                  className="navbar-link logout-link"
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> Déconnexion
                </span>
              </>
            ) : (
              <p className="text-gray">Utilisateur non connecté</p>
            )}
          </div>

          {/* Bouton hamburger pour les écrans mobiles */}
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden flex items-center"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray hover:text-dark-blue transition" />
            ) : (
              <Menu className="h-6 w-6 text-gray hover:text-dark-blue transition" />
            )}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <span
              className={`block px-3 py-2 text-gray hover:bg-light-blue rounded-md cursor-pointer ${
                activeLink === 'profile' ? 'active' : ''
              }`}
              onClick={() => {
                navigate('/user-profile');
                setMobileMenuOpen(false);
              }}
            >
              <FontAwesomeIcon icon={faUser} className="mr-2" /> Mon profil
            </span>
            <span
              className={`block px-3 py-2 text-gray hover:bg-light-blue rounded-md cursor-pointer ${
                activeLink === 'search' ? 'active' : ''
              }`}
              onClick={() => {
                navigate('/search-provider');
                setMobileMenuOpen(false);
              }}
            >
              <FontAwesomeIcon icon={faSearch} className="mr-2" /> Rechercher un prestataire
            </span>
            {currentUser ? (
              <>
                <span
                  className={`block px-3 py-2 text-gray hover:bg-light-blue rounded-md cursor-pointer ${
                    activeLink === 'favorites' ? 'active' : ''
                  }`}
                  onClick={() => {
                    navigate('/favorites');
                    setMobileMenuOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faStar} className="mr-2" /> Mes favoris
                </span>
                <span
                  className={`block px-3 py-2 text-gray hover:bg-light-blue rounded-md cursor-pointer ${
                    activeLink === 'messages' ? 'active' : ''
                  }`}
                  onClick={() => {
                    navigate('/user-chat-list');
                    setMobileMenuOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" /> Mes messages
                </span>
                <span
                  className={`block px-3 py-2 text-gray hover:bg-light-blue rounded-md cursor-pointer ${
                    activeLink === 'appointments' ? 'active' : ''
                  }`}
                  onClick={() => {
                    navigate('/appointments');
                    setMobileMenuOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faCalendar} className="mr-2" /> Mes rendez-vous
                </span>
                <span
                  className="block px-3 py-2 text-gray hover:bg-light-blue rounded-md cursor-pointer logout-link"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> Déconnexion
                </span>
              </>
            ) : (
              <p className="block px-3 py-2 text-gray">Utilisateur non connecté</p>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default UserNavbar;
