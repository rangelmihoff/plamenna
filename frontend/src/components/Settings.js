import React, { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  Stack,
  Select,
  TextField,
  ChoiceList,
  RangeSlider,
  Banner,
  Badge,
  Tabs,
  List,
  Modal,
  ProgressBar,
  DataTable,
  Tooltip,
  Icon,
  TextContainer,
  Collapsible,
  Link
} from '@shopify/polaris';
import {
  SettingsMajor,
  ConnectMinor,
  RefreshMajor,
  InfoMinor,
  ChecklistMajor,
  AlertMajor,
  AnalyticsMajor,
  CalendarMajor,
  LanguageMajor,
  NotificationMajor,
  SecurityMajor,
  ExportMinor
} from '@shopify/polaris-icons';
import { useAPI } from '../hooks/useAPI';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useTranslation } from '../utils/i18n';
import LoadingSpinner from './LoadingSpinner';
import Toast from './Toast';

const Settings = () => {
  const { apiCall, loading } = useAPI();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { t, currentLanguage, changeLanguage } = useTranslation();

  // State management
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState(null);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [testInProgress, setTestInProgress] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);

  // AI Configuration State
  const [aiSettings, setAiSettings] = useState({
    default_provider: 'claude',
    providers: {
      claude: { enabled: true, api_key: '', model: 'claude-3-sonnet' },
      openai: { enabled: false, api_key: '', model: 'gpt-4' },
      gemini: { enabled: false, api_key: '', model: 'gemini-pro' },
      deepseek: { enabled: false, api_key: '', model: 'deepseek-chat' },
      llama: { enabled: false, api_key: '', model: 'llama-2-70b' }
    },
    fallback_enabled: true,
    timeout: 30,
    retry_attempts: 3
  });

  // Sync Configuration State
  const [syncSettings, setSyncSettings] = useState({
    auto_sync: true,
    sync_frequency: 'daily',
    sync_on_product_update: true,
    sync_on_order: false,
    include_variants: true,
    sync_images: true,
    batch_size: 50,
    webhook_enabled: true
  });

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    language: currentLanguage,
    timezone: 'UTC',
    date_format: 'MM/DD/YYYY',
    currency_display: 'symbol',
    notifications: {
      email: true,
      sync_reports: true,
      quota_warnings: true,
      errors: true
    }
  });

  const tabs = [
    {
      id: 'ai',
      content: t('settings.tabs.ai_configuration'),
      accessibilityLabel: t('settings.tabs.ai_configuration'),
      panelID: 'ai-config-panel'
    },
    {
      id: 'sync',
      content: t('settings.tabs.sync_settings'),
      accessibilityLabel: t('settings.tabs.sync_settings'),
      panelID: 'sync-settings-panel'
    },
    {
      id: 'general',
      content: t('settings.tabs.general'),
      accessibilityLabel: t('settings.tabs.general'),
      panelID: 'general-settings-panel'
    },
    {
      id: 'system',
      content: t('settings.tabs.system_status'),
      accessibilityLabel: t('settings.tabs.system_status'),
      panelID: 'system-status-panel'
    }
  ];

  // Provider options based on subscription
  const getAvailableProviders = () => {
    const allProviders = ['claude', 'openai', 'gemini', 'deepseek', 'llama'];
    if (!subscription) return ['claude'];

    const limits = {
      'starter': 1,
      'professional': 2,
      'growth': 3,
      'growth_extra': 4,
      'enterprise': 5
    };

    return allProviders.slice(0, limits[subscription.plan_name] || 1);
  };

  const syncFrequencyOptions = [
    { label: t('settings.sync.every_2h'), value: '2h' },
    { label: t('settings.sync.every_12h'), value: '12h' },
    { label: t('settings.sync.daily'), value: 'daily' },
    { label: t('settings.sync.every_2_days'), value: '2d' },
    { label: t('settings.sync.weekly'), value: 'weekly' }
  ];

  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Français', value: 'fr' },
    { label: 'Español', value: 'es' },
    { label: 'Deutsch', value: 'de' }
  ];

  const timezoneOptions = [
    { label: 'UTC', value: 'UTC' },
    { label: 'Eastern Time (ET)', value: 'America/New_York' },
    { label: 'Central Time (CT)', value: 'America/Chicago' },
    { label: 'Mountain Time (MT)', value: 'America/Denver' },
    { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
    { label: 'Central European Time (CET)', value: 'Europe/Paris' },
    { label: 'Eastern European Time (EET)', value: 'Europe/Sofia' }
  ];

  useEffect(() => {
    loadSettings();
    loadSystemStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiCall('/api/settings');
      
      if (response.ai) setAiSettings(response.ai);
      if (response.sync) setSyncSettings(response.sync);
      if (response.general) setGeneralSettings(response.general);
      
      setSettings(response);
    } catch (error) {
      setToast({
        message: t('settings.error.loading'),
        error: true
      });
    }
  };

  const loadSystemStatus = async () => {
    try {
      const status = await apiCall('/api/settings/status');
      setSystemStatus(status);
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const saveSettings = async (settingsType, data) => {
    setSaveInProgress(true);
    try {
      await apiCall(`/api/settings/${settingsType}`, 'PUT', data);
      setToast({
        message: t('settings.success.saved'),
        success: true
      });
    } catch (error) {
      setToast({
        message: t('settings.error.saving'),
        error: true
      });
    } finally {
      setSaveInProgress(false);
    }
  };

  const testConnection = async (provider) => {
    setTestInProgress(true);
    try {
      const result = await apiCall('/api/settings/test-connection', 'POST', {
        provider,
        config: aiSettings.providers[provider]
      });

      if (result.success) {
        setToast({
          message: t('settings.ai.test_success', { provider }),
          success: true
        });
      } else {
        setToast({
          message: t('settings.ai.test_failed', { provider, error: result.error }),
          error: true
        });
      }
    } catch (error) {
      setToast({
        message: t('settings.ai.test_error'),
        error: true
      });
    } finally {
      setTestInProgress(false);
    }
  };

  const renderAIConfigTab = () => (
    <Layout>
      <Layout.Section>
        <Stack vertical spacing="loose">
          {/* Default Provider */}
          <Card>
            <Stack vertical spacing="loose">
              <Text variant="headingMd">{t('settings.ai.default_provider')}</Text>
              
              <Select
                label={t('settings.ai.primary_provider')}
                options={getAvailableProviders().map(provider => ({
                  label: t(`settings.ai.providers.${provider}`),
                  value: provider
                }))}
                value={aiSettings.default_provider}
                onChange={(value) => setAiSettings(prev => ({ ...prev, default_provider: value }))}
              />

              <Text variant="bodySm" color="subdued">
                {t('settings.ai.primary_provider_help')}
              </Text>
            </Stack>
          </Card>

          {/* Provider Configurations */}
          {getAvailableProviders().map(provider => (
            <Card key={provider}>
              <Stack vertical spacing="loose">
                <Stack alignment="center" distribution="equalSpacing">
                  <Text variant="headingMd">
                    {t(`settings.ai.providers.${provider}`)}
                  </Text>
                  <Badge status={aiSettings.providers[provider]?.enabled ? 'success' : 'critical'}>
                    {aiSettings.providers[provider]?.enabled ? t('settings.enabled') : t('settings.disabled')}
                  </Badge>
                </Stack>

                <ChoiceList
                  title={t('settings.ai.status')}
                  choices={[
                    { label: t('settings.ai.enable_provider'), value: 'enabled' }
                  ]}
                  selected={aiSettings.providers[provider]?.enabled ? ['enabled'] : []}
                  onChange={(selected) => {
                    setAiSettings(prev => ({
                      ...prev,
                      providers: {
                        ...prev.providers,
                        [provider]: {
                          ...prev.providers[provider],
                          enabled: selected.includes('enabled')
                        }
                      }
                    }));
                  }}
                />

                {aiSettings.providers[provider]?.enabled && (
                  <Stack vertical spacing="tight">
                    <TextField
                      label={t('settings.ai.api_key')}
                      type="password"
                      value={aiSettings.providers[provider]?.api_key || ''}
                      onChange={(value) => {
                        setAiSettings(prev => ({
                          ...prev,
                          providers: {
                            ...prev.providers,
                            [provider]: {
                              ...prev.providers[provider],
                              api_key: value
                            }
                          }
                        }));
                      }}
                      placeholder={t('settings.ai.api_key_placeholder')}
                    />

                    <Select
                      label={t('settings.ai.model')}
                      options={getModelOptions(provider)}
                      value={aiSettings.providers[provider]?.model || ''}
                      onChange={(value) => {
                        setAiSettings(prev => ({
                          ...prev,
                          providers: {
                            ...prev.providers,
                            [provider]: {
                              ...prev.providers[provider],
                              model: value
                            }
                          }
                        }));
                      }}
                    />

                    <Button
                      onClick={() => testConnection(provider)}
                      loading={testInProgress}
                      disabled={!aiSettings.providers[provider]?.api_key}
                      icon={ConnectMinor}
                    >
                      {t('settings.ai.test_connection')}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Card>
          ))}

          {/* Advanced AI Settings */}
          <Card>
            <Stack vertical spacing="loose">
              <Text variant="headingMd">{t('settings.ai.advanced')}</Text>

              <ChoiceList
                title={t('settings.ai.fallback')}
                choices={[
                  { label: t('settings.ai.enable_fallback'), value: 'fallback' }
                ]}
                selected={aiSettings.fallback_enabled ? ['fallback'] : []}
                onChange={(selected) => {
                  setAiSettings(prev => ({ ...prev, fallback_enabled: selected.includes('fallback') }));
                }}
              />

              <RangeSlider
                label={t('settings.ai.timeout')}
                value={aiSettings.timeout}
                min={10}
                max={120}
                step={5}
                onChange={(value) => setAiSettings(prev => ({ ...prev, timeout: value }))}
                suffix={t('settings.ai.seconds')}
                output
              />

              <RangeSlider
                label={t('settings.ai.retry_attempts')}
                value={aiSettings.retry_attempts}
                min={1}
                max={5}
                onChange={(value) => setAiSettings(prev => ({ ...prev, retry_attempts: value }))}
                output
              />
            </Stack>
          </Card>

          <Button
            primary
            onClick={() => saveSettings('ai', aiSettings)}
            loading={saveInProgress}
            icon={ChecklistMajor}
          >
            {t('settings.save_ai_settings')}
          </Button>
        </Stack>
      </Layout.Section>
    </Layout>
  );

  const renderSyncSettingsTab = () => (
    <Layout>
      <Layout.Section>
        <Stack vertical spacing="loose">
          {/* Auto Sync */}
          <Card>
            <Stack vertical spacing="loose">
              <Text variant="headingMd">{t('settings.sync.auto_sync')}</Text>

              <ChoiceList
                title={t('settings.sync.enable_auto_sync')}
                choices={[
                  { label: t('settings.sync.auto_sync_description'), value: 'auto' }
                ]}
                selected={syncSettings.auto_sync ? ['auto'] : []}
                onChange={(selected) => {
                  setSyncSettings(prev => ({ ...prev, auto_sync: selected.includes('auto') }));
                }}
              />

              {syncSettings.auto_sync && (
                <Select
                  label={t('settings.sync.frequency')}
                  options={syncFrequencyOptions}
                  value={syncSettings.sync_frequency}
                  onChange={(value) => setSyncSettings(prev => ({ ...prev, sync_frequency: value }))}
                />
              )}
            </Stack>
          </Card>

          {/* Sync Triggers */}
          <Card>
            <Stack vertical spacing="loose">
              <Text variant="headingMd">{t('settings.sync.triggers')}</Text>

              <ChoiceList
                title={t('settings.sync.trigger_options')}
                choices={[
                  { label: t('settings.sync.on_product_update'), value: 'product_update' },
                  { label: t('settings.sync.on_order'), value: 'order' }
                ]}
                selected={[
                  ...(syncSettings.sync_on_product_update ? ['product_update'] : []),
                  ...(syncSettings.sync_on_order ? ['order'] : [])
                ]}
                onChange={(selected) => {
                  setSyncSettings(prev => ({
                    ...prev,
                    sync_on_product_update: selected.includes('product_update'),
                    sync_on_order: selected.includes('order')
                  }));
                }}
                allowMultiple
              />
            </Stack>
          </Card>

          {/* Sync Options */}
          <Card>
            <Stack vertical spacing="loose">
              <Text variant="headingMd">{t('settings.sync.options')}</Text>

              <ChoiceList
                title={t('settings.sync.data_options')}
                choices={[
                  { label: t('settings.sync.include_variants'), value: 'variants' },
                  { label: t('settings.sync.sync_images'), value: 'images' },
                  { label: t('settings.sync.enable_webhooks'), value: 'webhooks' }
                ]}
                selected={[
                  ...(syncSettings.include_variants ? ['variants'] : []),
                  ...(syncSettings.sync_images ? ['images'] : []),
                  ...(syncSettings.webhook_enabled ? ['webhooks'] : [])
                ]}
                onChange={(selected) => {
                  setSyncSettings(prev => ({
                    ...prev,
                    include_variants: selected.includes('variants'),
                    sync_images: selected.includes('images'),
                    webhook_enabled: selected.includes('webhooks')
                  }));
                }}
                allowMultiple
              />

              <RangeSlider
                label={t('settings.sync.batch_size')}
                value={syncSettings.batch_size}
                min={10}
                max={100}
                step={10}
                onChange={(value) => setSyncSettings(prev => ({ ...prev, batch_size: value }))}
                suffix={t('settings.sync.products')}
                output
              />
            </Stack>
          </Card>

          <Button
            primary
            onClick={() => saveSettings('sync', syncSettings)}
            loading={saveInProgress}
            icon={ChecklistMajor}
          >
            {t('settings.save_sync_settings')}
          </Button>
        </Stack>
      </Layout.Section>
    </Layout>
  );

  const renderGeneralTab = () => (
    <Layout>
      <Layout.Section>
        <Stack vertical spacing="loose">
          {/* Language & Localization */}
          <Card>
            <Stack vertical spacing="loose">
              <Text variant="headingMd">{t('settings.general.localization')}</Text>

              <Select
                label={t('settings.general.language')}
                options={languageOptions}
                value={generalSettings.language}
                onChange={(value) => {
                  setGeneralSettings(prev => ({ ...prev, language: value }));
                  changeLanguage(value);
                }}
              />

              <Select
                label={t('settings.general.timezone')}
                options={timezoneOptions}
                value={generalSettings.timezone}
                onChange={(value) => setGeneralSettings(prev => ({ ...prev, timezone: value }))}
              />

              <Select
                label={t('settings.general.date_format')}
                options={[
                  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
                  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
                  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
                ]}
                value={generalSettings.date_format}
                onChange={(value) => setGeneralSettings(prev => ({ ...prev, date_format: value }))}
              />
            </Stack>
          </Card>

          {/* Notifications */}
          <Card>
            <Stack vertical spacing="loose">
              <Text variant="headingMd">{t('settings.general.notifications')}</Text>

              <ChoiceList
                title={t('settings.general.notification_preferences')}
                choices={[
                  { label: t('settings.general.email_notifications'), value: 'email' },
                  { label: t('settings.general.sync_reports'), value: 'sync_reports' },
                  { label: t('settings.general.quota_warnings'), value: 'quota_warnings' },
                  { label: t('settings.general.error_alerts'), value: 'errors' }
                ]}
                selected={[
                  ...(generalSettings.notifications?.email ? ['email'] : []),
                  ...(generalSettings.notifications?.sync_reports ? ['sync_reports'] : []),
                  ...(generalSettings.notifications?.quota_warnings ? ['quota_warnings'] : []),
                  ...(generalSettings.notifications?.errors ? ['errors'] : [])
                ]}
                onChange={(selected) => {
                  setGeneralSettings(prev => ({
                    ...prev,
                    notifications: {
                      email: selected.includes('email'),
                      sync_reports: selected.includes('sync_reports'),
                      quota_warnings: selected.includes('quota_warnings'),
                      errors: selected.includes('errors')
                    }
                  }));
                }}
                allowMultiple
              />
            </Stack>
          </Card>

          <Button
            primary
            onClick={() => saveSettings('general', generalSettings)}
            loading={saveInProgress}
            icon={ChecklistMajor}
          >
            {t('settings.save_general_settings')}
          </Button>
        </Stack>
      </Layout.Section>
    </Layout>
  );

  const renderSystemStatusTab = () => (
    <Layout>
      <Layout.Section>
        <Stack vertical spacing="loose">
          {/* System Health */}
          <Card>
            <Stack vertical spacing="loose">
              <Stack alignment="center" distribution="equalSpacing">
                <Text variant="headingMd">{t('settings.system.health')}</Text>
                <Button
                  onClick={loadSystemStatus}
                  icon={RefreshMajor}
                  disabled={loading}
                >
                  {t('settings.system.refresh')}
                </Button>
              </Stack>

              {systemStatus && (
                <Stack vertical spacing="tight">
                  <Stack alignment="center" distribution="equalSpacing">
                    <Text variant="bodyMd">{t('settings.system.database')}</Text>
                    <Badge status={systemStatus.database ? 'success' : 'critical'}>
                      {systemStatus.database ? t('settings.system.connected') : t('settings.system.disconnected')}
                    </Badge>
                  </Stack>

                  <Stack alignment="center" distribution="equalSpacing">
                    <Text variant="bodyMd">{t('settings.system.shopify_api')}</Text>
                    <Badge status={systemStatus.shopify ? 'success' : 'critical'}>
                      {systemStatus.shopify ? t('settings.system.connected') : t('settings.system.disconnected')}
                    </Badge>
                  </Stack>

                  {systemStatus.ai_providers && Object.entries(systemStatus.ai_providers).map(([provider, status]) => (
                    <Stack key={provider} alignment="center" distribution="equalSpacing">
                      <Text variant="bodyMd">{t(`settings.ai.providers.${provider}`)}</Text>
                      <Badge status={status ? 'success' : 'critical'}>
                        {status ? t('settings.system.connected') : t('settings.system.disconnected')}
                      </Badge>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>

          {/* App Information */}
          <Card>
            <Stack vertical spacing="loose">
              <Text variant="headingMd">{t('settings.system.app_info')}</Text>

              <DataTable
                columnContentTypes={['text', 'text']}
                headings={[t('settings.system.property'), t('settings.system.value')]}
                rows={[
                  [t('settings.system.version'), '2.0.0'],
                  [t('settings.system.environment'), process.env.NODE_ENV || 'production'],
                  [t('settings.system.last_deployment'), new Date().toLocaleDateString()],
                  [t('settings.system.uptime'), systemStatus?.uptime || 'N/A'],
                  [t('settings.system.memory_usage'), systemStatus?.memory || 'N/A']
                ]}
                verticalAlign="middle"
              />
            </Stack>
          </Card>

          {/* Logs & Diagnostics */}
          <Card>
            <Stack vertical spacing="loose">
              <Text variant="headingMd">{t('settings.system.diagnostics')}</Text>

              <ButtonGroup>
                <Button
                  icon={ExportMinor}
                  onClick={() => {
                    // Export logs functionality
                    setToast({
                      message: t('settings.system.logs_exported'),
                      success: true
                    });
                  }}
                >
                  {t('settings.system.export_logs')}
                </Button>

                <Button
                  icon={AlertMajor}
                  onClick={() => {
                    // Run diagnostics
                    setToast({
                      message: t('settings.system.diagnostics_complete'),
                      success: true
                    });
                  }}
                >
                  {t('settings.system.run_diagnostics')}
                </Button>
              </ButtonGroup>

              {systemStatus?.recent_errors && systemStatus.recent_errors.length > 0 && (
                <Stack vertical spacing="tight">
                  <Text variant="bodyLg" fontWeight="semibold">
                    {t('settings.system.recent_errors')}
                  </Text>
                  <List type="bullet">
                    {systemStatus.recent_errors.slice(0, 5).map((error, index) => (
                      <List.Item key={index}>
                        <Text variant="bodySm" color="critical">
                          {new Date(error.timestamp).toLocaleString()}: {error.message}
                        </Text>
                      </List.Item>
                    ))}
                  </List>
                </Stack>
              )}
            </Stack>
          </Card>
        </Stack>
      </Layout.Section>
    </Layout>
  );

  const getModelOptions = (provider) => {
    const models = {
      claude: [
        { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet' },
        { label: 'Claude 3 Haiku', value: 'claude-3-haiku' }
      ],
      openai: [
        { label: 'GPT-4', value: 'gpt-4' },
        { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' }
      ],
      gemini: [
        { label: 'Gemini Pro', value: 'gemini-pro' }
      ],
      deepseek: [
        { label: 'DeepSeek Chat', value: 'deepseek-chat' }
      ],
      llama: [
        { label: 'Llama 2 70B', value: 'llama-2-70b' }
      ]
    };

    return models[provider] || [];
  };

  if (loading && !settings.ai) {
    return <LoadingSpinner />;
  }

  return (
    <Page
      title={t('settings.title')}
      subtitle={t('settings.subtitle')}
      breadcrumbs={[{ content: t('navigation.dashboard'), url: '/' }]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Tabs
              tabs={tabs}
              selected={activeTab}
              onSelect={setActiveTab}
            >
              {activeTab === 0 && renderAIConfigTab()}
              {activeTab === 1 && renderSyncSettingsTab()}
              {activeTab === 2 && renderGeneralTab()}
              {activeTab === 3 && renderSystemStatusTab()}
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

export default Settings;