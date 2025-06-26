import { useState } from 'react';
import { Card, ChoiceList, Button, Banner, Spinner } from '@shopify/polaris';
import { useAppQuery } from '../hooks/useAppQuery';
import { useAuthenticatedFetch } from '../hooks/useAppQuery';

export function SEOOptimizer({ productId }) {
  const [selectedFields, setSelectedFields] = useState(['title', 'description']);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const fetch = useAuthenticatedFetch();

  const fieldOptions = [
    { label: 'SEO Title', value: 'title' },
    { label: 'Meta Description', value: 'description' },
    { label: 'Keywords', value: 'keywords' },
    { label: 'Image Alt Text', value: 'altText' },
  ];

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch(`/api/products/${productId}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: selectedFields,
        }),
      });

      const data = await response.json();
      setOptimizationResult(data);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <Card title="AI SEO Optimization" sectioned>
      <ChoiceList
        title="Select fields to optimize"
        choices={fieldOptions}
        selected={selectedFields}
        onChange={setSelectedFields}
        allowMultiple
      />

      <div style={{ marginTop: '16px' }}>
        <Button primary onClick={handleOptimize} loading={isOptimizing}>
          Optimize with AI
        </Button>
      </div>

      {optimizationResult?.success && (
        <Banner status="success" onDismiss={() => setOptimizationResult(null)}>
          SEO optimized successfully!
        </Banner>
      )}
    </Card>
  );
}