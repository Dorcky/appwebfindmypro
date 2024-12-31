import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import './ReviewScreen.css';

const ReviewScreen = () => {
  const { serviceProviderId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExistingReview = async () => {
      if (!auth.currentUser) return;

      try {
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('service_provider_id', '==', serviceProviderId),
          where('user_id', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(reviewsQuery);

        if (!querySnapshot.empty) {
          const reviewData = querySnapshot.docs[0].data();
          setExistingReview(querySnapshot.docs[0].id);
          setRating(reviewData.rating);
          setComment(reviewData.comment);
        }
      } catch (err) {
        setError('Error fetching your review.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingReview();
  }, [serviceProviderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const reviewData = {
      comment,
      created_at: new Date(),
      rating,
      reviewer_name: auth.currentUser.displayName,
      service_provider_id: serviceProviderId,
      user_id: auth.currentUser.uid,
    };

    try {
      if (existingReview) {
        // Mise à jour de l'avis existant
        await updateDoc(doc(db, 'reviews', existingReview), reviewData);
      } else {
        // Création d'un nouvel avis
        await addDoc(collection(db, 'reviews'), reviewData);
      }

      navigate(`/service-provider-profile/${serviceProviderId}`); // Rediriger vers le profil du prestataire
    } catch (err) {
      setError('Error submitting your review.');
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="reviewScreenContainer">
      <h2>{existingReview ? 'Modifier votre avis' : 'Laisser un avis'}</h2>
      <form onSubmit={handleSubmit} className="reviewForm">
        <div className="ratingSection">
          <label>Note: </label>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${star <= rating ? 'selected' : ''}`}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Écrivez un commentaire..."
          rows={4}
          required
        ></textarea>

        <button type="submit" className="submitButton">
          {existingReview ? 'Mettre à jour' : 'Soumettre'}
        </button>
      </form>
    </div>
  );
};

export default ReviewScreen;
