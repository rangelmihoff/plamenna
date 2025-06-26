import { useRouter } from 'next/router';
import { Page, Layout, Card } from '@shopify/polaris';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { shop, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !shop) {
      router.push('/login');
    }
  }, [isLoading, shop]);

  if (isLoading || !shop) {
    return <Page title="Loading..." />;
  }

  return (
    <Page title="Dashboard">
      <Layout>
        <Layout.Section>
          <Card title="Welcome to AI SEO 2.0" sectioned>
            <p>Your shop: {shop}</p>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}