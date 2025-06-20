import React from 'react';
import { Page, Card, Text, Layout } from '@shopify/polaris';

const Subscription = () => {
    return (
        <Page title="Subscription" subtitle="Manage your plan and billing">
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        <Text variant="headingMd" as="h2">
                            Subscription Management
                        </Text>
                        <Text variant="bodyMd" as="p" style={{ marginTop: '16px' }}>
                            Plan management and billing coming soon...
                        </Text>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
};

export default Subscription;