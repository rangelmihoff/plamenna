import { Page, Layout } from '@shopify/polaris';
import { ProductTable } from '../components/ProductTable';
import { SEOOptimizer } from '../components/SEOOptimizer';
import { useState } from 'react';

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <Page title="Products">
      <Layout>
        <Layout.Section>
          <ProductTable onSelectProduct={setSelectedProduct} />
        </Layout.Section>
        {selectedProduct && (
          <Layout.Section secondary>
            <SEOOptimizer productId={selectedProduct} />
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}