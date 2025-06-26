import { useRouter } from 'next/router';
import { Layout, Page, Button } from '@shopify/polaris';
import { useEffect } from 'react';
import { useAuthenticatedFetch } from '../hooks/useAppQuery';

export default function LoginPage() {
  const router = useRouter();
  const fetch = useAuthenticatedFetch();

  useEffect(() => {
    // Check if already authenticated
    fetch('/api/auth/validate')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          router.push('/');
        }
      });
  }, []);

  const handleInstall = () => {
    window.location.href = `/api/auth/install?shop=${router.query.shop}`;
  };

  return (
    <Page narrowWidth>
      <Layout>
        <Layout.Section>
          <div style={{ marginTop: '200px', textAlign: 'center' }}>
            <Button primary size="large" onClick={handleInstall}>
              Install App
            </Button>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}