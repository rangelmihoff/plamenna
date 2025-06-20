import React from 'react';
import { Page, Card, Layout, Text, Button } from '@shopify/polaris';
const Dashboard = () => {
  return (
    <Page
      title="Dashboard"
      subtitle="AI-powered SEO optimization for your Shopify store"
      primaryAction={
        <Button primary>
          Start Optimizing
        </Button>
      }
    >
      <Layout>
        <Layout.Section oneThird>
          <Card title="Total Products" sectioned>
            <Text variant="heading2xl" as="h2">
              0
            </Text>
            <Text variant="bodyMd" as="p" color="subdued">
              Products in your store
            </Text>
          </Card>
        </Layout.Section>
        <Layout.Section oneThird>
          <Card title="Optimized" sectioned>
            <Text variant="heading2xl" as="h2">
              0
            </Text>
            <Text variant="bodyMd" as="p" color="subdued">
              Products optimized with AI
            </Text>
          </Card>
        </Layout.Section>
        <Layout.Section oneThird>
          <Card title="SEO Score" sectioned>
            <Text variant="heading2xl" as="h2">
              --
            </Text>
            <Text variant="bodyMd" as="p" color="subdued">
              Average SEO score
            </Text>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card title="Get Started" sectioned>
            <Text variant="bodyMd" as="p" style={{ marginBottom: '16px' }}>
              Welcome to AI SEO 2.0! Start by syncing your products from Shopify.
            </Text>
            <Button primary>
              Sync Products
            </Button>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
export default Dashboard;