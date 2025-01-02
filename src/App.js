import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import LoginScreen from './components/loginscreen/LoginScreen';
import UserDashboard from './components/UserDashboard/UserDashboardScreen';
import ServiceProviderDashboard from './components/ServiceProviderDashboard/ServiceProviderDashboardScreen';
import SignupScreen from './components/Signup/SignupScreen';
import SearchProviderView from './components/SearchProvider/SearchProviderView';
import MyProviderProfileView from './components/MyProviderProfile/MyProviderProfileView';
import UserProfileView from './components/UserProfile/UserProfileView';
import FavoritesView from './components/Favorites/FavoritesView';
import ServiceProviderMessageList from './components/Messages/Provider/ServiceProviderMessageList';
import AppointmentBookingList from './components/Appointments/AppointmentBookingList';
import ServiceProviderAvailabilityView from './components/Availabilities/ServiceProviderAvailabilityView'; 
import ReviewScreen from './components/Reviews/ReviewScreen';
import MyProviderProfile from './components/ProviderProfile/MyProviderProfile';
import MyUserReviewView from './components/MyUserReview/MyUserReviewView';
import UserMessageList from './components/Messages/UserMessage/UserMessageList';
import ChatApp from './components/Chats/ChatApp';
import { auth } from './components/firebaseConfig'; // Assurez-vous d'importer l'objet auth de firebase
import ServiceProviderAvailabilityPlanning from './components/ProviderPlanning/ServiceProviderAvailabilityPlanning';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isServiceProvider, setIsServiceProvider] = useState(false); // ou dynamique en fonction de l'utilisateur connecté

  // Effet pour écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // L'utilisateur est connecté, vous pouvez obtenir des informations supplémentaires si nécessaire
        setCurrentUser({
          id: user.uid,
          email: user.email,
          // ... autres informations si nécessaire
        });

        // Par exemple, vérifier si c'est un fournisseur de services
        setIsServiceProvider(false); // Remplacer par votre logique réelle
      } else {
        // L'utilisateur n'est pas connecté
        setCurrentUser(null);
        setIsServiceProvider(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
  /*

  // Navbar component
  const Navbar = () => {
    const navigate = useNavigate();

    return (
      <nav className="navbar">
        <div className="navbar-logo">Logo</div>
        <ul className="navbar-links">
          {currentUser && !isServiceProvider ? (
            <>
              <li onClick={() => navigate(`/user-dashboard`)}>Tableau de bord</li>
              <li onClick={() => navigate(`/user-profile`)}>Mon profil</li>
              <li onClick={() => navigate('/search-provider')}>Rechercher un prestataire</li>
              <li onClick={() => navigate('/favorites')}>Mes favoris</li>
              <li onClick={() => navigate('/user-chat-list')}>Mes messages</li>
              <li onClick={() => navigate('/appointments')}>Mes rendez-vous</li>
            </>
          ) : currentUser && isServiceProvider ? (
            <>
              <li onClick={() => navigate(`/service-provider-dashboard`)}>Tableau de bord</li>
              <li onClick={() => navigate(`/my-provider-profile/${currentUser.id}`)}>Mon profil</li>
              <li onClick={() => navigate('/provider-chat-list')}>Mes messages</li>
              <li onClick={() => navigate('/availability-list')}>Mes disponibilités</li>
              <li onClick={() => navigate(`/my-user-reviews/${currentUser.id}`)}>Mes avis</li>
            </>
          ) : (
            <li onClick={() => navigate('/login')}>Se connecter</li>
          )}
        </ul>
        {currentUser && (
          <div className="navbar-auth">
            <button onClick={handleLogout} className="logout-button">Déconnexion</button>
          </div>
        )}
      </nav>
    );
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      console.log('Utilisateur déconnecté');
      setCurrentUser(null);
      setIsServiceProvider(false);
    }).catch((error) => {
      console.error('Erreur lors de la déconnexion:', error);
    });
  };*/

  return (
    <Router>
   
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/service-provider-dashboard" element={<ServiceProviderDashboard />} />
        <Route path="/search-provider" element={<SearchProviderView />} />
        <Route path="/user-profile" element={<UserProfileView />} />
        <Route path="/provider/:serviceProviderId" element={<MyProviderProfileView />} />
        <Route path="/favorites" element={<FavoritesView />} />
        <Route path="/service-provider-message-list" element={<ServiceProviderMessageList />} />
        <Route path="/service-provider-availability/:serviceProviderId" element={<ServiceProviderAvailabilityView />} /> 
        <Route path="/service-provider-message-list/:serviceProviderId" element={<ServiceProviderMessageList />} />
        <Route path="/service-provider-profile/:serviceProviderId" element={<MyProviderProfileView />} />
        <Route path="/review/:serviceProviderId" element={<ReviewScreen />} />       
        <Route path="/appointments" element={<AppointmentBookingList />} />
        <Route path="/my-provider-profile/:serviceProviderId" element={<MyProviderProfile />} />
        <Route path="/user-messages" element={<UserMessageList />} />
        <Route path="/my-user-reviews/:serviceProviderId" element={<MyUserReviewView />} />
        <Route path="/chat/:serviceProviderId" element={<ServiceProviderMessageList />} />
        <Route path="/provider-chat-list" element={<ChatApp currentUser={currentUser} isServiceProvider={isServiceProvider} />} /> 
        <Route path="/user-messages/:userId" element={<UserMessageList />} />
        <Route path="/chat-app/:userId" element={<ChatApp currentUser={currentUser} isServiceProvider={isServiceProvider} />} />
        <Route path="/user-chat-list" element={<ChatApp currentUser={currentUser} isServiceProvider={isServiceProvider} />} />
        <Route path="/availability-list" element={<ServiceProviderAvailabilityPlanning />} />
      </Routes>
    </Router>
  );
}

export default App;
