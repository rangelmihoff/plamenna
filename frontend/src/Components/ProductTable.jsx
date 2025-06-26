import { useState, useEffect } from 'react';
import { Card, DataTable, Pagination, TextField, Badge } from '@shopify/polaris';
import { useAppQuery } from '../hooks/useAppQuery';

export function ProductTable() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const fetch = useAppQuery();

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const data = await fetch(
          `/api/products?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`
        );
        setProducts(data.data);
        setTotalProducts(data.pagination.total);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [page, searchQuery]);

  const rows = products.map((product) => [
    product.title,
    product.price,
    product.inventoryQuantity,
    product.aiOptimized ? (
      <Badge status="success">Optimized</Badge>
    ) : (
      <Badge status="attention">Pending</Badge>
    ),
  ]);

  return (
    <Card>
      <div style={{ padding: '16px' }}>
        <TextField
          label="Search products"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, description or tags"
          autoComplete="off"
        />
      </div>

      <DataTable
        columnContentTypes={['text', 'numeric', 'numeric', 'text']}
        headings={['Title', 'Price', 'Stock', 'SEO Status']}
        rows={rows}
        loading={loading}
      />

      <div style={{ padding: '16px', textAlign: 'center' }}>
        <Pagination
          hasPrevious={page > 1}
          onPrevious={() => setPage(page - 1)}
          hasNext={page * 10 < totalProducts}
          onNext={() => setPage(page + 1)}
          label={`${(page - 1) * 10 + 1}-${Math.min(page * 10, totalProducts)} of ${totalProducts}`}
        />
      </div>
    </Card>
  );
}