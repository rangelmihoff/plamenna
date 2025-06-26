import { Card, ResourceList, Thumbnail, Text, Badge } from '@shopify/polaris';
import { useAppQuery } from '../hooks/useAppQuery';
import { useState, useEffect } from 'react';

export function TopProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetch = useAppQuery();

  useEffect(() => {
    const loadTopProducts = async () => {
      try {
        const data = await fetch('/api/products?limit=5&sort=-views');
        setProducts(data.data);
      } catch (error) {
        console.error('Failed to load top products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTopProducts();
  }, []);

  return (
    <Card title="Top Performing Products" sectioned>
      <ResourceList
        loading={loading}
        items={products}
        renderItem={(product) => {
          const media = product.featuredImage && (
            <Thumbnail
              source={product.featuredImage}
              alt={product.title}
            />
          );

          return (
            <ResourceList.Item
              id={product.id}
              media={media}
              accessibilityLabel={`View ${product.title}`}
            >
              <Text variant="bodyMd" fontWeight="bold" as="h3">
                {product.title}
              </Text>
              <div style={{ marginTop: '4px' }}>
                <Badge status={product.aiOptimized ? 'success' : 'attention'}>
                  {product.aiOptimized ? 'SEO Optimized' : 'Needs Optimization'}
                </Badge>
              </div>
              <div>Price: ${product.price}</div>
              <div>Stock: {product.inventoryQuantity}</div>
            </ResourceList.Item>
          );
        }}
      />
    </Card>
  );
}