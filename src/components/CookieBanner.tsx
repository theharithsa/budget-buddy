import React, { useState, useEffect } from 'react';
import { X, Cookie, Shield, Eye } from 'lucide-react';
import { Button } from './ui/button';

interface CookieBannerProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onAccept, onDecline }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('finbuddy-cookie-consent');
    if (!cookieConsent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('finbuddy-cookie-consent', 'accepted');
    localStorage.setItem('finbuddy-cookie-consent-date', new Date().toISOString());
    setIsVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    localStorage.setItem('finbuddy-cookie-consent', 'declined');
    localStorage.setItem('finbuddy-cookie-consent-date', new Date().toISOString());
    setIsVisible(false);
    onDecline?.();
  };

  const handleDismiss = () => {
    // User dismissed without choosing - don't set consent, will show again next time
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Cookie Icon and Main Content */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="text-blue-500 mt-1 flex-shrink-0">
              <Cookie size={24} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-gray-800 text-sm">🍪 Cookie Notice</h3>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  {isExpanded ? 'Show Less' : 'Learn More'}
                </button>
              </div>
              
              <div className="text-gray-600 text-sm">
                <p className="mb-2">
                  FinBuddy uses cookies and similar technologies for essential functionality and performance monitoring. 
                  <strong className="text-gray-800"> We don't use your personal data to train AI models or sell to third parties.</strong>
                </p>
                
                {isExpanded && (
                  <div className="bg-gray-50 p-3 rounded-lg mt-3 space-y-3 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-start gap-2">
                        <Shield className="text-green-500 mt-0.5 flex-shrink-0" size={14} />
                        <div>
                          <h4 className="font-semibold text-green-700">Essential Cookies</h4>
                          <p className="text-gray-600">Authentication, security, and app functionality. Required for service.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Eye className="text-blue-500 mt-0.5 flex-shrink-0" size={14} />
                        <div>
                          <h4 className="font-semibold text-blue-700">Performance Monitoring</h4>
                          <p className="text-gray-600">Dynatrace analytics for app performance and user experience improvements.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Cookie className="text-purple-500 mt-0.5 flex-shrink-0" size={14} />
                        <div>
                          <h4 className="font-semibold text-purple-700">Your Preferences</h4>
                          <p className="text-gray-600">Theme settings, view modes, and app configurations.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-1">🔒 Privacy Commitment</h4>
                          <ul className="text-gray-600 space-y-1">
                            <li>• Never sell your personal data</li>
                            <li>• No AI training with your information</li>
                            <li>• Bank-grade security and encryption</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-1">🎯 Monitoring Purpose</h4>
                          <ul className="text-gray-600 space-y-1">
                            <li>• App performance optimization</li>
                            <li>• Error detection and bug fixes</li>
                            <li>• User experience improvements</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-gray-500">
                        Learn more: 
                        <a href="/docs/privacy-policy.html" target="_blank" className="text-blue-600 hover:underline ml-1">Privacy Policy</a> | 
                        <a href="/docs/terms-and-conditions.html" target="_blank" className="text-blue-600 hover:underline ml-1">Terms</a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="text-xs px-3 py-1.5 h-auto"
            >
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              size="sm"
              className="text-xs px-3 py-1.5 h-auto bg-blue-600 hover:bg-blue-700"
            >
              Accept All
            </Button>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Dismiss cookie notice"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        {/* Consent Details Footer */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            By using FinBuddy, you consent to cookies for essential functionality and performance monitoring. 
            Your financial data remains private and is never sold or used for AI training.
            You can manage cookie preferences anytime through your browser settings or by clearing app cache.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
