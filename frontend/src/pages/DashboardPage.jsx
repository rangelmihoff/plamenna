import React from 'react';
import { Page, Layout, Card, Text } from '@shopify/polaris';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

function DashboardPage() {
    console.log('DashboardPage се рендерира!');
    const { shopStatus, loading } = useAppContext();
    const { t } = useTranslation();

    const planName = shopStatus?.plan?.name || t('dashboard.noPlan');
    const queriesUsed = shopStatus?.current_queries || 0;
    const queriesLimit = shopStatus?.plan?.ai_queries || 0;
    const trialEnds = shopStatus?.trial_ends_at ? new Date(shopStatus.trial_ends_at).toLocaleDateString() : 'N/A';

    return (
        <Page title={t('dashboard.title')}>
            <div style={{background: '#ffe0e0', padding: 16, marginBottom: 16, borderRadius: 8, textAlign: 'center'}}>
                <h2 style={{color: '#b00'}}>Тест: DashboardPage компонентът се рендерира!</h2>
            </div>
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

