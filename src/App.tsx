import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute'; 
import Navbar from './components/layout/navbar';
import Footer from './components/layout/footer';
import Home from './pages/Home';
import WardPage from './pages/WardPage';
import DiscussionPage from './pages/DiscussionPage';
import AdminDashBoard from './pages/AdminDashBoard';
import MobilizerDashBoard from './pages/MobilizerDashBoard';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CommunityGuidelines from './pages/CommunityGuidelines';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/ward/:slug" element={<WardPage />} />
            <Route path="/discussion/:id" element={<DiscussionPage />} />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/mobilizer" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MOBILIZER']}>
                <MobilizerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/guidelines" element={<CommunityGuidelines />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
