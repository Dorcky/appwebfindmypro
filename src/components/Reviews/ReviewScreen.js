import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as fasStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';
import { onAuthStateChanged } from 'firebase/auth'; // Importez onAuthStateChanged

const Rating = ({ rating, onRatingChange }) => {
  return (
    <div className="flex mb-2">
      {[...Array(5)].map((_, i) => (
        <FontAwesomeIcon
          key={i}
          icon={i < rating ? fasStar : farStar}
          className={`text-lg cursor-pointer ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
          onClick={() => onRatingChange(i + 1)}
        />
      ))}
    </div>
  );
};

const Review = ({ name, rating, comment }) => (
  <div className="bg-white rounded-lg shadow-sm p-4 mb-4 transition-all duration-300 hover:shadow-md">
    <div className="flex justify-between items-center mb-2">
      <h6 className="font-semibold text-[#334D66]">{name}</h6>
      <Rating rating={rating} onRatingChange={() => {}} />
    </div>
    <p className="text-[#808080] text-sm">{comment}</p>
  </div>
);

const ReviewScreen = () => {
  const { serviceProviderId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [userReview, setUserReview] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null); // Ajoutez un état pour l'utilisateur

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Utilisateur authentifié :", user);
        setUser(user); // Mettez à jour l'état de l'utilisateur
        fetchReviews(user.uid); // Récupérez les avis de l'utilisateur
      } else {
        console.log('Aucun utilisateur authentifié');
        setUser(null); // Réinitialisez l'état de l'utilisateur
        setError("Utilisateur non authentifié.");
        setLoading(false);
      }
    });

    // Nettoyez l'écouteur lors du démontage du composant
    return () => unsubscribe();
  }, [auth]);

  const fetchReviews = async (userId) => {
    if (!serviceProviderId) {
      setError('ID du prestataire manquant.');
      setLoading(false);
      return;
    }

    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('service_provider_id', '==', serviceProviderId)
      );

      const querySnapshot = await getDocs(reviewsQuery);
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setReviews(reviewsData);

      const userReview = reviewsData.find(review => review.user_id === userId);
      if (userReview) {
        setUserReview(userReview);
        setRating(userReview.rating);
        setComment(userReview.comment);
        setReviewerName(userReview.reviewer_name);
      }
    } catch (err) {
      setError("Erreur lors de la récupération des avis.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("Utilisateur non authentifié.");
      return;
    }

    const reviewData = {
      comment,
      created_at: new Date(),
      rating,
      reviewer_name: reviewerName || user.displayName,
      service_provider_id: serviceProviderId,
      user_id: user.uid,
    };

    try {
      if (userReview) {
        await updateDoc(doc(db, 'reviews', userReview.id), reviewData);
      } else {
        await addDoc(collection(db, 'reviews'), reviewData);
      }

      navigate(`/service-provider-profile/${serviceProviderId}`);
    } catch (err) {
      setError("Erreur lors de la soumission de votre avis.");
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#D9EDF7] to-[#F0F8FF] py-10">
      <div className="containerReview mx-auto max-w-5xl bg-white bg-opacity-90 rounded-3xl shadow-xl overflow-hidden mt-20">

        <div className="p-8">
          <h1 className="text-center text-4xl font-bold mb-4 text-[#334D66]">FindMyPro</h1>
          <p className="text-center mb-8 text-[#6693BF]">Trouvez et réservez des prestataires de services locaux de confiance pour tous vos besoins.</p>
        
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3">
              <div className="bg-[#F7FBFE] rounded-2xl p-6">
                <h5 className="text-2xl font-bold mb-6 text-[#6693BF]">Avis des clients</h5>
                {reviews.length === 0 ? (
                  <p>Aucun avis n'a été laissé pour ce prestataire.</p>
                ) : (
                  reviews.map((review) => (
                    <Review key={review.id} name={review.reviewer_name} rating={review.rating} comment={review.comment} />
                  ))
                )}
              </div>
            </div>
          
            <div className="lg:w-1/3">
              <div className="bg-[#F7FBFE] rounded-2xl p-6">
                <h5 className="text-2xl font-bold mb-6 text-[#6693BF]">{userReview ? 'Modifier votre avis' : 'Laisser un commentaire'}</h5>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[#334D66]">Nom</label>
                    <input 
                      type="text" 
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      required 
                      className="w-full border-2 border-[#D1E3F0] rounded-lg p-2 focus:border-[#6693BF] focus:outline-none transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[#334D66]">Note</label>
                    <Rating rating={rating} onRatingChange={setRating} />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-[#334D66]">Commentaire</label>
                    <textarea 
                      rows={3} 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required 
                      className="w-full border-2 border-[#D1E3F0] rounded-lg p-2 focus:border-[#6693BF] focus:outline-none transition-colors"
                    ></textarea>
                  </div>
                  <button type="submit" className="w-full bg-[#6693BF] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#334D66] transition-colors duration-300">
                    {userReview ? 'Mettre à jour' : 'Envoyer'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewScreen;