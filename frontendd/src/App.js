import React from 'react';
import CoverPage from './components/CoverPage';
import Navbar from './components/Navbar'; 
import { AuthProvider } from './components/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Itineraries from './components/Itineraries';
import CreateItinerary from './components/CreateItinerary';
import Dashboard from './components/Dashboard';
import ProfileEdit from './components/ProfileEdit';  // Adjust path if needed

import Profile from './components/Profile'; // Individual profile component
import Profiles from './components/Profiles';  
import Chats from './components/Messages';
import PrivateRoute from './components/PrivateRoute';
import { Routes, Route } from 'react-router-dom';

import ItineraryDetails from './components/ItineraryDetails';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';



function App() {
  return (
    <AuthProvider>
      <Navbar />  {/* Add Navbar here - wraps ALL routes */}
      <Routes>
        <Route path="/" element={<CoverPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route path="/itineraries/:id" element={<PrivateRoute><ItineraryDetails /></PrivateRoute>} />
        
        <Route path="/create" element={<PrivateRoute><CreateItinerary /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/itineraries" element={<PrivateRoute><Itineraries /></PrivateRoute>} />
        <Route path="/edit-profile" element={<PrivateRoute><ProfileEdit /></PrivateRoute>} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/messages" element={<PrivateRoute><Chats/></PrivateRoute>} />
        <Route path="/profiles" element={<PrivateRoute><Profiles /></PrivateRoute>} />  
        
      </Routes>
    
    </AuthProvider>
  );
}

export default App;
