import React from 'react';
import { Page, Layout, Card, Text, Button, VerticalStack } from '@shopify/polaris';
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
                        <VerticalStack gap="5">
                            <Text variant="headingMd" as="h2">{t('settings.language')}</Text>
                            <LanguageSwitcher />
                            
                            <Text variant="headingMd" as="h2">{t('settings.dataSync')}</Text>
                            <Text as="p" color="subdued">{t('settings.syncDescription')}</Text>
                            <Button onClick={handleSync}>{t('settings.syncNow')}</Button>
                        </VerticalStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

export default SettingsPage;

