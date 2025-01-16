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
import LanguageSwitcher from '../../locales/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const WelcomeScreen = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setSignupModalOpen] = useState(false);
  const [isContactModalOpen, setContactModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { t } = useTranslation();

  const handleSectionClick = (section) => {
    setActiveSection(section);
    if (isMobileMenuOpen) setMobileMenuOpen(false); // Fermer le menu mobile après un clic
  };

  const navLinkStyles = (section) => `
    cursor-pointer
    block px-3 py-2 
    text-gray 
    hover:text-dark-blue 
    hover:bg-light-blue 
    rounded-md 
    transition-all
    ${activeSection === section ? "bg-light-blue text-dark-blue font-medium" : ""}
  `;

  const buttonStyles = "px-4 py-2 rounded-lg transition cursor-pointer";

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
              <a
                href="#"
                onClick={() => handleSectionClick("home")}
                className={navLinkStyles("home")}
              >
                {t('navbar.home')}
              </a>
              <a
                href="#about"
                onClick={() => handleSectionClick("about")}
                className={navLinkStyles("about")}
              >
                {t('navbar.about')}
              </a>
              <a
                href="#services"
                onClick={() => handleSectionClick("services")}
                className={navLinkStyles("services")}
              >
                {t('navbar.services')}
              </a>
              <button
                onClick={() => {
                  setContactModalOpen(true);
                  handleSectionClick("contact");
                }}
                className={`${buttonStyles} text-dark-blue border border-dark-blue hover:bg-light-blue`}
              >
                {t('navbar.contact')}
              </button>

              <LanguageSwitcher />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLoginModalOpen(true);
                  handleSectionClick("login");
                }}
                className={`${buttonStyles} text-dark-blue border border-dark-blue hover:bg-light-blue`}
              >
                {t('navbar.login')}
              </button>

              <button
                onClick={() => {
                  setSignupModalOpen(true);
                  handleSectionClick("signup");
                }}
                className={`${buttonStyles} bg-medium-blue text-white hover:bg-dark-blue`}
              >
                {t('navbar.signup')}
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray" />
              ) : (
                <Menu className="h-6 w-6 text-gray" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="#"
                onClick={() => handleSectionClick("home")}
                className={navLinkStyles("home")}
              >
                {t('navbar.home')}
              </a>
              <a
                href="#about"
                onClick={() => handleSectionClick("about")}
                className={navLinkStyles("about")}
              >
                {t('navbar.about')}
              </a>
              <a
                href="#services"
                onClick={() => handleSectionClick("services")}
                className={navLinkStyles("services")}
              >
                {t('navbar.services')}
              </a>
              <button
                onClick={() => {
                  setContactModalOpen(true);
                  handleSectionClick("contact");
                }}
                className={navLinkStyles("contact")}
              >
                {t('navbar.contact')}
              </button>

              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>

              <div className="flex flex-col space-y-2 px-3 py-2">
                <button
                  onClick={() => {
                    setLoginModalOpen(true);
                    handleSectionClick("login");
                  }}
                  className={`w-full ${buttonStyles} text-dark-blue border border-dark-blue hover:bg-light-blue`}
                >
                  {t('navbar.login')}
                </button>
                <button
                  onClick={() => {
                    setSignupModalOpen(true);
                    handleSectionClick("signup");
                  }}
                  className={`w-full ${buttonStyles} bg-medium-blue text-white hover:bg-dark-blue`}
                >
                  {t('navbar.signup')}
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
        <SignupScreen
          onClose={() => setSignupModalOpen(false)}
          onLoginClick={() => {
            setSignupModalOpen(false);
            setLoginModalOpen(true);
          }}
        />
      </Modal>

      <Modal isOpen={isContactModalOpen} onClose={() => setContactModalOpen(false)}>
        <ContactForm onClose={() => setContactModalOpen(false)} />
      </Modal>

      {/* Hero Section */}
      <section className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-dark-blue mb-6">
                {t('hero.title')}
              </h1>
              <p className="text-lg sm:text-xl text-gray mb-8">
                {t('hero.description')}
              </p>
              <button
                onClick={() => setSignupModalOpen(true)}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-medium-blue text-white rounded-lg hover:bg-dark-blue transition shadow-lg"
              >
                {t('hero.cta')}
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
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 md:order-1">
              <div className="absolute -inset-4 bg-light-blue rounded-lg transform -rotate-6"></div>
              <img src={mecanic} alt="app interface" className="relative rounded-lg shadow-xl" />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-dark-blue mb-6">
                {t('about.title')}
              </h2>
              <p className="text-lg sm:text-xl text-gray mb-8">
                {t('about.description')}
              </p>
              <button className="px-6 py-3 bg-medium-blue text-white rounded-lg hover:bg-dark-blue transition shadow-lg">
                {t('about.cta')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-dark-blue mb-12">
            {t('testimonials.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-light-blue rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-dark-blue">SJ</span>
                </div>
                <div className="ml-4">
                  <h5 className="text-xl font-semibold">
                    {t('testimonials.testimonial1.name')}
                  </h5>
                  <p className="text-gray">
                    {t('testimonials.testimonial1.role')}
                  </p>
                </div>
              </div>
              <p className="text-gray italic">
                {t('testimonials.testimonial1.quote')}
              </p>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-light-blue rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-dark-blue">JS</span>
                </div>
                <div className="ml-4">
                  <h5 className="text-xl font-semibold">
                    {t('testimonials.testimonial2.name')}
                  </h5>
                  <p className="text-gray">
                    {t('testimonials.testimonial2.role')}
                  </p>
                </div>
              </div>
              <p className="text-gray italic">
                {t('testimonials.testimonial2.quote')}
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
              <h3 className="text-2xl font-bold mb-4">
                {t('footer.company')}
              </h3>
              <p className="text-gray-400">
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h5 className="text-gray-400 font-bold mb-4">
                {t('footer.contact')}
              </h5>
              <p className="text-gray-400 mb-2">
                {t('footer.phone')}
              </p>
              <p className="text-gray-400">
                {t('footer.email')}
              </p>
            </div>
            <div>
              <h5 className="text-gray-400 font-bold mb-4">
                {t('footer.subscribe')}
              </h5>
              <button className="px-6 py-3 bg-medium-blue text-white rounded-lg hover:bg-dark-blue transition">
                {t('footer.subscribe')}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomeScreen;