import { useState } from 'react';
import { Card, TextField, Button, Banner, Stack } from '@shopify/polaris';
import { useAppQuery } from '../hooks/useAppQuery';
import { useAuthenticatedFetch } from '../hooks/useAppQuery';

export function AISearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetch = useAuthenticatedFetch();

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          provider: 'openai' // Default provider, can be made configurable
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResults(prev => [{ query, response: data.data.response, products: data.data.products }, ...prev]);
      } else {
        setError(data.message || 'Failed to process query');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="AI Product Search" sectioned>
      <Stack vertical>
        <TextField
          label="Ask AI about your products"
          value={query}
          onChange={setQuery}
          placeholder="e.g. 'Show me laptops under $1000'"
          connectedRight={
            <Button primary onClick={handleSearch} loading={loading}>
              Search
            </Button>
          }
        />

        {error && (
          <Banner status="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}

        {results.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            {results.map((result, index) => (
              <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #dfe3e8', borderRadius: '4px' }}>
                <p><strong>Q:</strong> {result.query}</p>
                <p><strong>A:</strong> {result.response}</p>
                {result.products && result.products.length > 0 && (
                  <p><strong>Products:</strong> {result.products.map(p => p.title).join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Stack>
    </Card>
  );
}