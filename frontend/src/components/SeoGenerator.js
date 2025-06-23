import React, { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  ButtonGroup,
  Stack,
  Select,
  TextField,
  TextContainer,
  Badge,
  ProgressBar,
  Banner,
  Tabs,
  List,
  Thumbnail,
  Modal,
  ChoiceList,
  RangeSlider,
  Tooltip,
  Icon,
  Spinner,
  Collapsible,
  Link
} from '@shopify/polaris';
import {
  StarFilledMajor,
  SearchMajor,
  EditMajor,
  ViewMajor,
  RefreshMajor,
  ExportMinor,
  InfoMinor,
  ChecklistMajor,
  AnalyticsMajor,
  ProductsMajor,
  LanguageMajor
} from '@shopify/polaris-icons';
import { useAPI } from '../hooks/useAPI';
import { useSubscription } from '../hooks/useSubscription';
import { useTranslation } from '../utils/i18n';
import LoadingSpinner from './LoadingSpinner';
import Toast from './Toast';

const SEOGenerator = () => {
  const { apiCall, loading } = useAPI();
  const { subscription, usage, checkLimits } = useSubscription();
  const { t, currentLanguage, changeLanguage } = useTranslation();

  // URL params
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedProductId = urlParams.get('product');

  // State management
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState(null);

  // SEO Generation State
  const [seoResults, setSeoResults] = useState({
    title: '',
    description: '',
    keywords: [],
    score: 0,
    suggestions: []
  });
  const [generateInProgress, setGenerateInProgress] = useState(false);
  const [applyInProgress, setApplyInProgress] = useState(false);

  // Configuration State
  const [seoConfig, setSeoConfig] = useState({
    ai_provider: 'claude',
    language: currentLanguage,
    tone: 'professional',
    focus_keywords: '',
    title_length: 60,
    description_length: 160,
    include_brand: true,
    use_emojis: false
  });

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Available AI providers (based on subscription)
  const getAvailableProviders = () => {
    const allProviders = [
      { label: 'Claude (Anthropic)', value: 'claude' },
      { label: 'GPT-4 (OpenAI)', value: 'openai' },
      { label: 'Gemini (Google)', value: 'gemini' },
      { label: 'DeepSeek', value: 'deepseek' },
      { label: 'Llama', value: 'llama' }
    ];

    if (!subscription) return allProviders.slice(0, 1);

    const limits = {
      'starter': 1,
      'professional': 2,
      'growth': 3,
      'growth_extra': 4,
      'enterprise': 5
    };

    return allProviders.slice(0, limits[subscription.plan_name] || 1);
  };

  const toneOptions = [
    { label: t('seo.tone.professional'), value: 'professional' },
    { label: t('seo.tone.friendly'), value: 'friendly' },
    { label: t('seo.tone.exciting'), value: 'exciting' },
    { label: t('seo.tone.technical'), value: 'technical' },
    { label: t('seo.tone.casual'), value: 'casual' }
  ];

  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Français', value: 'fr' },
    { label: 'Español', value: 'es' },
    { label: 'Deutsch', value: 'de' }
  ];

  const tabs = [
    {
      id: 'single',
      content: t('seo.tabs.single_product'),
      accessibilityLabel: t('seo.tabs.single_product'),
      panelID: 'single-product-panel'
    },
    {
      id: 'bulk',
      content: t('seo.tabs.bulk_generation'),
      accessibilityLabel: t('seo.tabs.bulk_generation'),
      panelID: 'bulk-generation-panel'
    },
    {
      id: 'analytics',
      content: t('seo.tabs.analytics'),
      accessibilityLabel: t('seo.tabs.analytics'),
      panelID: 'analytics-panel'
    }
  ];

  useEffect(() => {
    loadProducts();
    if (preselectedProductId) {
      loadProductDetails(preselectedProductId);
    }
  }, []);

  const loadProducts = async () => {
    try {
      const response = await apiCall('/api/products?limit=100&sort=title&order=asc');
      setProducts(response.products || []);
    } catch (error) {
      setToast({
        message: t('seo.error.loading_products'),
        error: true
      });
    }
  };

  const loadProductDetails = async (productId) => {
    try {
      const product = await apiCall(`/api/products/${productId}`);
      setSelectedProduct(product);
      
      // Pre-fill configuration if product has existing SEO data
      if (product.seo_data) {
        setSeoResults(product.seo_data);
      }
    } catch (error) {
      setToast({
        message: t('seo.error.loading_product'),
        error: true
      });
    }
  };

  const generateSEO = async (type = 'complete') => {
    if (!selectedProduct) {
      setToast({
        message: t('seo.error.select_product'),
        error: true
      });
      return;
    }

    if (!checkLimits('aiQueries', 1)) {
      setToast({
        message: t('seo.error.quota_exceeded'),
        error: true
      });
      return;
    }

    setGenerateInProgress(true);
    try {
      const endpoint = type === 'complete' 
        ? '/api/seo/generate/complete'
        : `/api/seo/generate/${type}`;

      const response = await apiCall(endpoint, 'POST', {
        product_id: selectedProduct.id,
        ...seoConfig
      });

      setSeoResults(response);
      setToast({
        message: t('seo.success.generated'),
        success: true
      });
    } catch (error) {
      setToast({
        message: t('seo.error.generation_failed'),
        error: true
      });
    } finally {
      setGenerateInProgress(false);
    }
  };

  const applySEOToShopify = async () => {
    if (!selectedProduct || !seoResults.title) {
      setToast({
        message: t('seo.error.no_seo_data'),
        error: true
      });
      return;
    }

    setApplyInProgress(true);
    try {
      await apiCall(`/api/seo/apply/${selectedProduct.id}`, 'POST', {
        title: seoResults.title,
        description: seoResults.description,
        keywords: seoResults.keywords
      });

      setToast({
        message: t('seo.success.applied'),
        success: true
      });

      // Update local product data
      setSelectedProduct(prev => ({
        ...prev,
        seo_score: seoResults.score,
        seo_data: seoResults
      }));
    } catch (error) {
      setToast({
        message: t('seo.error.apply_failed'),
        error: true
      });
    } finally {
      setApplyInProgress(false);
    }
  };

  const generateBulkSEO = async () => {
    if (selectedProducts.length === 0) {
      setToast({
        message: t('seo.error.select_products'),
        error: true
      });
      return;
    }

    if (!checkLimits('aiQueries', selectedProducts.length)) {
      setToast({
        message: t('seo.error.bulk_quota_exceeded'),
        error: true
      });
      return;
    }

    setGenerateInProgress(true);
    try {
      await apiCall('/api/seo/generate/bulk', 'POST', {
        product_ids: selectedProducts,
        ...seoConfig
      });

      setToast({
        message: t('seo.success.bulk_generated'),
        success: true
      });

      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      setToast({
        message: t('seo.error.bulk_failed'),
        error: true
      });
    } finally {
      setGenerateInProgress(false);
    }
  };

  const getSEOScore = () => {
    if (!seoResults.score) return 0;
    return Math.round(seoResults.score);
  };

  const getSEOScoreColor = () => {
    const score = getSEOScore();
    if (score >= 80) return 'success';
    if (score >= 60) return 'primary';
    return 'critical';
  };

  const productOptions = products.map(product => ({
    label: product.title,
    value: product.id
  }));

  const renderSingleProductTab = () => (
    <Layout>
      <Layout.Section oneThird>
        <Stack vertical spacing="loose">
          {/* Product Selection */}
          <Card>
            <Stack vertical spacing="loose">
              <Text variant="headingMd">{t('seo.product_selection')}</Text>
              
              <Select
                label={t('seo.select_product')}
                options={[
                  { label: t('seo.choose_product'), value: '' },
                  ...productOptions
                ]}
                value={selectedProduct?.id || ''}
                onChange={(value) => {
                  const product = products.find(p => p.id === value);
                  setSelectedProduct(product);
                  if (product && product.seo_data) {
                    setSeoResults(product.seo_data);
                  } else {
                    setSeoResults({ title: '', description: '', keywords: [], score: 0, suggestions: [] });
                  }
                }}
              />

              {selectedProduct && (
                <Stack vertical spacing="tight">
                  <Stack alignment="center">
                    <Thumbnail
                      source={selectedProduct.image}
                      alt={selectedProduct.title}
                      size="small"
                    />
                    <Stack vertical spacing="none">
                      <Text variant="bodyMd" fontWeight="semibold">
                        {selectedProduct.title}
                      </Text>
                      <Text variant="bodySm" color="subdued">
                        {selectedProduct.sku || t('seo.no_sku')}
                      </Text>
                    </Stack>
                  </Stack>
                  
                  {selectedProduct.seo_score && (
                    <Stack alignment="center">
                      <Text variant="bodySm">
                        {t('seo.current_score')}: {selectedProduct.seo_score}/100
                      </Text>
                      <ProgressBar 
                        progress={selectedProduct.seo_score} 
                        size="small"
                        color={selectedProduct.seo_score >= 80 ? "success" : 
                               selectedProduct.seo_score >= 60 ? "primary" : "critical"}
                      />
                    </Stack>
                  )}
                </Stack>
              )}
            </Stack>
          </Card>

          {/* Configuration */}
          <Card>
            <Stack vertical spacing="loose">
              <Text variant="headingMd">{t('seo.configuration')}</Text>
              
              <Select
                label={t('seo.ai_provider')}
                options={getAvailableProviders()}
                value={seoConfig.ai_provider}
                onChange={(value) => setSeoConfig(prev => ({ ...prev, ai_provider: value }))}
              />

              <Select
                label={t('seo.language')}
                options={languageOptions}
                value={seoConfig.language}
                onChange={(value) => setSeoConfig(prev => ({ ...prev, language: value }))}
              />

              <Select
                label={t('seo.tone')}
                options={toneOptions}
                value={seoConfig.tone}
                onChange={(value) => setSeoConfig(prev => ({ ...prev, tone: value }))}
              />

              <TextField
                label={t('seo.focus_keywords')}
                value={seoConfig.focus_keywords}
                onChange={(value) => setSeoConfig(prev => ({ ...prev, focus_keywords: value }))}
                placeholder={t('seo.keywords_placeholder')}
                helpText={t('seo.keywords_help')}
              />

              <Button
                plain
                onClick={() => setShowAdvanced(!showAdvanced)}
                ariaExpanded={showAdvanced}
                ariaControls="advanced-options"
              >
                {t('seo.advanced_options')}
              </Button>

              <Collapsible
                open={showAdvanced}
                id="advanced-options"
                transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
                expandOnPrint
              >
                <Stack vertical spacing="loose">
                  <RangeSlider
                    label={t('seo.title_length')}
                    value={seoConfig.title_length}
                    min={30}
                    max={80}
                    onChange={(value) => setSeoConfig(prev => ({ ...prev, title_length: value }))}
                    output
                  />

                  <RangeSlider
                    label={t('seo.description_length')}
                    value={seoConfig.description_length}
                    min={120}
                    max={200}
                    onChange={(value) => setSeoConfig(prev => ({ ...prev, description_length: value }))}
                    output
                  />

                  <ChoiceList
                    title={t('seo.additional_options')}
                    choices={[
                      { label: t('seo.include_brand'), value: 'include_brand' },
                      { label: t('seo.use_emojis'), value: 'use_emojis' }
                    ]}
                    selected={[
                      ...(seoConfig.include_brand ? ['include_brand'] : []),
                      ...(seoConfig.use_emojis ? ['use_emojis'] : [])
                    ]}
                    onChange={(selected) => {
                      setSeoConfig(prev => ({
                        ...prev,
                        include_brand: selected.includes('include_brand'),
                        use_emojis: selected.includes('use_emojis')
                      }));
                    }}
                    allowMultiple
                  />
                </Stack>
              </Collapsible>
            </Stack>
          </Card>

          {/* Actions */}
          <Card>
            <Stack vertical spacing="loose">
              <Text variant="headingMd">{t('seo.actions')}</Text>
              
              <Stack vertical spacing="tight">
                <Button
                  primary
                  fullWidth
                  onClick={() => generateSEO('complete')}
                  loading={generateInProgress}
                  disabled={!selectedProduct}
                  icon={StarFilledMajor}
                >
                  {t('seo.generate_complete')}
                </Button>

                <ButtonGroup fullWidth>
                  <Button
                    onClick={() => generateSEO('title')}
                    loading={generateInProgress}
                    disabled={!selectedProduct}
                  >
                    {t('seo.generate_title')}
                  </Button>
                  <Button
                    onClick={() => generateSEO('description')}
                    loading={generateInProgress}
                    disabled={!selectedProduct}
                  >
                    {t('seo.generate_description')}
                  </Button>
                </ButtonGroup>

                {seoResults.title && (
                  <Button
                    fullWidth
                    onClick={applySEOToShopify}
                    loading={applyInProgress}
                    icon={ChecklistMajor}
                  >
                    {t('seo.apply_to_shopify')}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Layout.Section>

      <Layout.Section twoThirds>
        <Stack vertical spacing="loose">
          {/* Results */}
          <Card>
            <Stack vertical spacing="loose">
              <Stack alignment="center" distribution="equalSpacing">
                <Text variant="headingMd">{t('seo.results')}</Text>
                {seoResults.score > 0 && (
                  <Stack alignment="center">
                    <Text variant="headingLg">{getSEOScore()}/100</Text>
                    <ProgressBar 
                      progress={getSEOScore()} 
                      color={getSEOScoreColor()}
                    />
                  </Stack>
                )}
              </Stack>

              {seoResults.title ? (
                <Stack vertical spacing="loose">
                  {/* SEO Title */}
                  <Stack vertical spacing="tight">
                    <Stack alignment="center" distribution="equalSpacing">
                      <Text variant="bodyLg" fontWeight="semibold">
                        {t('seo.title')}
                      </Text>
                      <Badge status={seoResults.title.length <= 60 ? 'success' : 'warning'}>
                        {seoResults.title.length} {t('seo.characters')}
                      </Badge>
                    </Stack>
                    <Card subdued>
                      <TextContainer>
                        <Text variant="bodyMd">{seoResults.title}</Text>
                      </TextContainer>
                    </Card>
                  </Stack>

                  {/* Meta Description */}
                  <Stack vertical spacing="tight">
                    <Stack alignment="center" distribution="equalSpacing">
                      <Text variant="bodyLg" fontWeight="semibold">
                        {t('seo.description')}
                      </Text>
                      <Badge status={seoResults.description.length <= 160 ? 'success' : 'warning'}>
                        {seoResults.description.length} {t('seo.characters')}
                      </Badge>
                    </Stack>
                    <Card subdued>
                      <TextContainer>
                        <Text variant="bodyMd">{seoResults.description}</Text>
                      </TextContainer>
                    </Card>
                  </Stack>

                  {/* Keywords */}
                  {seoResults.keywords && seoResults.keywords.length > 0 && (
                    <Stack vertical spacing="tight">
                      <Text variant="bodyLg" fontWeight="semibold">
                        {t('seo.keywords')}
                      </Text>
                      <Stack wrap>
                        {seoResults.keywords.map((keyword, index) => (
                          <Badge key={index}>{keyword}</Badge>
                        ))}
                      </Stack>
                    </Stack>
                  )}

                  {/* Suggestions */}
                  {seoResults.suggestions && seoResults.suggestions.length > 0 && (
                    <Stack vertical spacing="tight">
                      <Text variant="bodyLg" fontWeight="semibold">
                        {t('seo.suggestions')}
                      </Text>
                      <Card subdued>
                        <List type="bullet">
                          {seoResults.suggestions.map((suggestion, index) => (
                            <List.Item key={index}>{suggestion}</List.Item>
                          ))}
                        </List>
                      </Card>
                    </Stack>
                  )}
                </Stack>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Icon source={SearchMajor} color="subdued" />
                  <Text variant="bodyMd" color="subdued">
                    {t('seo.no_results')}
                  </Text>
                </div>
              )}
            </Stack>
          </Card>
        </Stack>
      </Layout.Section>
    </Layout>
  );

  const renderBulkTab = () => (
    <Layout>
      <Layout.Section>
        <Card>
          <Stack vertical spacing="loose">
            <Text variant="headingMd">{t('seo.bulk_generation')}</Text>
            
            <Banner status="info">
              <Text variant="bodyMd">
                {t('seo.bulk_warning', {
                  remaining: (subscription?.limits?.aiQueries || 50) - (usage?.aiQueries || 0)
                })}
              </Text>
            </Banner>

            {/* Bulk Product Selection */}
            <Text variant="bodyLg" fontWeight="semibold">
              {t('seo.select_products_bulk')}
            </Text>

            {/* Products grid/list for bulk selection */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Stack vertical spacing="tight">
                {products.map(product => (
                  <Card key={product.id} subdued={!selectedProducts.includes(product.id)}>
                    <Stack alignment="center" distribution="equalSpacing">
                      <Stack alignment="center">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(prev => [...prev, product.id]);
                            } else {
                              setSelectedProducts(prev => prev.filter(id => id !== product.id));
                            }
                          }}
                        />
                        <Thumbnail
                          source={product.image}
                          alt={product.title}
                          size="small"
                        />
                        <Stack vertical spacing="none">
                          <Text variant="bodyMd">{product.title}</Text>
                          <Text variant="bodySm" color="subdued">
                            {product.seo_score ? `${t('seo.score')}: ${product.seo_score}/100` : t('seo.not_optimized')}
                          </Text>
                        </Stack>
                      </Stack>
                      
                      {product.seo_score && (
                        <Badge status={product.seo_score >= 80 ? 'success' : 
                                      product.seo_score >= 60 ? 'attention' : 'critical'}>
                          {product.seo_score >= 80 ? t('seo.excellent') : 
                           product.seo_score >= 60 ? t('seo.good') : t('seo.needs_work')}
                        </Badge>
                      )}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </div>

            <Stack alignment="center" distribution="equalSpacing">
              <Text variant="bodyMd">
                {t('seo.selected_count', { count: selectedProducts.length })}
              </Text>
              
              <ButtonGroup>
                <Button
                  onClick={() => setSelectedProducts(products.map(p => p.id))}
                  disabled={products.length === 0}
                >
                  {t('seo.select_all')}
                </Button>
                <Button
                  onClick={() => setSelectedProducts([])}
                  disabled={selectedProducts.length === 0}
                >
                  {t('seo.clear_selection')}
                </Button>
              </ButtonGroup>
            </Stack>

            <Button
              primary
              size="large"
              onClick={generateBulkSEO}
              loading={generateInProgress}
              disabled={selectedProducts.length === 0}
              icon={StarFilledMajor}
            >
              {t('seo.generate_bulk_seo')}
            </Button>
          </Stack>
        </Card>
      </Layout.Section>
    </Layout>
  );

  if (loading && !products.length) {
    return <LoadingSpinner />;
  }

  return (
    <Page
      title={t('seo.title')}
      subtitle={t('seo.subtitle')}
      breadcrumbs={[{ content: t('navigation.dashboard'), url: '/' }]}
    >
      <Layout>
        {/* Usage Status */}
        <Layout.Section>
          <Banner
            status={usage?.aiQueries / (subscription?.limits?.aiQueries || 50) > 0.8 ? 'warning' : 'info'}
            action={usage?.aiQueries / (subscription?.limits?.aiQueries || 50) > 0.8 ? {
              content: t('seo.upgrade'),
              url: '/subscription'
            } : undefined}
          >
            <Text variant="bodyMd">
              {t('seo.usage_status', {
                used: usage?.aiQueries || 0,
                total: subscription?.limits?.aiQueries || 50,
                percentage: Math.round(((usage?.aiQueries || 0) / (subscription?.limits?.aiQueries || 50)) * 100)
              })}
            </Text>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Tabs
              tabs={tabs}
              selected={activeTab}
              onSelect={setActiveTab}
            >
              {activeTab === 0 && renderSingleProductTab()}
              {activeTab === 1 && renderBulkTab()}
              {activeTab === 2 && (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Icon source={AnalyticsMajor} />
                  <Text variant="headingMd">{t('seo.analytics_coming_soon')}</Text>
                  <Text variant="bodyMd" color="subdued">
                    {t('seo.analytics_description')}
                  </Text>
                </div>
              )}
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>

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

export default SEOGenerator;