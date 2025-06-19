import React, { useState, useEffect } from 'react';
import { Page, Card, ResourceList, ResourceItem, Avatar, Text } from '@shopify/polaris';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        setLoading(true);
        axios.get('/api/products')
            .then(res => {
                setProducts(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching products", err);
                setLoading(false);
            });
    }, []);

    return (
        <Page title={t('products.title')}>
            <Card>
                <ResourceList
                    resourceName={{ singular: 'product', plural: 'products' }}
                    items={products}
                    loading={loading}
                    renderItem={(item) => {
                        const { id, title, handle, image } = item;
                        const media = <Avatar customer size="md" name={title} source={image?.src} />;

                        return (
                            <ResourceItem
                                id={id}
                                media={media}
                                accessibilityLabel={`View details for ${title}`}
                                onClick={() => {
                                    // TODO: Open a modal for optimization
                                    console.log('Selected product:', id);
                                }}
                            >
                                <Text variant="bodyMd" fontWeight="bold" as="h3">
                                    {title}
                                </Text>
                            </ResourceItem>
                        );
                    }}
                />
            </Card>
        </Page>
    );
}

export default ProductsPage;

