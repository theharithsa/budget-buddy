// Monitored UI Components with built-in Dynatrace tracking
// These components automatically track user interactions

import React from 'react';
import { Button as BaseButton } from './button';
import { Input as BaseInput } from './input';
import { useMonitoredClick, useMonitoredForm } from '../../hooks/useDynatraceMonitoring';
import { dynatraceMonitor } from '../../lib/dynatrace-monitor';

// Monitored Button Component
interface MonitoredButtonProps extends React.ComponentProps<typeof BaseButton> {
  actionName?: string;
  trackingContext?: any;
  businessEvent?: {
    eventType: string;
    amount?: number;
    category?: string;
  };
}

export const MonitoredButton = React.forwardRef<HTMLButtonElement, MonitoredButtonProps>(
  ({ actionName, trackingContext, businessEvent, onClick, children, ...props }, ref) => {
    const trackClick = useMonitoredClick(
      actionName || `Button: ${children?.toString() || 'Unknown'}`,
      trackingContext
    );

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Track the click
      trackClick(event);
      
      // Track business event if provided
      if (businessEvent) {
        dynatraceMonitor.trackFinancialEvent(
          businessEvent.eventType,
          businessEvent.amount,
          businessEvent.category
        );
      }
      
      // Call original onClick
      onClick?.(event);
    };

    return (
      <BaseButton ref={ref} onClick={handleClick} {...props}>
        {children}
      </BaseButton>
    );
  }
);

MonitoredButton.displayName = "MonitoredButton";

// Monitored Input Component
interface MonitoredInputProps extends React.ComponentProps<typeof BaseInput> {
  trackingName?: string;
  trackingContext?: any;
}

export const MonitoredInput = React.forwardRef<HTMLInputElement, MonitoredInputProps>(
  ({ trackingName, trackingContext, onChange, onFocus, onBlur, ...props }, ref) => {
    const fieldName = trackingName || props.name || props.placeholder || 'Input Field';

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      dynatraceMonitor.trackUserJourney(`Focus: ${fieldName}`, {
        fieldType: props.type || 'text',
        ...trackingContext
      });
      onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      dynatraceMonitor.trackUserJourney(`Blur: ${fieldName}`, {
        fieldValue: event.target.value.length > 0 ? 'filled' : 'empty',
        ...trackingContext
      });
      onBlur?.(event);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      // Track input changes (throttled)
      const value = event.target.value;
      if (value.length % 5 === 0) { // Track every 5 characters
        dynatraceMonitor.trackUserJourney(`Input Change: ${fieldName}`, {
          length: value.length,
          hasValue: value.length > 0
        });
      }
      onChange?.(event);
    };

    return (
      <BaseInput
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

MonitoredInput.displayName = "MonitoredInput";

// Monitored Form Component
interface MonitoredFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  formName: string;
  trackingContext?: any;
}

export const MonitoredForm: React.FC<MonitoredFormProps> = ({
  formName,
  trackingContext,
  onSubmit,
  children,
  ...props
}) => {
  const trackSubmit = useMonitoredForm(formName);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // Extract form data
    const formData = new FormData(event.currentTarget);
    const formObject = Object.fromEntries(formData.entries());
    
    // Track form submission
    trackSubmit({
      ...formObject,
      ...trackingContext
    });

    onSubmit?.(event);
  };

  return (
    <form onSubmit={handleSubmit} {...props}>
      {children}
    </form>
  );
};

// Monitored Link/Navigation Component
interface MonitoredLinkProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  trackingName?: string;
  trackingContext?: any;
}

export const MonitoredLink: React.FC<MonitoredLinkProps> = ({
  href,
  onClick,
  children,
  className,
  trackingName,
  trackingContext
}) => {
  const linkText = trackingName || children?.toString() || href || 'Link';
  const trackClick = useMonitoredClick(`Navigate: ${linkText}`, {
    destination: href,
    ...trackingContext
  });

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    trackClick(event);
    
    if (href) {
      dynatraceMonitor.trackNavigation(href, trackingContext);
    }
    
    onClick?.();
  };

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
};

// Monitored Card Component
interface MonitoredCardProps {
  cardName: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  trackingContext?: any;
}

export const MonitoredCard: React.FC<MonitoredCardProps> = ({
  cardName,
  children,
  className,
  onClick,
  trackingContext
}) => {
  const trackClick = useMonitoredClick(`Card: ${cardName}`, trackingContext);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    trackClick(event);
    onClick?.();
  };

  return (
    <div className={className} onClick={handleClick} role="button" tabIndex={0}>
      {children}
    </div>
  );
};

// Monitored Tab Component
interface MonitoredTabProps {
  tabName: string;
  isActive?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const MonitoredTab: React.FC<MonitoredTabProps> = ({
  tabName,
  isActive,
  onClick,
  children,
  className
}) => {
  const trackClick = useMonitoredClick(`Tab: ${tabName}`, {
    wasActive: isActive,
    tabName
  });

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    trackClick(event);
    
    // Track tab switching
    dynatraceMonitor.trackUserJourney(`Tab Switch: ${tabName}`, {
      previouslyActive: isActive,
      timestamp: new Date().toISOString()
    });
    
    onClick?.();
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      role="tab"
      aria-selected={isActive}
      data-tab-name={tabName}
    >
      {children}
    </button>
  );
};

// Monitored Search Component
interface MonitoredSearchProps {
  onSearch: (query: string) => void;
  onResults?: (count: number) => void;
  placeholder?: string;
  className?: string;
}

export const MonitoredSearch: React.FC<MonitoredSearchProps> = ({
  onSearch,
  onResults,
  placeholder = "Search...",
  className
}) => {
  const [query, setQuery] = React.useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    // Track search
    dynatraceMonitor.trackSearch(query);
    
    onSearch(query);
  };

  const handleResults = (count: number) => {
    dynatraceMonitor.trackSearch(query, count);
    onResults?.(count);
  };

  React.useEffect(() => {
    if (onResults) {
      // This would be called by parent component when results are available
      // handleResults(resultCount);
    }
  }, [query]);

  return (
    <form onSubmit={handleSubmit} className={className}>
      <MonitoredInput
        trackingName="Search Query"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        trackingContext={{ searchType: 'global' }}
      />
      <MonitoredButton
        type="submit"
        actionName="Search Submit"
        businessEvent={{
          eventType: 'search_performed',
          category: 'user_interaction'
        }}
      >
        Search
      </MonitoredButton>
    </form>
  );
};
