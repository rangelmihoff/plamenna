import React from 'react';
import { Page, Layout, Card, Text } from '@shopify/polaris';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

function DashboardPage() {
    const { shopStatus, loading } = useAppContext();
    const { t } = useTranslation();

    const planName = shopStatus?.plan?.name || t('dashboard.noPlan');
    const queriesUsed = shopStatus?.current_queries || 0;
    const queriesLimit = shopStatus?.plan?.ai_queries || 0;
    const trialEnds = shopStatus?.trial_ends_at ? new Date(shopStatus.trial_ends_at).toLocaleDateString() : 'N/A';

    return (
        <Page title={t('dashboard.title')}>
            <Layout>
                <Layout.Section>
                    <Card>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <Text variant="headingLg" as="h2">{t('dashboard.welcome')}</Text>
                            {loading ? <Text as="p">{t('dashboard.loading')}</Text> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <Text as="p">{t('dashboard.currentPlan')}: <strong>{planName}</strong></Text>
                                    <Text as="p">{t('dashboard.queriesUsed')}: {queriesUsed} / {queriesLimit}</Text>
                                    {shopStatus?.plan ? null : (
                                        <Text as="p">{t('dashboard.trialEnds')}: <strong>{trialEnds}</strong></Text>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

export default DashboardPage;

