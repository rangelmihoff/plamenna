import { Modal, ChoiceList, Button, Stack, Banner } from '@shopify/polaris';
import { useAuthenticatedFetch } from '../hooks/useAppQuery';
import { useState } from 'react';

export function OptimizeModal({ product, onClose, onSuccess }) {
  const [selectedFields, setSelectedFields] = useState(['title', 'description']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fetch = useAuthenticatedFetch();

  const fieldOptions = [
    { label: 'SEO Title', value: 'title' },
    { label: 'Meta Description', value: 'description' },
    { label: 'Keywords', value: 'keywords' },
    { label: 'Image Alt Text', value: 'altText' },
  ];

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/products/${product.id}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: selectedFields,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        onSuccess(data.data);
      } else {
        setError(data.message || 'Optimization failed');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Optimization error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title={`Optimize ${product?.title}`}
      primaryAction={{
        content: 'Optimize',
        onAction: handleOptimize,
        loading,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <Stack vertical>
          {error && (
            <Banner status="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          )}

          {success ? (
            <Banner status="success">
              Product SEO optimized successfully!
            </Banner>
          ) : (
            <>
              <ChoiceList
                title="Select fields to optimize"
                choices={fieldOptions}
                selected={selectedFields}
                onChange={setSelectedFields}
                allowMultiple
              />
              <div style={{ marginTop: '16px' }}>
                <Text as="p" color="subdued">
                  AI will generate optimized content for the selected fields based on product information.
                </Text>
              </div>
            </>
          )}
        </Stack>
      </Modal.Section>
    </Modal>
  );
}