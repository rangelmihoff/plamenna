import React, { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  DataTable,
  Button,
  ButtonGroup,
  Stack,
  Filters,
  Pagination,
  Badge,
  Thumbnail,
  Modal,
  TextField,
  Select,
  ChoiceList,
  Banner,
  EmptyState,
  Spinner,
  ProgressBar,
  Tooltip,
  Icon
} from '@shopify/polaris';
import {
  SearchMajor,
  FilterMajor,
  ExportMinor,
  RefreshMajor,
  EditMajor,
  StarFilledMajor,
  ProductsMajor,
  ImageMajor
} from '@shopify/polaris-icons';
import { useAPI } from '../hooks/useAPI';
import { useSubscription } from '../hooks/useSubscription';
import { useTranslation } from '../utils/i18n';
import LoadingSpinner from './LoadingSpinner';
import Toast from './Toast';
import Modal from './Modal';

const ProductsList = () => {
  const { apiCall, loading } = useAPI();
  const { subscription, usage, checkLimits } = useSubscription();
  const { t } = useTranslation();

  // State management
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [toast, setToast] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Filtering state
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({
    status: [],
    seo_score: [],
    category: [],
    sync_status: []
  });
  const [sortOrder, setSortOrder] = useState('updated_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkInProgress, setBulkInProgress] = useState(false);

  // Filter options
  const filterOptions = [
    {
      key: 'seo_score',
      label: t('products.filters.seo_score'),
      filter: (
        <ChoiceList
          title={t('products.filters.seo_score')}
          titleHidden
          choices={[
            { label: t('products.filters.excellent'), value: '80-100' },
            { label: t('products.filters.good'), value: '60-79' },
            { label: t('products.filters.needs_work'), value: '1-59' },
            { label: t('products.filters.not_optimized'), value: '0' }
          ]}
          selected={filters.seo_score}
          onChange={(value) => setFilters(prev => ({ ...prev, seo_score: value }))}
          allowMultiple
        />
      ),
      shortcut: true
    },
    {
      key: 'status',
      label: t('products.filters.status'),
      filter: (
        <ChoiceList
          title={t('products.filters.status')}
          titleHidden
          choices={[
            { label: t('products.status.active'), value: 'active' },
            { label: t('products.status.draft'), value: 'draft' },
            { label: t('products.status.archived'), value: 'archived' }
          ]}
          selected={filters.status}
          onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          allowMultiple
        />
      )
    },
    {
      key: 'sync_status',
      label: t('products.filters.sync_status'),
      filter: (
        <ChoiceList
          title={t('products.filters.sync_status')}
          titleHidden
          choices={[
            { label: t('products.sync.synced'), value: 'synced' },
            { label: t('products.sync.pending'), value: 'pending' },
            { label: t('products.sync.error'), value: 'error' }
          ]}
          selected={filters.sync_status}
          onChange={(value) => setFilters(prev => ({ ...prev, sync_status: value }))}
          allowMultiple
        />
      )
    }
  ];

  const sortOptions = [
    { label: t('products.sort.updated'), value: 'updated_at' },
    { label: t('products.sort.name'), value: 'title' },
    { label: t('products.sort.seo_score'), value: 'seo_score' },
    { label: t('products.sort.created'), value: 'created_at' }
  ];

  const bulkActions = [
    { label: t('products.bulk.generate_seo'), value: 'generate_seo' },
    { label: t('products.bulk.sync_to_shopify'), value: 'sync_shopify' },
    { label: t('products.bulk.export_data'), value: 'export' }
  ];

  useEffect(() => {
    loadProducts();
  }, [currentPage, searchValue, filters, sortOrder, sortDirection]);

  const loadProducts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        sort: sortOrder,
        order: sortDirection,
        search: searchValue
      });

      // Add filters to params
      Object.entries(filters).forEach(([key, values]) => {
        if (values.length > 0) {
          params.append(key, values.join(','));
        }
      });

      const response = await apiCall(`/api/products?${params}`);
      setProducts(response.products || []);
      setTotalProducts(response.total || 0);
    } catch (error) {
      setToast({
        message: t('products.error.loading'),
        error: true
      });
    }
  };

  const handleSync = async () => {
    setSyncInProgress(true);
    try {
      await apiCall('/api/products/sync', 'POST');
      setToast({
        message: t('products.sync.started'),
        success: true
      });
      setTimeout(loadProducts, 2000);
    } catch (error) {
      setToast({
        message: t('products.sync.error'),
        error: true
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.length === 0) return;

    setBulkInProgress(true);
    try {
      switch (bulkAction) {
        case 'generate_seo':
          if (!checkLimits('aiQueries', selectedProducts.length)) {
            setToast({
              message: t('products.error.quota_exceeded'),
              error: true
            });
            return;
          }
          await apiCall('/api/seo/generate/bulk', 'POST', {
            product_ids: selectedProducts
          });
          setToast({
            message: t('products.bulk.seo_generated'),
            success: true
          });
          break;

        case 'sync_shopify':
          await apiCall('/api/products/bulk', 'PUT', {
            product_ids: selectedProducts,
            action: 'sync'
          });
          setToast({
            message: t('products.bulk.synced'),
            success: true
          });
          break;

        case 'export':
          const exportData = await apiCall('/api/products/export', 'POST', {
            product_ids: selectedProducts
          });
          // Download CSV
          const blob = new Blob([exportData.csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `products_export_${Date.now()}.csv`;
          a.click();
          setToast({
            message: t('products.bulk.exported'),
            success: true
          });
          break;
      }

      setSelectedProducts([]);
      setShowBulkModal(false);
      loadProducts();
    } catch (error) {
      setToast({
        message: t('products.bulk.error'),
        error: true
      });
    } finally {
      setBulkInProgress(false);
    }
  };

  const handleFiltersClearAll = () => {
    setFilters({
      status: [],
      seo_score: [],
      category: [],
      sync_status: []
    });
    setSearchValue('');
  };

  const getSEOScoreBadge = (score) => {
    if (!score || score === 0) {
      return <Badge status="info">{t('products.not_optimized')}</Badge>;
    }
    if (score >= 80) {
      return <Badge status="success">{t('products.excellent')}</Badge>;
    }
    if (score >= 60) {
      return <Badge status="attention">{t('products.good')}</Badge>;
    }
    return <Badge status="critical">{t('products.needs_work')}</Badge>;
  };

  const getSyncStatusBadge = (syncStatus, lastSync) => {
    switch (syncStatus) {
      case 'synced':
        return <Badge status="success">{t('products.sync.synced')}</Badge>;
      case 'pending':
        return <Badge status="attention">{t('products.sync.pending')}</Badge>;
      case 'error':
        return <Badge status="critical">{t('products.sync.error')}</Badge>;
      default:
        return <Badge status="info">{t('products.sync.never')}</Badge>;
    }
  };

  // Table rows
  const tableRows = products.map(product => {
    const isSelected = selectedProducts.includes(product.id);
    
    return [
      // Checkbox column handled by DataTable
      <Stack alignment="center" spacing="tight">
        <Thumbnail
          source={product.image || ImageMajor}
          alt={product.title}
          size="small"
        />
        <Stack vertical spacing="none">
          <Text variant="bodyMd" fontWeight="semibold" truncate>
            {product.title}
          </Text>
          <Text variant="bodySm" color="subdued" truncate>
            SKU: {product.sku || t('products.no_sku')}
          </Text>
        </Stack>
      </Stack>,
      
      <Badge status={product.status === 'active' ? 'success' : 'critical'}>
        {t(`products.status.${product.status}`)}
      </Badge>,
      
      <Stack vertical spacing="extraTight">
        <Text variant="bodyMd">
          {product.seo_score ? `${product.seo_score}/100` : t('products.not_scored')}
        </Text>
        {product.seo_score && (
          <ProgressBar 
            progress={product.seo_score} 
            size="small"
            color={product.seo_score >= 80 ? "success" : product.seo_score >= 60 ? "primary" : "critical"}
          />
        )}
      </Stack>,
      
      getSEOScoreBadge(product.seo_score),
      
      getSyncStatusBadge(product.sync_status, product.last_sync),
      
      product.last_sync 
        ? new Date(product.last_sync).toLocaleDateString()
        : t('products.never_synced'),
      
      <ButtonGroup>
        <Button 
          plain 
          icon={EditMajor}
          accessibilityLabel={t('products.edit')}
          url={`/products/${product.id}`}
        />
        <Button 
          plain 
          icon={StarFilledMajor}
          accessibilityLabel={t('products.generate_seo')}
          onClick={() => {
            if (checkLimits('aiQueries', 1)) {
              // Navigate to SEO generator
              window.location.href = `/seo-generator?product=${product.id}`;
            } else {
              setToast({
                message: t('products.error.quota_exceeded'),
                error: true
              });
            }
          }}
        />
      </ButtonGroup>
    ];
  });

  const appliedFilters = Object.entries(filters)
    .filter(([key, values]) => values.length > 0)
    .map(([key, values]) => ({
      key,
      label: t(`products.filters.${key}`),
      value: values.join(', ')
    }));

  if (loading && products.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Page
      title={t('products.title')}
      subtitle={t('products.subtitle', { count: totalProducts })}
      primaryAction={{
        content: t('products.sync_products'),
        onAction: handleSync,
        loading: syncInProgress,
        icon: RefreshMajor
      }}
      secondaryActions={[
        {
          content: t('products.bulk_actions'),
          onAction: () => setShowBulkModal(true),
          disabled: selectedProducts.length === 0
        },
        {
          content: t('products.export_all'),
          icon: ExportMinor,
          onAction: () => {
            setBulkAction('export');
            setSelectedProducts(products.map(p => p.id));
            setShowBulkModal(true);
          }
        }
      ]}
    >
      <Layout>
        {/* Usage Warning */}
        {usage?.aiQueries / (subscription?.limits?.aiQueries || 50) > 0.8 && (
          <Layout.Section>
            <Banner
              title={t('products.usage_warning')}
              status="warning"
              action={{
                content: t('products.upgrade_plan'),
                url: '/subscription'
              }}
            >
              <Text variant="bodyMd">
                {t('products.usage_details', {
                  used: usage.aiQueries,
                  total: subscription?.limits?.aiQueries || 50
                })}
              </Text>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            {/* Filters */}
            <Filters
              queryValue={searchValue}
              queryPlaceholder={t('products.search_placeholder')}
              filters={filterOptions}
              appliedFilters={appliedFilters}
              onQueryChange={setSearchValue}
              onQueryClear={() => setSearchValue('')}
              onClearAll={handleFiltersClearAll}
            />

            {/* Sort and View Options */}
            <Stack alignment="center" distribution="equalSpacing" wrap={false}>
              <Stack alignment="center">
                <Text variant="bodyMd" color="subdued">
                  {t('products.sort_by')}:
                </Text>
                <Select
                  options={sortOptions}
                  value={sortOrder}
                  onChange={setSortOrder}
                />
                <Button
                  plain
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Button>
              </Stack>

              <Text variant="bodySm" color="subdued">
                {t('products.showing_results', {
                  start: (currentPage - 1) * pageSize + 1,
                  end: Math.min(currentPage * pageSize, totalProducts),
                  total: totalProducts
                })}
              </Text>
            </Stack>

            {/* Products Table */}
            {products.length > 0 ? (
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                headings={[
                  t('products.table.product'),
                  t('products.table.status'),
                  t('products.table.seo_score'),
                  t('products.table.optimization'),
                  t('products.table.sync_status'),
                  t('products.table.last_sync'),
                  t('products.table.actions')
                ]}
                rows={tableRows}
                selectable
                selectedRows={selectedProducts}
                onSelectionChange={setSelectedProducts}
                sortable={[false, true, true, false, true, true, false]}
                onSort={(index, direction) => {
                  const sortableColumns = ['', 'status', 'seo_score', '', 'sync_status', 'last_sync', ''];
                  const column = sortableColumns[index];
                  if (column) {
                    setSortOrder(column);
                    setSortDirection(direction);
                  }
                }}
                verticalAlign="middle"
                increasedTableDensity
              />
            ) : (
              <EmptyState
                heading={t('products.empty.title')}
                action={{
                  content: t('products.empty.sync_now'),
                  onAction: handleSync
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <Text variant="bodyMd" color="subdued">
                  {t('products.empty.description')}
                </Text>
              </EmptyState>
            )}

            {/* Pagination */}
            {totalProducts > pageSize && (
              <Stack distribution="center">
                <Pagination
                  label={t('products.pagination_label')}
                  hasPrevious={currentPage > 1}
                  onPrevious={() => setCurrentPage(prev => prev - 1)}
                  hasNext={currentPage * pageSize < totalProducts}
                  onNext={() => setCurrentPage(prev => prev + 1)}
                />
              </Stack>
            )}
          </Card>
        </Layout.Section>
      </Layout>

      {/* Bulk Actions Modal */}
      <Modal
        open={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title={t('products.bulk.modal_title')}
        primaryAction={{
          content: t('products.bulk.apply'),
          onAction: handleBulkAction,
          loading: bulkInProgress,
          disabled: !bulkAction
        }}
        secondaryActions={[
          {
            content: t('common.cancel'),
            onAction: () => setShowBulkModal(false)
          }
        ]}
      >
        <Modal.Section>
          <Stack vertical spacing="loose">
            <Text variant="bodyMd">
              {t('products.bulk.description', { count: selectedProducts.length })}
            </Text>

            <Select
              label={t('products.bulk.action_label')}
              options={[
                { label: t('products.bulk.select_action'), value: '' },
                ...bulkActions
              ]}
              value={bulkAction}
              onChange={setBulkAction}
            />

            {bulkAction === 'generate_seo' && (
              <Banner status="info">
                <Text variant="bodyMd">
                  {t('products.bulk.seo_warning', {
                    count: selectedProducts.length,
                    remaining: (subscription?.limits?.aiQueries || 50) - (usage?.aiQueries || 0)
                  })}
                </Text>
              </Banner>
            )}
          </Stack>
        </Modal.Section>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          error={toast.error}
          success={toast.success}
          onDismiss={() => setToast(null)}
        />
      )}
    </Page>
  );
};

export default ProductsList;