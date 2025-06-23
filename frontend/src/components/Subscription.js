import React, { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  Stack,
  Badge,
  ProgressBar,
  Banner,
  DataTable,
  Modal,
  TextContainer,
  List,
  Icon,
  Tooltip,
  ChoiceList,
  Select,
  Link
} from '@shopify/polaris';
import {
  StarFilledMajor,
  CircleTickMajor,
  CircleDisabledMajor,
  CreditCardMajor,
  CalendarMajor,
  AnalyticsMajor,
  TrendingUpMajor,
  InfoMinor,
  ExternalMinor
} from '@shopify/polaris-icons';
import { useAPI } from '../hooks/useAPI';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useTranslation } from '../utils/i18n';
import LoadingSpinner from './LoadingSpinner';
import Toast from './Toast';

const Subscription = () => {
  const { apiCall, loading } = useAPI();
  const { user } = useAuth();
  const { subscription, usage, refreshSubscription } = useSubscription();
  const { t } = useTranslation();

  // State management
  const [plans, setPlans] = useState([]);
  const [toast, setToast] = useState(null);
  const [upgradeInProgress, setUpgradeInProgress] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);

  // Plan definitions
  const planDefinitions = [
    {
      id: 'starter',
      name: 'Starter',
      price: 10,
      features: {
        aiQueries: 50,
        products: 150,
        providers: 1,
        syncFrequency: '2 weeks',
        support: 'Email'
      },
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 39,
      features: {
        aiQueries: 600,
        products: 300,
        providers: 2,
        syncFrequency: '48 hours',
        support: 'Priority Email'
      },
      popular: true
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 59,
      features: {
        aiQueries: 1500,
        products: 1000,
        providers: 3,
        syncFrequency: '24 hours',
        support: 'Priority + Chat'
      },
      popular: false
    },
    {
      id: 'growth_extra',
      name: 'Growth Extra',
      price: 119,
      features: {
        aiQueries: 4000,
        products: 2000,
        providers: 4,
        syncFrequency: '12 hours',
        support: 'Premium Support'
      },
      popular: false
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      features: {
        aiQueries: 10000,
        products: 10000,
        providers: 5,
        syncFrequency: '2 hours',
        support: 'Dedicated Support'
      },
      popular: false
    }
  ];

  useEffect(() => {
    loadSubscriptionData();
    loadBillingHistory();
    loadUsageHistory();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const response = await apiCall('/api/subscriptions/status');
      // Data is already in subscription hook
    } catch (error) {
      setToast({
        message: t('subscription.error.loading'),
        error: true
      });
    }
  };

  const loadBillingHistory = async () => {
    try {
      const response = await apiCall('/api/subscriptions/billing-history');
      setBillingHistory(response.history || []);
    } catch (error) {
      console.error('Failed to load billing history:', error);
    }
  };

  const loadUsageHistory = async () => {
    try {
      const response = await apiCall('/api/subscriptions/usage-history');
      setUsageHistory(response.usage || []);
    } catch (error) {
      console.error('Failed to load usage history:', error);
    }
  };

  const handlePlanChange = async (planId) => {
    setUpgradeInProgress(true);
    try {
      await apiCall('/api/subscriptions/change-plan', 'POST', {
        plan_id: planId
      });

      setToast({
        message: t('subscription.success.plan_changed'),
        success: true
      });

      setShowChangeModal(false);
      refreshSubscription();
    } catch (error) {
      setToast({
        message: t('subscription.error.plan_change_failed'),
        error: true
      });
    } finally {
      setUpgradeInProgress(false);
    }
  };

  const handleExtendTrial = async () => {
    try {
      await apiCall('/api/subscriptions/trial/extend', 'POST');
      setToast({
        message: t('subscription.success.trial_extended'),
        success: true
      });
      refreshSubscription();
    } catch (error) {
      setToast({
        message: t('subscription.error.trial_extend_failed'),
        error: true
      });
    }
  };

  const getCurrentPlan = () => {
    return planDefinitions.find(plan => plan.id === subscription?.plan_name) || planDefinitions[0];
  };

  const getUsagePercentage = (used, total) => {
    return Math.round((used / total) * 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'primary';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderCurrentPlan = () => {
    const currentPlan = getCurrentPlan();
    const trialDaysLeft = subscription?.trial_active 
      ? Math.ceil((new Date(subscription.trial_end) - new Date()) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <Card>
        <Stack vertical spacing="loose">
          <Stack alignment="center" distribution="equalSpacing">
            <Text variant="headingLg">{t('subscription.current_plan')}</Text>
            {subscription?.trial_active && (
              <Badge status="info">
                {t('subscription.trial_badge')}
              </Badge>
            )}
          </Stack>

          <Stack alignment="center" distribution="equalSpacing">
            <Stack vertical spacing="tight">
              <Text variant="heading2xl" as="h2">
                {currentPlan.name}
              </Text>
              <Text variant="bodyLg" color="subdued">
                ${currentPlan.price}/{t('subscription.month')}
              </Text>
            </Stack>

            {subscription?.trial_active && trialDaysLeft > 0 && (
              <Stack vertical spacing="tight" alignment="center">
                <Text variant="headingMd" color="critical">
                  {trialDaysLeft} {t('subscription.days_left')}
                </Text>
                <Button
                  size="small"
                  onClick={handleExtendTrial}
                >
                  {t('subscription.extend_trial')}
                </Button>
              </Stack>
            )}
          </Stack>

          {/* Usage Overview */}
          <Stack vertical spacing="tight">
            <Text variant="headingMd">{t('subscription.usage_overview')}</Text>
            
            <Stack vertical spacing="tight">
              <Stack alignment="center" distribution="equalSpacing">
                <Text variant="bodyMd">{t('subscription.ai_queries')}</Text>
                <Text variant="bodySm" color="subdued">
                  {usage?.aiQueries || 0} / {currentPlan.features.aiQueries}
                </Text>
              </Stack>
              <ProgressBar
                progress={getUsagePercentage(usage?.aiQueries || 0, currentPlan.features.aiQueries)}
                color={getUsageColor(getUsagePercentage(usage?.aiQueries || 0, currentPlan.features.aiQueries))}
              />
            </Stack>

            <Stack vertical spacing="tight">
              <Stack alignment="center" distribution="equalSpacing">
                <Text variant="bodyMd">{t('subscription.products')}</Text>
                <Text variant="bodySm" color="subdued">
                  {usage?.products || 0} / {currentPlan.features.products}
                </Text>
              </Stack>
              <ProgressBar
                progress={getUsagePercentage(usage?.products || 0, currentPlan.features.products)}
                color={getUsageColor(getUsagePercentage(usage?.products || 0, currentPlan.features.products))}
              />
            </Stack>
          </Stack>

          {/* Next Billing */}
          {subscription && !subscription.trial_active && (
            <Stack alignment="center">
              <Icon source={CalendarMajor} color="subdued" />
              <Text variant="bodySm" color="subdued">
                {t('subscription.next_billing')}: {formatDate(subscription.next_billing_date)}
              </Text>
            </Stack>
          )}
        </Stack>
      </Card>
    );
  };

  const renderPlanCard = (plan) => {
    const isCurrent = subscription?.plan_name === plan.id;
    const isUpgrade = planDefinitions.findIndex(p => p.id === plan.id) > 
                     planDefinitions.findIndex(p => p.id === subscription?.plan_name);

    return (
      <Card key={plan.id} sectioned>
        <Stack vertical spacing="loose">
          <Stack alignment="center" distribution="equalSpacing">
            <Stack vertical spacing="none">
              <Text variant="headingMd">{plan.name}</Text>
              {plan.popular && (
                <Badge status="success">{t('subscription.most_popular')}</Badge>
              )}
            </Stack>
            <Text variant="heading2xl" as="h3">
              ${plan.price}
              <Text variant="bodySm" color="subdued">/{t('subscription.month')}</Text>
            </Text>
          </Stack>

          <Stack vertical spacing="tight">
            <Stack alignment="center">
              <Icon source={CircleTickMajor} color="success" />
              <Text variant="bodyMd">
                {plan.features.aiQueries} {t('subscription.ai_queries_month')}
              </Text>
            </Stack>

            <Stack alignment="center">
              <Icon source={CircleTickMajor} color="success" />
              <Text variant="bodyMd">
                {plan.features.products} {t('subscription.products_max')}
              </Text>
            </Stack>

            <Stack alignment="center">
              <Icon source={CircleTickMajor} color="success" />
              <Text variant="bodyMd">
                {plan.features.providers} {t('subscription.ai_providers')}
              </Text>
            </Stack>

            <Stack alignment="center">
              <Icon source={CircleTickMajor} color="success" />
              <Text variant="bodyMd">
                {t('subscription.sync_every')} {plan.features.syncFrequency}
              </Text>
            </Stack>

            <Stack alignment="center">
              <Icon source={CircleTickMajor} color="success" />
              <Text variant="bodyMd">
                {plan.features.support} {t('subscription.support')}
              </Text>
            </Stack>
          </Stack>

          <Button
            primary={plan.popular}
            fullWidth
            disabled={isCurrent}
            onClick={() => {
              setSelectedPlan(plan);
              setShowChangeModal(true);
            }}
          >
            {isCurrent 
              ? t('subscription.current_plan')
              : isUpgrade 
                ? t('subscription.upgrade_to', { plan: plan.name })
                : t('subscription.downgrade_to', { plan: plan.name })
            }
          </Button>

          {!subscription?.trial_active && plan.id === 'starter' && (
            <Text variant="bodySm" color="subdued" alignment="center">
              {t('subscription.starter_note')}
            </Text>
          )}
        </Stack>
      </Card>
    );
  };

  const renderBillingHistory = () => {
    const billingRows = billingHistory.map(item => [
      formatDate(item.date),
      item.description,
      `$${item.amount}`,
      <Badge status={item.status === 'paid' ? 'success' : 'critical'}>
        {t(`subscription.billing.${item.status}`)}
      </Badge>,
      <Button
        plain
        icon={ExternalMinor}
        onClick={() => window.open(item.invoice_url, '_blank')}
      >
        {t('subscription.view_invoice')}
      </Button>
    ]);

    return (
      <Card>
        <Stack vertical spacing="loose">
          <Text variant="headingMd">{t('subscription.billing_history')}</Text>
          
          {billingRows.length > 0 ? (
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text']}
              headings={[
                t('subscription.billing.date'),
                t('subscription.billing.description'),
                t('subscription.billing.amount'),
                t('subscription.billing.status'),
                t('subscription.billing.actions')
              ]}
              rows={billingRows}
              verticalAlign="middle"
            />
          ) : (
            <Text variant="bodyMd" color="subdued" alignment="center">
              {t('subscription.no_billing_history')}
            </Text>
          )}
        </Stack>
      </Card>
    );
  };

  const renderUsageAnalytics = () => {
    return (
      <Card>
        <Stack vertical spacing="loose">
          <Text variant="headingMd">{t('subscription.usage_analytics')}</Text>
          
          <Stack>
            <Stack vertical spacing="tight">
              <Text variant="bodyLg" fontWeight="semibold">
                {t('subscription.this_month')}
              </Text>
              <Stack alignment="center">
                <Icon source={TrendingUpMajor} color="success" />
                <Text variant="bodyMd">
                  {usage?.aiQueries || 0} {t('subscription.queries_used')}
                </Text>
              </Stack>
              <Stack alignment="center">
                <Icon source={AnalyticsMajor} color="base" />
                <Text variant="bodyMd">
                  {usage?.products || 0} {t('subscription.products_optimized')}
                </Text>
              </Stack>
            </Stack>
          </Stack>

          {usageHistory.length > 0 && (
            <Stack vertical spacing="tight">
              <Text variant="bodyLg" fontWeight="semibold">
                {t('subscription.usage_trend')}
              </Text>
              {/* Add chart component here if needed */}
              <Text variant="bodySm" color="subdued">
                {t('subscription.usage_trend_description')}
              </Text>
            </Stack>
          )}
        </Stack>
      </Card>
    );
  };

  if (loading && !subscription) {
    return <LoadingSpinner />;
  }

  return (
    <Page
      title={t('subscription.title')}
      subtitle={t('subscription.subtitle')}
      breadcrumbs={[{ content: t('navigation.dashboard'), url: '/' }]}
    >
      <Layout>
        {/* Trial Warning */}
        {subscription?.trial_active && (
          <Layout.Section>
            <Banner
              title={t('subscription.trial_ending_soon')}
              status="warning"
              action={{
                content: t('subscription.choose_plan'),
                onAction: () => {
                  // Scroll to plans section
                  document.getElementById('plans-section')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                }
              }}
            >
              <Text variant="bodyMd">
                {t('subscription.trial_ending_description', {
                  days: Math.ceil((new Date(subscription.trial_end) - new Date()) / (1000 * 60 * 60 * 24))
                })}
              </Text>
            </Banner>
          </Layout.Section>
        )}

        {/* Current Plan Overview */}
        <Layout.Section>
          <Layout>
            <Layout.Section oneHalf>
              {renderCurrentPlan()}
            </Layout.Section>
            
            <Layout.Section oneHalf>
              {renderUsageAnalytics()}
            </Layout.Section>
          </Layout>
        </Layout.Section>

        {/* Available Plans */}
        <Layout.Section>
          <div id="plans-section">
            <Text variant="heading2xl" as="h2" alignment="center">
              {t('subscription.choose_your_plan')}
            </Text>
            <br />
            
            <Layout>
              {planDefinitions.map(plan => (
                <Layout.Section key={plan.id} oneThird={planDefinitions.length <= 3} oneQuarter={planDefinitions.length > 3}>
                  {renderPlanCard(plan)}
                </Layout.Section>
              ))}
            </Layout>
          </div>
        </Layout.Section>

        {/* Billing History */}
        {!subscription?.trial_active && (
          <Layout.Section>
            {renderBillingHistory()}
          </Layout.Section>
        )}

        {/* FAQ */}
        <Layout.Section>
          <Card>
            <Stack vertical spacing="loose">
              <Text variant="headingMd">{t('subscription.faq.title')}</Text>
              
              <Stack vertical spacing="tight">
                <Text variant="bodyLg" fontWeight="semibold">
                  {t('subscription.faq.q1')}
                </Text>
                <Text variant="bodyMd" color="subdued">
                  {t('subscription.faq.a1')}
                </Text>

                <Text variant="bodyLg" fontWeight="semibold">
                  {t('subscription.faq.q2')}
                </Text>
                <Text variant="bodyMd" color="subdued">
                  {t('subscription.faq.a2')}
                </Text>

                <Text variant="bodyLg" fontWeight="semibold">
                  {t('subscription.faq.q3')}
                </Text>
                <Text variant="bodyMd" color="subdued">
                  {t('subscription.faq.a3')}
                </Text>
              </Stack>

              <Stack distribution="center">
                <Link url="mailto:support@ai-seo-app.com">
                  {t('subscription.contact_support')}
                </Link>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Plan Change Modal */}
      <Modal
        open={showChangeModal}
        onClose={() => setShowChangeModal(false)}
        title={t('subscription.confirm_plan_change')}
        primaryAction={{
          content: t('subscription.confirm_change'),
          onAction: () => handlePlanChange(selectedPlan?.id),
          loading: upgradeInProgress
        }}
        secondaryActions={[
          {
            content: t('common.cancel'),
            onAction: () => setShowChangeModal(false)
          }
        ]}
      >
        <Modal.Section>
          {selectedPlan && (
            <Stack vertical spacing="loose">
              <Text variant="bodyMd">
                {t('subscription.change_plan_description', {
                  from: getCurrentPlan().name,
                  to: selectedPlan.name
                })}
              </Text>

              <Banner status="info">
                <List type="bullet">
                  <List.Item>
                    {t('subscription.billing_cycle_info')}
                  </List.Item>
                  <List.Item>
                    {t('subscription.immediate_access')}
                  </List.Item>
                  <List.Item>
                    {t('subscription.no_data_loss')}
                  </List.Item>
                </List>
              </Banner>

              <Stack alignment="center" distribution="equalSpacing">
                <Text variant="bodyMd">
                  {t('subscription.new_monthly_cost')}:
                </Text>
                <Text variant="headingLg">
                  ${selectedPlan.price}/{t('subscription.month')}
                </Text>
              </Stack>
            </Stack>
          )}
        </Modal.Section>
      </Modal>

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

export default Subscription;