import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FloatingNotification.css';

const FloatingNotification = ({ message, imageSrc, delay = 2000, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
      navigate('/workshop');
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, navigate, onClose]);

  return (
    <div className="floating-notification">
      {imageSrc && <img src={imageSrc} alt="Obvestilo" />}
      <span>{message}</span>
    </div>
  );
};

export default FloatingNotification;
