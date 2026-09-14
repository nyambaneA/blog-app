// src/components/AdSense.js
import React, { useEffect, useRef } from 'react';

const AdSense = ({ 
  adSlot, 
  adFormat = 'auto', 
  fullWidthResponsive = true,
  style = {},
  className = '',
}) => {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Prevent double-push in React 18 Strict Mode
    if (pushed.current) return;
    
    try {
      // Make sure the adsbygoogle array exists
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (err) {
      console.error('AdSense push error:', err);
    }
  }, []);

  return (
    <div className={className} style={{ textAlign: 'center', margin: '20px 0', ...style }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-6053381914281982"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
};

export default AdSense;