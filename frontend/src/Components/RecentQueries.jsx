import { Card, DataTable, Badge } from '@shopify/polaris';
import { useAppQuery } from '../hooks/useAppQuery';
import { useState, useEffect } from 'react';

export function RecentQueries() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetch = useAppQuery();

  useEffect(() => {
    const loadRecentQueries = async () => {
      try {
        const data = await fetch('/api/ai/history?limit=5');
        setQueries(data.data);
      } catch (error) {
        console.error('Failed to load recent queries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentQueries();
  }, []);

  const rows = queries.map((query) => [
    query.query,
    <Badge status="info">{query.provider}</Badge>,
    new Date(query.createdAt).toLocaleString(),
  ]);

  return (
    <Card title="Recent AI Queries" sectioned>
      <DataTable
        columnContentTypes={['text', 'text', 'text']}
        headings={['Query', 'Provider', 'Date']}
        rows={rows}
        loading={loading}
      />
    </Card>
  );
}