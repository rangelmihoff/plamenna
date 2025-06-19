import React from 'react';
import { Page, Layout, Card, Text, Button } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

function SettingsPage() {
    const { t } = useTranslation();
    
    const handleSync = () => {
        // TODO: Call API to sync products
        alert('Synchronization started!');
    };

    return (
        <Page title={t('settings.title')}>
            <Layout>
                <Layout.Section>
                    <Card>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <Text variant="headingMd" as="h2">{t('settings.language')}</Text>
                            <LanguageSwitcher />
                            
                            <Text variant="headingMd" as="h2">{t('settings.dataSync')}</Text>
                            <Text as="p" color="subdued">{t('settings.syncDescription')}</Text>
                            <Button onClick={handleSync}>{t('settings.syncNow')}</Button>
                        </div>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

export default SettingsPage;

