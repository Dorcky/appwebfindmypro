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
import UserChatListView from './components/Chats/UserChatListView';
import ProviderChatList from './components/Chats/ProviderChatList';
import ChatApp from './components/Chats/ChatApp';
import { auth } from './components/firebaseConfig'; // Assurez-vous d'importer l'objet auth de firebase

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
        // Ici, vous pourriez ajouter la logique pour vérifier si l'utilisateur est un fournisseur
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
        <Route path="/provider-chat-list" element={<ChatApp currentUser={currentUser} isServiceProvider={isServiceProvider} />} /> {/* Pass currentUser et isServiceProvider */}
        <Route path="/user-messages/:userId" element={<UserMessageList />} />
        <Route path="/chat-app/:userId" element={<ChatApp currentUser={currentUser} isServiceProvider={isServiceProvider} />} />
        <Route path="/user-chat-list" element={<UserChatListView />} />
      </Routes>
    </Router>
  );
}

export default App;
