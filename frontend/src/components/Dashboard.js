import React, { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  ProgressBar,
  Badge,
  DataTable,
  Button,
  ButtonGroup,
  Stack,
  Banner,
  EmptyState,
  Icon
} from '@shopify/polaris';
import {
  AnalyticsMinor,
  ProductsMinor,
  SearchMinor,
  StarOutlineMinor,
  ChevronUpMinor,
  CalendarTimeMinor
} from '@shopify/polaris-icons';
import { useAPI } from '../hooks/useAPI';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useTranslation } from '../utils/i18n';
import LoadingSpinner from './LoadingSpinner';
import Toast from './Toast';

const Dashboard = () => {
  const { apiCall, loading } = useAPI();
  const { subscription, usage } = useSubscription();
  const { t } = useTranslation();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [seoStats, setSeoStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [toast, setToast] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const loadDashboardData = async () => {
    try {
      const [productsRes, seoRes, activityRes] = await Promise.all([
        apiCall('/api/products/analytics'),
        apiCall('/api/seo/analytics'),
        apiCall('/api/products?limit=5&sort=updated_at&order=desc')
      ]);

      setDashboardData(productsRes);
      setSeoStats(seoRes);
      setRecentActivity(activityRes.products || []);
    } catch (error) {
      setToast({
        message: t('dashboard.error.loading'),
        error: true
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    setToast({
      message: t('dashboard.refreshed'),
      success: true
    });
  };

  const handleSyncProducts = async () => {
    try {
      await apiCall('/api/products/sync', 'POST');
      setToast({
        message: t('dashboard.sync.started'),
        success: true
      });
      setTimeout(loadDashboardData, 2000);
    } catch (error) {
      setToast({
        message: t('dashboard.sync.error'),
        error: true
      });
    }
  };

  if (loading && !dashboardData) {
    return <LoadingSpinner />;
  }

  // Usage percentage calculation
  const usagePercentage = subscription ? 
    Math.round((usage?.aiQueries / subscription.limits.aiQueries) * 100) : 0;

  // Recent activity table data
  const activityRows = recentActivity.map(product => [
    product.title,
    product.seo_score ? `${product.seo_score}/100` : t('dashboard.not_optimized'),
    product.seo_score ? (
      <Badge status={product.seo_score >= 80 ? 'success' : product.seo_score >= 60 ? 'attention' : 'critical'}>
        {product.seo_score >= 80 ? t('dashboard.excellent') : 
         product.seo_score >= 60 ? t('dashboard.good') : t('dashboard.needs_work')}
      </Badge>
    ) : (
      <Badge status="info">{t('dashboard.pending')}</Badge>
    ),
    new Date(product.updated_at).toLocaleDateString()
  ]);

  return (
    <Page
      title={t('dashboard.title')}
      subtitle={t('dashboard.subtitle')}
      primaryAction={{
        content: t('dashboard.sync_products'),
        onAction: handleSyncProducts,
        loading: refreshing
      }}
      secondaryActions={[
        {
          content: t('dashboard.refresh'),
          onAction: handleRefresh,
          loading: refreshing
        }
      ]}
    >
      <Layout>
        {/* Subscription Status Banner */}
        {subscription?.trial_active && (
          <Layout.Section>
            <Banner
              title={t('dashboard.trial_active')}
              status="info"
              action={{
                content: t('dashboard.upgrade_now'),
                url: '/subscription'
              }}
            >
              <Text variant="bodyMd">
                {t('dashboard.trial_expires', { 
                  days: Math.ceil((new Date(subscription.trial_end) - new Date()) / (1000 * 60 * 60 * 24))
                })}
              </Text>
            </Banner>
          </Layout.Section>
        )}

        {/* Quick Stats Cards */}
        <Layout.Section>
          <Layout>
            <Layout.Section oneThird>
              <Card>
                <Stack vertical spacing="tight">
                  <Stack alignment="center">
                    <Icon source={ProductsMinor} color="base" />
                    <Text variant="headingMd">{t('dashboard.total_products')}</Text>
                  </Stack>
                  <Text variant="heading2xl" as="h2">
                    {dashboardData?.total_products || 0}
                  </Text>
                  <Text variant="bodyMd" color="subdued">
                    {dashboardData?.optimized_products || 0} {t('dashboard.optimized')}
                  </Text>
                </Stack>
              </Card>
            </Layout.Section>

            <Layout.Section oneThird>
              <Card>
                <Stack vertical spacing="tight">
                  <Stack alignment="center">
                    <Icon source={SearchMinor} color="base" />
                    <Text variant="headingMd">{t('dashboard.avg_seo_score')}</Text>
                  </Stack>
                  <Text variant="heading2xl" as="h2">
                    {seoStats?.average_score || 0}/100
                  </Text>
                  <Stack alignment="center">
                    <Icon 
                      source={ChevronUpMinor} 
                      color={seoStats?.score_trend >= 0 ? "success" : "critical"} 
                    />
                    <Text 
                      variant="bodyMd" 
                      color={seoStats?.score_trend >= 0 ? "success" : "critical"}
                    >
                      {seoStats?.score_trend >= 0 ? '+' : ''}{seoStats?.score_trend || 0}% {t('dashboard.this_month')}
                    </Text>
                  </Stack>
                </Stack>
              </Card>
            </Layout.Section>

            <Layout.Section oneThird>
              <Card>
                <Stack vertical spacing="tight">
                  <Stack alignment="center">
                    <Icon source={AnalyticsMinor} color="base" />
                    <Text variant="headingMd">{t('dashboard.ai_usage')}</Text>
                  </Stack>
                  <Text variant="heading2xl" as="h2">
                    {usage?.aiQueries || 0}
                  </Text>
                  <Stack vertical spacing="extraTight">
                    <ProgressBar 
                      progress={usagePercentage} 
                      size="small"
                      color={usagePercentage >= 90 ? "critical" : usagePercentage >= 70 ? "warning" : "primary"}
                    />
                    <Text variant="bodySm" color="subdued">
                      {usage?.aiQueries || 0} / {subscription?.limits?.aiQueries || 0} {t('dashboard.queries_used')}
                    </Text>
                  </Stack>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>

        {/* Main Content */}
        <Layout.Section>
          <Layout>
            {/* Recent Activity */}
            <Layout.Section twoThirds>
              <Card>
                <Stack vertical spacing="loose">
                  <Stack alignment="center" distribution="equalSpacing">
                    <Text variant="headingMd">{t('dashboard.recent_activity')}</Text>
                    <ButtonGroup>
                      <Button 
                        plain 
                        url="/products"
                        icon={ProductsMinor}
                      >
                        {t('dashboard.view_all')}
                      </Button>
                    </ButtonGroup>
                  </Stack>

                  {activityRows.length > 0 ? (
                    <DataTable
                      columnContentTypes={['text', 'text', 'text', 'text']}
                      headings={[
                        t('dashboard.product_name'),
                        t('dashboard.seo_score'),
                        t('dashboard.status'),
                        t('dashboard.last_updated')
                      ]}
                      rows={activityRows}
                      verticalAlign="middle"
                    />
                  ) : (
                    <EmptyState
                      heading={t('dashboard.no_products')}
                      action={{
                        content: t('dashboard.sync_now'),
                        onAction: handleSyncProducts
                      }}
                      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    >
                      <Text variant="bodyMd" color="subdued">
                        {t('dashboard.no_products_description')}
                      </Text>
                    </EmptyState>
                  )}
                </Stack>
              </Card>
            </Layout.Section>

            {/* Quick Actions & Plan Info */}
            <Layout.Section oneThird>
              <Stack vertical spacing="loose">
                {/* Quick Actions */}
                <Card>
                  <Stack vertical spacing="loose">
                    <Text variant="headingMd">{t('dashboard.quick_actions')}</Text>
                    
                    <Stack vertical spacing="tight">
                      <Button 
                        primary 
                        fullWidth 
                        url="/seo-generator"
                        icon={StarOutlineMinor}
                      >
                        {t('dashboard.generate_seo')}
                      </Button>
                      
                      <Button 
                        fullWidth 
                        url="/products"
                        icon={ProductsMinor}
                      >
                        {t('dashboard.manage_products')}
                      </Button>
                      
                      <Button 
                        fullWidth 
                        url="/settings"
                        icon={AnalyticsMinor}
                      >
                        {t('dashboard.app_settings')}
                      </Button>
                    </Stack>
                  </Stack>
                </Card>

                {/* Plan Information */}
                <Card>
                  <Stack vertical spacing="loose">
                    <Text variant="headingMd">{t('dashboard.current_plan')}</Text>
                    
                    <Stack vertical spacing="tight">
                      <Stack alignment="center" distribution="equalSpacing">
                        <Text variant="bodyLg" fontWeight="semibold">
                          {subscription?.plan_name || 'Starter'}
                        </Text>
                        <Badge status="success">
                          {subscription?.trial_active ? t('dashboard.trial') : t('dashboard.active')}
                        </Badge>
                      </Stack>

                      <Stack vertical spacing="extraTight">
                        <Text variant="bodySm" color="subdued">
                          {t('dashboard.ai_queries')}: {usage?.aiQueries || 0} / {subscription?.limits?.aiQueries || 50}
                        </Text>
                        <Text variant="bodySm" color="subdued">
                          {t('dashboard.products')}: {dashboardData?.total_products || 0} / {subscription?.limits?.products || 150}
                        </Text>
                        {subscription?.next_sync && (
                          <Stack alignment="center">
                            <Icon source={CalendarTimeMinor} color="subdued" />
                            <Text variant="bodySm" color="subdued">
                              {t('dashboard.next_sync')}: {new Date(subscription.next_sync).toLocaleString()}
                            </Text>
                          </Stack>
                        )}
                      </Stack>

                      {subscription && !subscription.trial_active && (
                        <Button 
                          fullWidth 
                          outline 
                          url="/subscription"
                        >
                          {t('dashboard.manage_plan')}
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              </Stack>
            </Layout.Section>
          </Layout>
        </Layout.Section>
      </Layout>

      {toast && (
        <Toast
          message={toast.message}
          error={toast.error}
          success={toast.success}
          onDismiss={() => setToast(null)}
        />
      )}
    </Page>
  );
};

export default Dashboard;