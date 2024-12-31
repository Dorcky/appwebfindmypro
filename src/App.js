import React from 'react';
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
import UserMessageList from './components/Messages/UserMessage/UserMessageList'; // La page pour afficher les messages
import UserChatListView from './components//Chats/UserChatListView';
import ProviderChatList from './components/Chats/ProviderChatList'
import ChatApp from './components/Chats/ChatApp';




function App() {
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
        <Route path="/my-provider-profile/:serviceProviderId" element={<MyProviderProfileView />} />
        <Route path="/chat/:serviceProviderId" element={<ServiceProviderMessageList />} />

        <Route path="/provider-chat-list" element={<ChatApp/>} /> {/* Ensure this route is defined */}
        <Route path="/user-messages/:userId" element={<UserMessageList />} />


        <Route path="/chat-app/:userId" element={<ChatApp />} />


        
        {/* Nouvelle route pour la liste des chats utilisateurs */}
        <Route path="/user-chat-list" element={<UserChatListView />} />
      </Routes>
    </Router>
  );
}

export default App;
