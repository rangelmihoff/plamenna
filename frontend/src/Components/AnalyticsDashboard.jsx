import { Card, Page, Layout, Text, Stack, Select, ProgressBar, DataTable } from '@shopify/polaris';
import { useAppQuery } from '../hooks/useAppQuery';
import { useState, useEffect } from 'react';

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState('30d');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetch = useAppQuery();

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await fetch(`/api/analytics/dashboard?period=${period}`);
        setStats(data.data);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [period]);

  if (loading || !stats) return <Page><Loading /></Page>;

  return (
    <Page title="Analytics Dashboard">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack vertical>
              <Select
                label="Reporting Period"
                options={[
                  { label: 'Last 7 Days', value: '7d' },
                  { label: 'Last 30 Days', value: '30d' },
                  { label: 'Last 90 Days', value: '90d' }
                ]}
                value={period}
                onChange={setPeriod}
              />
              
              <ProgressCard
                title="Products"
                current={stats.products.current}
                limit={stats.products.limit}
              />
              
              <ProgressCard
                title="AI Queries"
                current={stats.queries.current}
                limit={stats.queries.limit}
              />
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <TokenUsageTable tokens={stats.tokens} />
        </Layout.Section>

        {stats.marketingStats && (
          <Layout.Section>
            <MarketingInsights stats={stats.marketingStats} />
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}

const ProgressCard = ({ title, current, limit }) => (
  <Card sectioned>
    <Text variant="headingMd" as="h3">{title}</Text>
    <Stack vertical spacing="tight">
      <Text as="p">
        {current} / {limit} ({Math.round((current / limit) * 100)}%)
      </Text>
      <ProgressBar progress={Math.round((current / limit) * 100)} size="medium" />
    </Stack>
  </Card>
);

const TokenUsageTable = ({ tokens }) => (
  <Card title="Token Usage">
    <DataTable
      columnContentTypes={['text', 'numeric', 'numeric', 'numeric']}
      headings={['Provider', 'Used', 'Allocated', 'Remaining']}
      rows={tokens.map(t => [
        t.provider,
        t.used,
        t.allocated,
        t.remaining
      ])}
    />
  </Card>
);

const MarketingInsights = ({ stats }) => (
  <Card title="Marketing Insights">
    <DataTable
      columnContentTypes={['text', 'numeric', 'percent', 'currency']}
      headings={['Metric', 'Value', 'Change', 'Revenue Impact']}
      rows={[
        ['Top Product', stats.topProducts[0].name, '+12%', `$${stats.topProducts[0].revenue}`],
        ['Conversion Rate', stats.conversionRate, '+3%', `$${stats.aiGeneratedRevenue}`]
      ]}
    />
  </Card>
);