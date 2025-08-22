import React from 'react';

interface FooterProps {
  className?: string;
}

export function Footer({ className = '' }: FooterProps) {
  return (
    <footer className={`bg-background border-t border-border mt-auto ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground titillium-web-regular">
            Copyright 2023-2025 InspiLabs. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
