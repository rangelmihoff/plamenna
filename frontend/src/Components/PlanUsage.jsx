import { Card, ProgressBar, Text } from '@shopify/polaris';
import { useAppQuery } from '../hooks/useAppQuery';
import { useState, useEffect } from 'react';

export function PlanUsage() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetch = useAppQuery();

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const data = await fetch('/api/ai/usage');
        setUsage(data.data);
      } catch (error) {
        console.error('Failed to load usage data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, []);

  if (loading || !usage) {
    return <Card title="Plan Usage" sectioned><Text as="p">Loading...</Text></Card>;
  }

  const percentage = Math.round((usage.queriesUsed / usage.queriesLimit) * 100);

  return (
    <Card title="Plan Usage" sectioned>
      <Text variant="headingMd" as="h3">
        {usage.plan} Plan
      </Text>
      <div style={{ margin: '16px 0' }}>
        <Text as="p">
          AI Queries: {usage.queriesUsed} / {usage.queriesLimit}
        </Text>
        <ProgressBar progress={percentage} size="medium" />
      </div>
      <Text as="p">
        Next billing date: {new Date(usage.nextBillingDate).toLocaleDateString()}
      </Text>
    </Card>
  );
}