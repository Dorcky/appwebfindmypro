import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import './MyProviderProfileView.css';

const ProfileHeaderView = React.memo(({ serviceProvider }) => {
  const navigate = useNavigate();
  
  const handleMessageClick = () => {
    if (serviceProvider && serviceProvider.id) {
      navigate(`/chat-app/${serviceProvider.id}`);
    } else {
      console.error("Service provider ID is missing");
    }
  };

  return (
    <div className="header">
      <div className="profileImageContainer">
        <img
          src={serviceProvider.profileImageURL}
          alt="Profile"
          className="profileImage"
          onError={(e) => {
            console.log('Profile image failed to load:', e);
            e.target.src = 'path/to/fallback/image.jpg';
          }}
        />
      </div>
      <button onClick={handleMessageClick} className="messageButton">
        Message
      </button>
    </div>
  );
});

const RatingView = React.memo(({ averageRating }) => {
  const stars = Array.from({ length: 5 }, (_, i) => i < averageRating ? '★' : '☆');
  return (
    <div className="ratingView">
      <p className="ratingText">Average Rating: {averageRating.toFixed(1)}/5</p>
      <p className="stars">{stars.join('')}</p>
    </div>
  );
});

const ProviderInfoView = React.memo(({ serviceProvider }) => (
  <div className="infoView">
    <p className="infoText">Name: {serviceProvider.name}</p>
    <p className="infoText">Service: {serviceProvider.serviceType}</p>
    <p className="infoText">Email: {serviceProvider.email}</p>
    <p className="infoText">Phone: {serviceProvider.phoneNumber}</p>
    <p className="infoText">Address: {serviceProvider.address}</p>
    <p className="infoText">Description: {serviceProvider.description}</p>
    <p className="infoText">Hourly Rate: {serviceProvider.hourlyRate}</p>
    <p className="infoText">Website: {serviceProvider.website || 'N/A'}</p>
  </div>
));

const ReviewsViewSection = React.memo(({ reviews }) => (
  <div className="reviewsSection">
    <h3 className="reviewsTitle">Reviews:</h3>
    <div>
      {reviews.length > 0 ? (
        reviews.map((item, index) => (
          <div key={item.id || index} className="reviewItem">
            <p className="reviewName">{item.reviewer_name}</p>
            <p className="stars">
              {Array.from({ length: 5 }, (_, i) => i < item.rating ? '★' : '☆').join('')}
            </p>
            <p className="reviewText">{item.comment}</p>
            {item.response && (
              <div>
                <p className="responseTitle">Response from provider:</p>
                <p className="reviewText">{item.response}</p>
              </div>
            )}
          </div>
        ))
      ) : (
        <p>No reviews yet</p>
      )}
    </div>
  </div>
));

const AvailabilityButtonView = React.memo(({ serviceProviderId }) => {
  const navigate = useNavigate();
  return (
    <button
      className="availabilityButton"
      onClick={() => navigate(`/service-provider-availability/${serviceProviderId}`)}
    >
      View Availability
    </button>
  );
});

const MyProviderProfileView = () => {
    const { serviceProviderId } = useParams();
    const navigate = useNavigate();
    const [serviceProvider, setServiceProvider] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
  const fetchReviews = useCallback(async () => {
    if (!serviceProviderId) return;

    try {
      // Récupérer les 2 derniers avis
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('service_provider_id', '==', serviceProviderId),
        orderBy('created_at', 'desc'),
        limit(2)
      );
      
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setReviews(reviewsData);
      
      if (reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(totalRating / reviewsData.length);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.message);
    }
  }, [serviceProviderId]);

  useEffect(() => {
    const fetchServiceProviderData = async () => {
      if (!serviceProviderId) {
        setError('No provider ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const providerDocRef = doc(db, 'service_providers', serviceProviderId);
        const providerDoc = await getDoc(providerDocRef);
        
        if (providerDoc.exists()) {
          setServiceProvider({
            id: providerDoc.id,  // Include the document ID
            ...providerDoc.data()
          });
          await fetchReviews();
        } else {
          setError('Provider not found');
        }
      } catch (err) {
        console.error('Error fetching provider data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceProviderData();
  }, [serviceProviderId, fetchReviews]);

  // Bouton pour rediriger vers la page de création/modification de l'avis
  const handleWriteReviewClick = () => {
    navigate(`/review/${serviceProviderId}`);
  };

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!serviceProvider) return <div>No provider found.</div>;

  return (
    <div className="container">
      <ProfileHeaderView serviceProvider={serviceProvider} />
      <RatingView averageRating={averageRating} />
      <ProviderInfoView serviceProvider={serviceProvider} />
      <ReviewsViewSection reviews={reviews} />
      <AvailabilityButtonView serviceProviderId={serviceProviderId} />
      <button className="writeReviewButton" onClick={handleWriteReviewClick}>
        Écrire un commentaire
      </button>
    </div>
  );
};


export default MyProviderProfileView;
