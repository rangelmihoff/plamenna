import { Page, Layout, Card, Stack, Banner } from '@shopify/polaris';
import { useShop } from '../hooks/useShop';
import { useProducts } from '../hooks/useProducts';
import { useAI } from '../hooks/useAI';
import { RecentQueries } from '../components/RecentQueries';
import { TopProducts } from '../components/TopProducts';
import { PlanUsage } from '../components/PlanUsage';
import { AISearch } from '../components/AISearch';

export default function Dashboard() {
  const { shop, loading: shopLoading, error: shopError } = useShop();
  const { products, loading: productsLoading } = useProducts({ limit: 5 });
  const { isProcessing: aiProcessing, error: aiError } = useAI();

  const isLoading = shopLoading || productsLoading || aiProcessing;
  const error = shopError || aiError;

  return (
    <Page
      title="Dashboard"
      subtitle={shop?.shopifyDomain ? `Store: ${shop.shopifyDomain}` : ''}
      fullWidth
    >
      {error && (
        <Banner status="critical" onDismiss={() => {}}>
          {error}
        </Banner>
      )}

      <Layout>
        {/* Primary Content Section */}
        <Layout.Section oneHalf>
          <Stack vertical spacing="loose">
            <Card title="AI Product Search" sectioned>
              <AISearch />
            </Card>
            
            <Card title="Recent Activity" sectioned>
              <RecentQueries limit={5} />
            </Card>
          </Stack>
        </Layout.Section>

        {/* Secondary Content Section */}
        <Layout.Section oneHalf>
          <Stack vertical spacing="loose">
            <Card title="Your Plan" sectioned>
              <PlanUsage />
            </Card>

            <Card title="Top Products" sectioned>
              <TopProducts products={products} loading={isLoading} />
            </Card>
          </Stack>
        </Layout.Section>

        {/* Full Width Section */}
        <Layout.Section>
          <Card title="Quick Actions" sectioned>
            <Stack distribution="fillEvenly">
              <Stack.Item>
                <Button primary url="/products">
                  Manage Products
                </Button>
              </Stack.Item>
              <Stack.Item>
                <Button url="/ai-queries">View AI History</Button>
              </Stack.Item>
              <Stack.Item>
                <Button url="/settings">Account Settings</Button>
              </Stack.Item>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}