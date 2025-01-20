import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';

const MyUserReviewView = () => {
  // Récupérer serviceProviderId depuis l'URL
  const { serviceProviderId } = useParams();
  const auth = getAuth();
  
  const [reviews, setReviews] = useState([]);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  // Gérer l'authentification
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setError("Veuillez vous connecter pour voir les avis");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const loadReviews = async () => {
      if (!userId || !serviceProviderId) return;

      console.log('🔄 Début du chargement des avis...', {
        serviceProviderId,
        userId,
        timestamp: new Date().toISOString()
      });

      try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(
          reviewsRef,
          where('service_provider_id', '==', serviceProviderId)
        );

        console.log('📤 Envoi de la requête Firestore...', {
          collection: 'reviews',
          filter: `service_provider_id == ${serviceProviderId}`
        });

        const querySnapshot = await getDocs(q);
        
        const reviewsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            created_at: data.created_at?.toDate()
          };
        });

        // Trier les avis par date de création (plus récents en premier)
        reviewsData.sort((a, b) => b.created_at - a.created_at);

        setReviews(reviewsData);
        setError(null);

      } catch (error) {
        console.error('❌ Erreur lors du chargement des avis:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [serviceProviderId, userId]);

  const handleResponseChange = (event) => {
    setResponse(event.target.value);
  };

  const handleSubmitResponse = async (reviewId) => {
    if (!response.trim()) {
      alert("La réponse ne peut pas être vide.");
      return;
    }

    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const reviewSnapshot = await getDoc(reviewRef);

      if (!reviewSnapshot.exists()) {
        throw new Error("Cet avis n'existe plus.");
      }

      if (reviewSnapshot.data().response) {
        alert("Vous avez déjà répondu à cet avis.");
        return;
      }

      await updateDoc(reviewRef, {
        response: response.trim(),
        response_date: Timestamp.now()
      });

      // Mettre à jour l'état local
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review.id === reviewId 
            ? { ...review, response: response.trim() } 
            : review
        )
      );
      
      alert("Réponse ajoutée avec succès!");
      setResponse('');

    } catch (error) {
      alert("Erreur lors de l'ajout de la réponse: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Chargement des avis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 border border-red-300 rounded bg-red-50">
        Erreur: {error}
      </div>
    );
  }

  return (
    <div className="my-reviews-container max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mes Avis</h1>

      {reviews.length === 0 ? (
        <p className="text-gray-600 text-center py-8">
          Aucun avis trouvé pour ce fournisseur de service.
        </p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-semibold text-lg">
                    {review.reviewer_name || "Anonyme"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {review.created_at?.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                <div className="text-yellow-400 text-xl">
                  {"★".repeat(review.rating)}
                  <span className="text-gray-300">
                    {"★".repeat(5 - review.rating)}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-700">{review.comment}</p>
              </div>

              <div>
                {review.response ? (
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="font-semibold mb-2">Votre réponse:</div>
                    <p className="text-gray-600">{review.response}</p>
                  </div>
                ) : (
                  <div>
                    {userId === serviceProviderId && (
                      <div className="space-y-3">
                        <textarea
                          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Répondre à l'avis"
                          rows="3"
                          value={response}
                          onChange={handleResponseChange}
                        />
                        <button
                          className="w-full bg-[#6693BF] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#334D66] transition-colors duration-300"
                          onClick={() => handleSubmitResponse(review.id)}
                        >
                          Répondre
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyUserReviewView;