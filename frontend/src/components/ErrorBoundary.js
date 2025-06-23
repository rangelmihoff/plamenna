import React from 'react';
import { Banner, Button, Card, Layout, Page, Stack, Text } from '@shopify/polaris';

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