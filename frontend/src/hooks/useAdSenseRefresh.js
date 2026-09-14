import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useAdSenseRefresh = () => {
  const location = useLocation();

  useEffect(() => {
    // Small delay to let the new DOM render
    const timer = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        // Silently ignore — happens when ads already filled
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);
};

export default useAdSenseRefresh;