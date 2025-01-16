import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
import { auth } from './components/firebaseConfig';
import ServiceProviderAvailabilityPlanning from './components/ProviderPlanning/ServiceProviderAvailabilityPlanning';
import UserNavbar from './components/UserDashboard/UserNavbar';
import ProviderNavbar from './components/ServiceProviderDashboard/ProviderNavBar';
import { useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next'; // Importation de useTranslation pour les traductions
import './i18n'; // Importez votre fichier de configuration i18n

function App() {
  const { currentUser } = useAuth(); // Utilisez currentUser depuis AuthContext
  const { t, i18n } = useTranslation(); // Utilisation de useTranslation pour récupérer la fonction t et i18n

  // Sélecteur de langue
  const switchLanguage = (lang) => {
    i18n.changeLanguage(lang); // Change la langue de l'application
  };

  return (
    <Router>
      {/* Affichage de la barre de navigation en fonction du rôle de l'utilisateur */}
      {currentUser?.role === 'user' && <UserNavbar />}
      {currentUser?.role === 'provider' && <ProviderNavbar />}     

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
        <Route path="/provider-chat-list" element={<ChatApp currentUser={currentUser} isServiceProvider={true} />} />
        <Route path="/user-messages/:userId" element={<UserMessageList />} />
        <Route path="/chat-app/:userId" element={<ChatApp currentUser={currentUser} isServiceProvider={false} />} />
        <Route path="/user-chat-list" element={<ChatApp currentUser={currentUser} isServiceProvider={false} />} />
        <Route path="/availability-list" element={<ServiceProviderAvailabilityPlanning />} />
      </Routes>
    </Router>
  );
}

export default App;
