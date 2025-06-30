// frontend/src/components/dashboard/RecentQueries.jsx
// A component to display a summary of the latest AI queries on the dashboard.

import { useAppQuery } from '../../hooks/useAppQuery';
import { useTranslation } from 'react-i18next';
import { Card, Text, BlockStack, DataTable, Thumbnail, Spinner } from '@shopify/polaris';
// FINAL CORRECTION: The icon is named QuestionIcon.
import { QuestionIcon } from '@shopify/polaris-icons';

const RecentQueries = () => {
    const { t, i18n } = useTranslation();
    const { data: queries, isLoading, isError } = useAppQuery({
        url: '/api/ai/queries',
        queryKey: ['recentQueries'],
    });

    if (isLoading) return <Card.Section><Spinner accessibilityLabel={t('general.loading')} size="large" /></Card.Section>;
    if (isError) return <Card.Section><Text tone="critical">{t('general.error')}</Text></Card.Section>;
    if (!queries || queries.length === 0) {
        return <Card.Section><Text as="p" tone="subdued">{t('recentQueries.noQueries')}</Text></Card.Section>;
    }

    const rows = queries.map(q => [
        <Thumbnail
            // FINAL CORRECTION: Use the correctly imported icon.
            source={q.product?.imageUrl || QuestionIcon}
            alt={q.product?.title || 'General Query'}
            size="small"
        />,
        q.product?.title || 'N/A',
        q.provider.charAt(0).toUpperCase() + q.provider.slice(1),
        q.response.substring(0, 50) + (q.response.length > 50 ? '...' : ''),
        new Date(q.createdAt).toLocaleDateString(i18n.language),
    ]);

    return (
        <DataTable
            columnContentTypes={['text', 'text', 'text', 'text', 'text']}
            headings={[
                '',
                t('recentQueries.product'),
                t('recentQueries.provider'),
                t('recentQueries.response'),
                t('recentQueries.date'),
            ]}
            rows={rows}
            verticalAlign="middle"
        />
    );
};

export default RecentQueries;