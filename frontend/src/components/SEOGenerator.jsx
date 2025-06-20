import React from 'react';
import { Page, Card, Text, Layout } from '@shopify/polaris';

const SEOGenerator = () => {
    return (
        <Page title="SEO Generator" subtitle="AI-powered SEO optimization">
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        <Text variant="headingMd" as="h2">
                            SEO Generator
                        </Text>
                        <Text variant="bodyMd" as="p" style={{ marginTop: '16px' }}>
                            AI-powered SEO generation coming soon...
                        </Text>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
};

export default SEOGenerator;