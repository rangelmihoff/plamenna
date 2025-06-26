import { Page, Layout, Card, DataTable } from '@shopify/polaris';
import { useAppQuery } from '../hooks/useAppQuery';
import { useState, useEffect } from 'react';

export default function AIQueriesPage() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetch = useAppQuery();

  useEffect(() => {
    const loadQueries = async () => {
      try {
        const data = await fetch('/api/ai/history');
        setQueries(data.data);
      } catch (error) {
        console.error('Failed to load queries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQueries();
  }, []);

  const rows = queries.map((query) => [
    query.query,
    query.provider,
    new Date(query.createdAt).toLocaleString(),
    query.tokensUsed,
  ]);

  return (
    <Page title="AI Query History">
      <Layout>
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'numeric']}
              headings={['Query', 'Provider', 'Date', 'Tokens Used']}
              rows={rows}
              loading={loading}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}