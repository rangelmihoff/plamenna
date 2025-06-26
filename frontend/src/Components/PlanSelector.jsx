import { useState, useEffect } from 'react';
import { Card, Select, Button, Banner, Stack, Text, Modal, List } from '@shopify/polaris';
import { useAppQuery } from '../hooks/useAppQuery';
import { useAuthenticatedFetch } from '../hooks/useAppQuery';

export function PlanSelector({ currentPlan }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const fetch = useAuthenticatedFetch();

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await fetch('/api/subscription/plans');
        const data = await response.json();
        if (data.success) {
          setPlans(data.data);
          setSelectedPlan(currentPlan || '');
        }
      } catch (err) {
        setError('Failed to load plans');
        console.error('Plan load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, [currentPlan]);

  const handlePlanChange = (value) => {
    setSelectedPlan(value);
    setSuccess(false);
  };

  const handleUpgrade = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planName: selectedPlan,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        // Redirect to Shopify's confirmation page
        window.location.href = data.data.confirmationUrl;
      } else {
        setError(data.message || 'Upgrade failed');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Upgrade error:', err);
    } finally {
      setProcessing(false);
      setConfirmationModal(false);
    }
  };

  const selectedPlanData = plans.find(plan => plan.name === selectedPlan);

  return (
    <Card title="Change Your Plan" sectioned>
      <Stack vertical spacing="loose">
        {error && (
          <Banner status="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}

        {success && (
          <Banner status="success">
            Plan change initiated successfully. You will be redirected to complete the process.
          </Banner>
        )}

        <Select
          label="Select a plan"
          options={plans.map(plan => ({
            label: `${plan.name} ($${plan.price}/month)`,
            value: plan.name,
          }))}
          value={selectedPlan}
          onChange={handlePlanChange}
          disabled={loading || processing}
        />

        {selectedPlanData && (
          <div>
            <Text variant="bodyMd" as="p">
              <strong>Features:</strong>
            </Text>
            <List type="bullet">
              <List.Item>{selectedPlanData.aiQueries} AI queries/month</List.Item>
              <List.Item>Up to {selectedPlanData.productLimit} products</List.Item>
              <List.Item>
                {selectedPlanData.aiProviders.length} AI providers: {selectedPlanData.aiProviders.join(', ')}
              </List.Item>
              <List.Item>Sync every {selectedPlanData.syncFrequency}</List.Item>
              <List.Item>
                {selectedPlanData.seoOptimization ? '✅' : '❌'} SEO Optimization
              </List.Item>
              <List.Item>
                {selectedPlanData.multiProductOptimization ? '✅' : '❌'} Bulk Optimization
              </List.Item>
            </List>
          </div>
        )}

        <Button
          primary
          onClick={() => setConfirmationModal(true)}
          disabled={!selectedPlan || selectedPlan === currentPlan || loading}
          loading={processing}
        >
          Upgrade Plan
        </Button>
      </Stack>

      <Modal
        open={confirmationModal}
        onClose={() => setConfirmationModal(false)}
        title="Confirm Plan Change"
        primaryAction={{
          content: 'Confirm Upgrade',
          onAction: handleUpgrade,
          loading: processing,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setConfirmationModal(false),
          },
        ]}
      >
        <Modal.Section>
          <Stack vertical spacing="tight">
            <Text as="p">
              You are about to change to the <strong>{selectedPlan}</strong> plan.
            </Text>
            <Text as="p">
              You will be redirected to Shopify's payment page to complete the upgrade.
            </Text>
            {selectedPlanData && (
              <Text as="p" fontWeight="bold">
                New monthly price: ${selectedPlanData.price}
              </Text>
            )}
          </Stack>
        </Modal.Section>
      </Modal>
    </Card>
  );
}