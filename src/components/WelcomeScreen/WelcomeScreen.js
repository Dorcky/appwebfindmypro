import React, { useState } from "react";
import { Link } from "react-router-dom";
import { X, Menu } from "lucide-react";
import "./WelcomeScreen.css";
import booking from "../../assets/images/booking.png";
import mecanic from "../../assets/images/mecanic.png";
import LoginScreen from "../loginscreen/LoginScreen";
import SignupScreen from "../Signup/SignupScreen";
import Modal from "../Modal/Modal";
import ContactForm from "../ContactForm/ContactForm";

const WelcomeScreen = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setSignupModalOpen] = useState(false);
  const [isContactModalOpen, setContactModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-light-blue">
      {/* Navbar */}
      <nav className="bg-white shadow-lg fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="#" className="text-2xl font-bold text-dark-blue">
                FindMyPro
              </a>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray hover:text-dark-blue transition">
                Accueil
              </a>
              <a href="#" className="text-gray hover:text-dark-blue transition">
                À propos
              </a>
              <a href="#" className="text-gray hover:text-dark-blue transition">
                Services
              </a>
              <button
                onClick={() => setContactModalOpen(true)}
                className="text-gray hover:text-dark-blue transition"
              >
                Contact
              </button>

              <button
                    onClick={(e) => {
                      e.stopPropagation(); // Empêche la fermeture du modal
                      setLoginModalOpen(true);
                    }}
                    className="px-4 py-2 text-dark-blue border border-dark-blue rounded-lg hover:bg-light-blue transition"
                  >
                    Connexion
                  </button>

              <button
                onClick={() => setSignupModalOpen(true)}
                className="px-4 py-2 bg-medium-blue text-white rounded-lg hover:bg-dark-blue transition"
              >
                Inscription
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center"
            >
              <Menu className="h-6 w-6 text-gray" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="#"
                className="block px-3 py-2 text-gray hover:bg-light-blue rounded-md"
              >
                Accueil
              </a>
              <a
                href="#"
                className="block px-3 py-2 text-gray hover:bg-light-blue rounded-md"
              >
                À propos
              </a>
              <a
                href="#"
                className="block px-3 py-2 text-gray hover:bg-light-blue rounded-md"
              >
                Services
              </a>
              <button
                onClick={() => setContactModalOpen(true)}
                className="block px-3 py-2 text-gray hover:bg-light-blue rounded-md"
              >
                Contact
              </button>
              <div className="flex flex-col space-y-2 px-3 py-2">
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="w-full px-4 py-2 text-dark-blue border border-dark-blue rounded-lg hover:bg-light-blue"
                >
                  Connexion
                </button>
                <button
                  onClick={() => setSignupModalOpen(true)}
                  className="w-full px-4 py-2 bg-medium-blue text-white rounded-lg hover:bg-dark-blue"
                >
                  Inscription
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Modales */}
      <Modal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)}>
        <LoginScreen
          onClose={() => setLoginModalOpen(false)}
          onSignupClick={() => {
            setLoginModalOpen(false);
            setSignupModalOpen(true);
          }}
        />
      </Modal>

      <Modal isOpen={isSignupModalOpen} onClose={() => setSignupModalOpen(false)}>
        <SignupScreen onClose={() => setSignupModalOpen(false)} />
      </Modal>

      <Modal isOpen={isContactModalOpen} onClose={() => setContactModalOpen(false)}>
        <ContactForm onClose={() => setContactModalOpen(false)} />
      </Modal>

      <Modal isOpen={isSignupModalOpen} onClose={() => setSignupModalOpen(false)}>
        <SignupScreen
          onClose={() => setSignupModalOpen(false)}
          onLoginClick={() => {
            setSignupModalOpen(false);
            setLoginModalOpen(true);
          }}
        />
      </Modal>


      {/* Hero Section */}
      <section className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-dark-blue mb-6">
                Réservation Simplifiée
              </h1>
              <p className="text-xl text-gray mb-8">
                Bienvenue sur FindMyPro, votre application de gestion de rendez-vous avec des
                prestataires de services.
              </p>
              <button
                onClick={() => setSignupModalOpen(true)}
                className="px-8 py-4 bg-medium-blue text-white rounded-lg hover:bg-dark-blue transition shadow-lg"
              >
                Commencer
              </button>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-light-blue rounded-lg transform rotate-6"></div>
              <img src={booking} alt="Réservation" className="relative rounded-lg shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 md:order-1">
              <div className="absolute -inset-4 bg-light-blue rounded-lg transform -rotate-6"></div>
              <img src={mecanic} alt="app interface" className="relative rounded-lg shadow-xl" />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl font-bold text-dark-blue mb-6">À propos de FindMyPro</h2>
              <p className="text-xl text-gray mb-8">
                FindMyPro est la solution ultime pour organiser vos rendez-vous avec des
                prestataires de services. Notre application est conçue pour simplifier votre
                processus de planification et améliorer votre expérience globale.
              </p>
              <button className="px-6 py-3 bg-medium-blue text-white rounded-lg hover:bg-dark-blue transition shadow-lg">
                En savoir plus
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-dark-blue mb-12">Témoignages</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-light-blue rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-dark-blue">SJ</span>
                </div>
                <div className="ml-4">
                  <h5 className="text-xl font-semibold">Sarah Johnson</h5>
                  <p className="text-gray">Cliente satisfaite</p>
                </div>
              </div>
              <p className="text-gray italic">
                "Je recommande vivement FindMyPro ! C'est un véritable changement dans la façon
                dont je gère mes réservations de services."
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-light-blue rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-dark-blue">JS</span>
                </div>
                <div className="ml-4">
                  <h5 className="text-xl font-semibold">John Smith</h5>
                  <p className="text-gray">Client fidèle</p>
                </div>
              </div>
              <p className="text-gray italic">
                "Une excellente plateforme qui a transformé ma façon de gérer les rendez-vous. Je
                ne pourrais pas être plus satisfait !"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-blue text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">FindMyPro</h3>
              <p className="text-gray-400">
                Votre solution de gestion de rendez-vous professionnels
              </p>
            </div>
            <div>
              <h5 className="text-gray-400 font-bold mb-4">Contact</h5>
              <p className="text-gray-400 mb-2">123-456-7890</p>
              <p className="text-gray-400">info@findmypro.com</p>
            </div>
            <div>
              <h5 className="text-gray-400 font-bold mb-4">Restez connecté</h5>
              <button className="px-6 py-3 bg-medium-blue text-white rounded-lg hover:bg-dark-blue transition">
                S'abonner
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomeScreen;