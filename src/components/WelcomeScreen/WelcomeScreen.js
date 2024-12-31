import React from 'react';
import { Link } from 'react-router-dom';
import './WelcomeScreen.css';

const WelcomeScreen = () => {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1 className="welcome-title">FindMyPro</h1>
        <p className="welcome-subtitle">
          Trouvez le professionnel idéal pour vos projets
        </p>

        <div className="welcome-features">
          <div className="feature">
            <i className="icon-search"></i>
            <h3>Recherche Facile</h3>
            <p>Trouvez rapidement le professionnel adapté à vos besoins</p>
          </div>

          <div className="feature">
            <i className="icon-verify"></i>
            <h3>Profils Vérifiés</h3>
            <p>Tous nos professionnels sont soigneusement sélectionnés</p>
          </div>

          <div className="feature">
            <i className="icon-support"></i>
            <h3>Support 24/7</h3>
            <p>Une assistance disponible à tout moment</p>
          </div>
        </div>

        <div className="welcome-actions">
          <Link 
            to="/login" 
            className="btn btn-primary"
          >
            Connexion
          </Link>
          
          <Link 
            to="/signup" 
            className="btn btn-secondary"
          >
            Inscription
          </Link>
        </div>

        <div className="welcome-footer">
          <p>© 2024 FindMyPro. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
