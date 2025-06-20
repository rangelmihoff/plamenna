import React from 'react';
import { Page, Card, Text, Layout } from '@shopify/polaris';

const Analytics = () => {
    return (
        <Page title="Analytics" subtitle="SEO performance insights">
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        <Text variant="headingMd" as="h2">
                            Analytics Dashboard
                        </Text>
                        <Text variant="bodyMd" as="p" style={{ marginTop: '16px' }}>
                            SEO analytics and performance metrics coming soon...
                        </Text>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
};

export default Analytics;