import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faCalendarAlt,
  faSignOutAlt,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { Menu, X } from 'lucide-react'; // Import des icônes de menu et de fermeture
import './ProviderNavBar.css';

function ProviderNavbar() {
  const navigate = useNavigate();
  const location = useLocation(); // Pour détecter la page active
  const { currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(''); // Pour gérer l'état actif du lien

  // Mettre à jour l'état actif du lien en fonction de l'URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('my-provider-profile')) {
      setActiveLink('profile');
    } else if (path.includes('provider-chat-list')) {
      setActiveLink('messages');
    } else if (path.includes('availability-list')) {
      setActiveLink('availability');
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
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
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
              onClick={() => navigate(`/my-provider-profile/${currentUser?.id}`)}
            >
              <FontAwesomeIcon icon={faUser} className="mr-2" /> Mon profil
            </span>
            {currentUser ? (
              <>
                <span
                  className={`navbar-link ${activeLink === 'messages' ? 'active' : ''}`}
                  onClick={() => navigate('/provider-chat-list')}
                >
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" /> Mes messages
                </span>
                <span
                  className={`navbar-link ${activeLink === 'availability' ? 'active' : ''}`}
                  onClick={() => navigate('/availability-list')}
                >
                  <FontAwesomeIcon icon={faClock} className="mr-2" /> Mes disponibilités
                </span>
                <span
                  className={`navbar-link ${activeLink === 'appointments' ? 'active' : ''}`}
                  onClick={() => navigate('/appointments')}
                >
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" /> Mes rendez-vous
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
                navigate(`/my-provider-profile/${currentUser?.id}`);
                setMobileMenuOpen(false);
              }}
            >
              <FontAwesomeIcon icon={faUser} className="mr-2" /> Mon profil
            </span>
            {currentUser ? (
              <>
                <span
                  className={`block px-3 py-2 text-gray hover:bg-light-blue rounded-md cursor-pointer ${
                    activeLink === 'messages' ? 'active' : ''
                  }`}
                  onClick={() => {
                    navigate('/provider-chat-list');
                    setMobileMenuOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" /> Mes messages
                </span>
                <span
                  className={`block px-3 py-2 text-gray hover:bg-light-blue rounded-md cursor-pointer ${
                    activeLink === 'availability' ? 'active' : ''
                  }`}
                  onClick={() => {
                    navigate('/availability-list');
                    setMobileMenuOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faClock} className="mr-2" /> Mes disponibilités
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
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" /> Mes rendez-vous
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

export default ProviderNavbar;
