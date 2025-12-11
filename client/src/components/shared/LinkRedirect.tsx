import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWhitelabel } from '../../contexts/WhitelabelContext';

const LinkRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = useWhitelabel();

  useEffect(() => {
    const currentPath = location.pathname;

    // Check if current path has a redirect mapping
    if (config.redirectMappings[currentPath]) {
      const redirectUrl = config.redirectMappings[currentPath];

      // If it's an external URL, redirect to external site
      if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
        window.location.href = redirectUrl;
      } else {
        // If it's an internal path, navigate within the app
        navigate(redirectUrl);
      }
    }
  }, [location.pathname, config.redirectMappings, navigate]);

  // This component doesn't render anything
  return null;
};

export default LinkRedirect;