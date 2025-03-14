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
  faStar, // Ajoutez cette ligne
} from '@fortawesome/free-solid-svg-icons';
import { Menu, X } from 'lucide-react';
import './ProviderNavBar.css';
import { useTranslation } from 'react-i18next';

function ProviderNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const { t } = useTranslation();

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
    } else if (path.includes('my-user-reviews')) { // Ajoutez cette condition
      setActiveLink('reviews');
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
              <FontAwesomeIcon icon={faUser} className="mr-2" /> {t('ProviderNavbar.Mon profil')}
            </span>
            {currentUser ? (
              <>
                <span
                  className={`navbar-link ${activeLink === 'messages' ? 'active' : ''}`}
                  onClick={() => navigate('/provider-chat-list')}
                >
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" /> {t('ProviderNavbar.Mes messages')}
                </span>
                <span
                  className={`navbar-link ${activeLink === 'availability' ? 'active' : ''}`}
                  onClick={() => navigate('/availability-list')}
                >
                  <FontAwesomeIcon icon={faClock} className="mr-2" />{t('ProviderNavbar.Mes disponibilités')}
                </span>
                <span
                  className={`navbar-link ${activeLink === 'appointments' ? 'active' : ''}`}
                  onClick={() => navigate('/appointments')}
                >
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />{t('ProviderNavbar.Mes rendez-vous')}
                </span>
                <span
                  className={`navbar-link ${activeLink === 'reviews' ? 'active' : ''}`}
                  onClick={() => navigate(`/my-user-reviews/${currentUser?.id}`)}
                >
                  <FontAwesomeIcon icon={faStar} className="mr-2" /> {t('ProviderNavbar.Mes avis')}
                </span>
                <span
                  className="navbar-link logout-link"
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> {t('ProviderNavbar.Déconnexion')}
                </span>
              </>
            ) : (
              <p className="text-gray">{t('ProviderNavbar.Utilisateur non connecté')}</p>
            )}
          </div>

          {/* Bouton hamburger pour les écrans mobiles */}
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden flex hover:bg-transparent items-center"
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
              <FontAwesomeIcon icon={faUser} className="mr-2" /> {t('ProviderNavbar.Mon profil')}
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
                  <FontAwesomeIcon icon={faEnvelope} className="mr-2" /> {t('ProviderNavbar.Mes messages')}
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
                  <FontAwesomeIcon icon={faClock} className="mr-2" />{t('ProviderNavbar.Mes disponibilités')}
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
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />{t('ProviderNavbar.Mes rendez-vous')}
                </span>
                <span
                  className={`block px-3 py-2 text-gray hover:bg-light-blue rounded-md cursor-pointer ${
                    activeLink === 'reviews' ? 'active' : ''
                  }`}
                  onClick={() => {
                    navigate(`/my-user-reviews/${currentUser?.id}`);
                    setMobileMenuOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faStar} className="mr-2" /> {t('ProviderNavbar.Mes avis')}
                </span>
                <span
                  className="block px-3 py-2 text-gray hover:bg-light-blue rounded-md cursor-pointer logout-link"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> {t('ProviderNavbar.Déconnexion')}
                </span>
              </>
            ) : (
              <p className="block px-3 py-2 text-gray">{t('ProviderNavbar.Utilisateur non connecté')}</p>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default ProviderNavbar;