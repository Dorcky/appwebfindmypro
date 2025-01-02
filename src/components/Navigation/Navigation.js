import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

const Navigation = ({ isServiceProvider, userId }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  return (
    <nav className="bg-gray-800 p-4 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => navigate(isServiceProvider ? '/service-provider-dashboard' : '/user-dashboard')}
            className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
          >
            Tableau de bord
          </button>

          {isServiceProvider ? (
            <>
              <Link
                to={`/my-provider-profile/${userId}`}
                className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Mon profil
              </Link>
              <Link
                to="/provider-chat-list"
                className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Mes messages
              </Link>
              <Link
                to="/availability-list"
                className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Disponibilités
              </Link>
              <Link
                to={`/my-user-reviews/${userId}`}
                className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Mes avis
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/user-profile"
                className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Mon profil
              </Link>
              <Link
                to="/search-provider"
                className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Rechercher
              </Link>
              <Link
                to="/favorites"
                className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Mes favoris
              </Link>
              <Link
                to="/user-chat-list"
                className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Mes messages
              </Link>
              <Link
                to="/appointments"
                className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Mes rendez-vous
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;