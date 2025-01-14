import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import PropTypes from 'prop-types';

const ContactForm = ({ onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false); // État pour gérer le message de succès

  const handleSubmit = (e) => {
    e.preventDefault();

    // Appel à la fonction pour envoyer l'email
    sendEmail();
  };

  const sendEmail = () => {
    // Récupération des variables d'environnement
    const serviceID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    const templateID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
    const userID = process.env.REACT_APP_EMAILJS_USER_ID;

    // Envoi de l'e-mail via EmailJS
    emailjs.send(serviceID, templateID, {
      from_name: name,
      from_email: email,
      phone, // Ajout du numéro de téléphone dans le courriel
      message,
    }, userID)
      .then(response => {
        console.log('E-mail envoyé!', response);
        // Afficher le message de succès
        setIsSuccess(true);
        // Réinitialisation des champs du formulaire
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
        // Fermeture du modal après 3 secondes
        setTimeout(() => {
          onClose();
        }, 3000);
      })
      .catch(error => {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
      });
  };

  return (
    <div className="bg-[rgb(217,237,247)] min-h-[800px] p-12 pt-20 w-full flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-[rgb(51,77,102)] mb-6">Contact Us</h1>
          {isSuccess && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
              Votre message a été envoyé avec succès !
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-lg font-medium text-[rgb(51,77,102)]">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[rgb(102,148,191)] focus:ring focus:ring-[rgb(102,148,191)] focus:ring-opacity-50"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-lg font-medium text-[rgb(51,77,102)]">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[rgb(102,148,191)] focus:ring focus:ring-[rgb(102,148,191)] focus:ring-opacity-50"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-lg font-medium text-[rgb(51,77,102)]">Phone</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[rgb(102,148,191)] focus:ring focus:ring-[rgb(102,148,191)] focus:ring-opacity-50"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-lg font-medium text-[rgb(51,77,102)]">Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[rgb(102,148,191)] focus:ring focus:ring-[rgb(102,148,191)] focus:ring-opacity-50"
                rows="4"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-6 bg-[rgb(102,148,191)] text-white rounded-full hover:bg-[rgb(51,77,102)] transition-colors text-xl font-semibold shadow-md"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Validation des props
ContactForm.propTypes = {
  onClose: PropTypes.func.isRequired,  // onClose est une fonction obligatoire
};

export default ContactForm;