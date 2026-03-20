import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RequestForm from '../components/Requests/RequestForm';
import { volunteerAPI } from '../services/api';

const RequestPage = () => {
  const { volunteerId } = useParams();
  const navigate = useNavigate();
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVolunteer();
  }, [volunteerId]);

  const fetchVolunteer = async () => {
    try {
      const response = await volunteerAPI.getById(volunteerId);
      setVolunteer(response.data);
    } catch (error) {
      console.error('Error fetching volunteer:', error);
      navigate('/discovery');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <RequestForm volunteer={volunteer} />;
};

export default RequestPage;