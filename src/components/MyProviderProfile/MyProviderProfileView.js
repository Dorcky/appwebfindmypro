import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import { Star, StarHalf, Calendar, MessageSquare, Edit } from 'lucide-react';
import './MyProviderProfileView.css';
import { useTranslation } from 'react-i18next';

const ProfileHeaderView = React.memo(({ serviceProvider }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleMessageClick = () => {
    if (serviceProvider && serviceProvider.id) {
      navigate(`/chat-app/${serviceProvider.id}`);
    } else {
      console.error('Service provider ID is missing');
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-start gap-6">
      <div className="relative">
        <img
          src={serviceProvider.profileImageURL}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border-4 border-[rgb(102,148,191)]"
          onError={(e) => {
            console.log('Profile image failed to load:', e);
            e.target.src = 'path/to/fallback/image.jpg';
          }}
        />
      </div>
      <div className="flex-1">
        <h1 className="text-3xl font-semibold text-[rgb(51,77,102)]">{serviceProvider.name}</h1>
        <p className="text-gray-500 mt-2">{serviceProvider.description}</p>
      </div>
      <button
        onClick={handleMessageClick}
        className="w-full md:w-auto bg-[rgb(217,237,247)] hover:bg-[rgb(194,219,233)] text-[rgb(51,77,102)] px-4 py-3 rounded-lg text-lg flex items-center justify-center"
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        {t('providerProfileView.sendMessage')}
      </button>
    </div>
  );
});

ProfileHeaderView.propTypes = {
  serviceProvider: PropTypes.shape({
    id: PropTypes.string,
    profileImageURL: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
};

ProfileHeaderView.displayName = 'ProfileHeaderView';

const RatingView = React.memo(({ averageRating }) => {
  const { t } = useTranslation();

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < Math.floor(rating)) {
        stars.push(<Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
      } else if (i === Math.floor(rating) && rating % 1 !== 0) {
        stars.push(<StarHalf key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="w-5 h-5 text-yellow-400" />);
      }
    }
    return stars;
  };

  return (
    <div className="mt-3">
      <div className="flex gap-1">{renderStars(averageRating)}</div>
      <p className="text-gray-500 mt-1">{t('providerProfileView.averageRating')}: {averageRating.toFixed(1)}/5</p>
    </div>
  );
});

RatingView.propTypes = {
  averageRating: PropTypes.number.isRequired,
};

RatingView.displayName = 'RatingView';

const ProviderInfoView = React.memo(({ serviceProvider }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-4">
      <p className="text-gray-700"><strong>{t('providerProfileView.service')}:</strong> {serviceProvider.serviceType}</p>
      <p className="text-gray-700"><strong>{t('providerProfileView.email')}:</strong> {serviceProvider.email}</p>
      <p className="text-gray-700"><strong>{t('providerProfileView.phoneNumber')}:</strong> {serviceProvider.phoneNumber}</p>
      <p className="text-gray-700"><strong>{t('providerProfileView.address')}:</strong> {serviceProvider.address}</p>
      <p className="text-gray-700"><strong>{t('providerProfileView.hourlyRate')}:</strong> {serviceProvider.hourlyRate} €/h</p>
      <p className="text-gray-700"><strong>{t('providerProfileView.website')}:</strong> {serviceProvider.website || 'N/A'}</p>
      <p className="text-gray-700"><strong>{t('providerProfileView.description')}:</strong> {serviceProvider.description}</p>
    </div>
  );
});

ProviderInfoView.propTypes = {
  serviceProvider: PropTypes.shape({
    serviceType: PropTypes.string,
    email: PropTypes.string,
    phoneNumber: PropTypes.string,
    address: PropTypes.string,
    hourlyRate: PropTypes.number,
    website: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
};

ProviderInfoView.displayName = 'ProviderInfoView';

const ReviewsViewSection = React.memo(({ reviews, serviceProviderId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < Math.floor(rating)) {
        stars.push(<Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
      } else if (i === Math.floor(rating) && rating % 1 !== 0) {
        stars.push(<StarHalf key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="w-5 h-5 text-yellow-400" />);
      }
    }
    return stars;
  };

  const handleViewAllReviews = () => {
    navigate(`/review/${serviceProviderId}`);
  };

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-[rgb(51,77,102)] border-b-2 border-[rgb(102,148,191)] pb-2 mb-4">
        {t('providerProfileView.reviews')}
      </h2>
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((item, index) => (
            <div key={item.id || index} className="p-4 rounded-lg bg-[rgb(240,248,255)] border border-[rgb(217,237,247)]">
              <p className="text-gray-700 mb-2">{item.comment}</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">- {item.reviewer_name}</span>
                <div className="flex gap-1">
                  {renderStars(item.rating)}
                </div>
              </div>
              {item.response && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-[rgb(51,77,102)]">{t('providerProfileView.writeReview')}:</p>
                  <p className="text-gray-600">{item.response}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-600">{t('providerProfileView.noReviews')}</p>
        )}
      </div>
      <button
        onClick={handleViewAllReviews}
        className="mt-4 w-full bg-[rgb(102,148,191)] hover:bg-[rgb(81,118,153)] text-white py-3 rounded-lg text-lg flex items-center justify-center"
      >
        {t('providerProfileView.viewAllReviews')}
      </button>
    </section>
  );
});

ReviewsViewSection.propTypes = {
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      reviewer_name: PropTypes.string,
      rating: PropTypes.number,
      comment: PropTypes.string,
      response: PropTypes.string,
    })
  ).isRequired,
  serviceProviderId: PropTypes.string.isRequired,
};

ReviewsViewSection.displayName = 'ReviewsViewSection';

const AvailabilityButtonView = React.memo(({ serviceProviderId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <button
      className="w-full md:w-auto bg-[rgb(102,148,191)] hover:bg-[rgb(81,118,153)] text-white px-4 py-3 rounded-lg text-lg flex items-center justify-center"
      onClick={() => navigate(`/service-provider-availability/${serviceProviderId}`)}
    >
      <Calendar className="w-4 h-4 mr-2" />
      {t('providerProfileView.viewAvailability')}
    </button>
  );
});

AvailabilityButtonView.propTypes = {
  serviceProviderId: PropTypes.string.isRequired,
};

AvailabilityButtonView.displayName = 'AvailabilityButtonView';

const MyProviderProfileView = () => {
  const { t } = useTranslation();
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
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('service_provider_id', '==', serviceProviderId),
        orderBy('created_at', 'desc'),
        limit(2)
      );

      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
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
            id: providerDoc.id,
            ...providerDoc.data(),
          });
          await fetchReviews();
        } else {
          setError(t('providerProfileView.noProviderFound'));
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

  const handleWriteReviewClick = () => {
    navigate(`/review/${serviceProviderId}`);
  };

  if (isLoading) return <div className="loading">{t('providerProfileView.loading')}</div>;
  if (error) return <div className="error">{t('providerProfileView.error', { error })}</div>;
  if (!serviceProvider) return <div>{t('providerProfileView.noProviderFound')}</div>;

  return (
    <div className="min-h-screen bg-[rgb(217,237,247)]">
      <header className="w-full bg-[rgb(102,148,191)] text-white p-4 text-center text-2xl">
        {t('providerProfileView.header')}
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="mt-8 bg-white shadow-lg p-4 rounded-lg">
          <ProfileHeaderView serviceProvider={serviceProvider} />
          <RatingView averageRating={averageRating} />
          <ProviderInfoView serviceProvider={serviceProvider} />
          <ReviewsViewSection reviews={reviews} serviceProviderId={serviceProviderId} />
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <AvailabilityButtonView serviceProviderId={serviceProviderId} />
            <button
              className="w-full md:w-auto bg-[rgb(217,237,247)] hover:bg-[rgb(194,219,233)] text-[rgb(51,77,102)]  px-4 py-3 rounded-lg text-lg flex items-center justify-center"
              onClick={handleWriteReviewClick}
            >
              <Edit className="w-4 h-4 mr-2" />
              {t('providerProfileView.writeReview')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyProviderProfileView;
