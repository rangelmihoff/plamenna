// LoadingSpinner.jsx
import React from 'react';
import { Spinner, Stack, Text } from '@shopify/polaris';

const LoadingSpinner = ({ message, size = 'large' }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '200px',
    flexDirection: 'column'
  }}>
    <Spinner accessibilityLabel="Loading" size={size} />
    {message && (
      <div style={{ marginTop: '16px' }}>
        <Text variant="bodyMd" color="subdued">{message}</Text>
      </div>
    )}
  </div>
);

export default LoadingSpinner;

// ================================================================

// Toast.jsx
import React, { useEffect } from 'react';
import { Toast as PolarisToast } from '@shopify/polaris';

const Toast = ({ message, error, success, onDismiss, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  if (!message) return null;

  return (
    <PolarisToast
      content={message}
      error={error}
      onDismiss={onDismiss}
      duration={duration}
    />
  );
};

export default Toast;

// ================================================================

// Modal.jsx
import React from 'react';
import { Modal as PolarisModal } from '@shopify/polaris';

const Modal = ({ 
  children, 
  open, 
  onClose, 
  title, 
  primaryAction, 
  secondaryActions,
  size = 'medium',
  ...props 
}) => {
  return (
    <PolarisModal
      open={open}
      onClose={onClose}
      title={title}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      size={size}
      {...props}
    >
      {children}
    </PolarisModal>
  );
};

// Add Section as a sub-component
Modal.Section = PolarisModal.Section;

export default Modal;

// ================================================================

// Navigation.jsx
import React from 'react';
import { Navigation as PolarisNavigation, Icon } from '@shopify/polaris';
import {
  HomeMajor,
  ProductsMajor,
  StarFilledMajor,
  SettingsMajor,
  CreditCardMajor,
  AnalyticsMajor,
  QuestionMarkMajor
} from '@shopify/polaris-icons';
import { useTranslation } from '../utils/i18n';

const Navigation = ({ user, location }) => {
  const { t } = useTranslation();
  
  const navigationItems = [
    {
      label: t('navigation.dashboard'),
      icon: HomeMajor,
      url: '/',
      selected: location.pathname === '/'
    },
    {
      label: t('navigation.products'),
      icon: ProductsMajor,
      url: '/products',
      selected: location.pathname === '/products'
    },
    {
      label: t('navigation.seo_generator'),
      icon: StarFilledMajor,
      url: '/seo-generator',
      selected: location.pathname === '/seo-generator'
    },
    {
      label: t('navigation.subscription'),
      icon: CreditCardMajor,
      url: '/subscription',
      selected: location.pathname === '/subscription'
    },
    {
      label: t('navigation.settings'),
      icon: SettingsMajor,
      url: '/settings',
      selected: location.pathname === '/settings'
    }
  ];

  const contextualSaveBar = location.pathname === '/settings' ? {
    message: t('navigation.unsaved_changes'),
    saveAction: {
      onAction: () => console.log('Save'),
    },
    discardAction: {
      onAction: () => console.log('Discard'),
    }
  } : undefined;

  return (
    <PolarisNavigation location={location.pathname}>
      <PolarisNavigation.Section
        items={navigationItems}
        action={{
          accessibilityLabel: t('navigation.help'),
          icon: QuestionMarkMajor,
          onClick: () => window.open('https://help.ai-seo-app.com', '_blank')
        }}
        separator
      />
      
      <PolarisNavigation.Section
        title={t('navigation.account')}
        items={[
          {
            label: user?.shop_domain || t('navigation.account'),
            icon: AnalyticsMajor,
            onClick: () => {
              // Show account details
            }
          }
        ]}
      />
    </PolarisNavigation>
  );
};

export default Navigation;

// ================================================================

// ErrorBoundary.jsx
import React from 'react';
import { Banner, Button, Card, Layout, Page, Stack, Text } from '@shopify/polaris';
import { useTranslation } from '../utils/i18n';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Page
          title="Something went wrong"
          breadcrumbs={[{ content: 'Dashboard', url: '/' }]}
        >
          <Layout>
            <Layout.Section>
              <Banner
                title="Application Error"
                status="critical"
                action={{
                  content: 'Reload Application',
                  onAction: () => window.location.reload()
                }}
              >
                <Text variant="bodyMd">
                  An unexpected error occurred. Please try reloading the application.
                </Text>
              </Banner>
            </Layout.Section>

            <Layout.Section>
              <Card>
                <Stack vertical spacing="loose">
                  <Text variant="headingMd">Error Details</Text>
                  
                  {process.env.NODE_ENV === 'development' && (
                    <Stack vertical spacing="tight">
                      <Text variant="bodyLg" fontWeight="semibold">Error:</Text>
                      <Text variant="bodyMd" color="critical">
                        {this.state.error && this.state.error.toString()}
                      </Text>
                      
                      <Text variant="bodyLg" fontWeight="semibold">Stack Trace:</Text>
                      <pre style={{ 
                        fontSize: '12px', 
                        backgroundColor: '#f6f6f7', 
                        padding: '12px',
                        borderRadius: '4px',
                        overflow: 'auto'
                      }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </Stack>
                  )}

                  <Button
                    primary
                    onClick={() => {
                      this.setState({ hasError: false, error: null, errorInfo: null });
                    }}
                  >
                    Try Again
                  </Button>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;