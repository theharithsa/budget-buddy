import React from 'react';

interface FooterProps {
  className?: string;
}

export function Footer({ className = '' }: FooterProps) {
  return (
    <footer className={`bg-background border-t border-border mt-auto ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="text-center space-y-3">
          <div className="flex justify-center items-center space-x-4 text-sm">
            <a 
              href="/docs/privacy-policy.html" 
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-muted-foreground">•</span>
            <a 
              href="/docs/terms-and-conditions.html" 
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms & Conditions
            </a>
            <span className="text-muted-foreground">•</span>
            <a 
              href="/docs/security.html" 
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Security
            </a>
          </div>
          <p className="text-sm text-muted-foreground titillium-web-regular">
            Copyright 2023-2025 InspiLabs. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
