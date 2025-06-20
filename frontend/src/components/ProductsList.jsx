import React from 'react';
import { Page, Card, EmptyState } from '@shopify/polaris';
const ProductsList = () => {
  return (
    <Page title="Products">
      <Card sectioned>
        <EmptyState
          heading="No products yet"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          action={{
            content: 'Sync from Shopify',
            onAction: () => console.log('Sync products')
          }}
        >
          <p>Sync your products from Shopify to start optimizing their SEO.</p>
        </EmptyState>
      </Card>
    </Page>
  );
};
export default ProductsList;