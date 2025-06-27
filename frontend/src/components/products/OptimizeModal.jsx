// frontend/src/components/products/OptimizeModal.jsx
// The modal component for the AI SEO Optimizer.

import { useState, useCallback } from 'react';
import { Modal, BlockStack, Select, RadioButton, Text, TextArea, Button, Spinner, Card } from '@shopify/polaris';
import { useTranslation } from 'react-i18next';
import { useShop } from '../../hooks/useShop';
import { useGenerateSeoMutation } from '../../hooks/useAI';
import { useQueryClient } from '@tanstack/react-query';
import { AI_PROVIDER_CONFIG } from '../../../../backend/config/aiProviders'; // We can get this from backend or duplicate it

const OptimizeModal = ({ isOpen, onClose, product }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { data: shopData } = useShop();
    const seoMutation = useGenerateSeoMutation();

    const [selectedProvider, setSelectedProvider] = useState('');
    const [contentType, setContentType] = useState('metaTitle');
    const [customInstruction, setCustomInstruction] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');

    const planProviders = shopData?.plan?.aiProviders || [];
    const providerOptions = planProviders.map(p => ({ label: AI_PROVIDER_CONFIG[p]?.name || p, value: p }));

    const handleGenerate = useCallback(() => {
        if (!selectedProvider) {
            // Add user feedback, e.g., a toast message
            return;
        }
        seoMutation.mutate({
            productId: product._id,
            provider: selectedProvider,
            contentType,
            customInstruction,
        }, {
            onSuccess: (data) => {
                setGeneratedContent(data.content);
            }
        });
    }, [selectedProvider, product._id, contentType, customInstruction, seoMutation]);

    const handleApply = () => {
        // Here you would call another mutation to save the generated content to the product
        // e.g., useAppMutation({ url: `/api/products/${product._id}`, method: 'put' })
        console.log("Applying content:", generatedContent);
        // After applying, invalidate the product query to refetch data
        queryClient.invalidateQueries({ queryKey: ['products'] });
        onClose();
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={`${t('optimizerModal.title')} "${product.title}"`}
            primaryAction={{
                content: t('optimizerModal.apply'),
                onAction: handleApply,
                disabled: !generatedContent,
            }}
            secondaryActions={[{
                content: t('optimizerModal.close'),
                onAction: onClose,
            }]}
        >
            <Modal.Section>
                <BlockStack gap="500">
                    <Select
                        label={t('optimizerModal.selectProvider')}
                        options={providerOptions}
                        onChange={setSelectedProvider}
                        value={selectedProvider}
                        placeholder="--"
                    />
                    
                    <BlockStack gap="300">
                        <Text as="p" fontWeight="semibold">{t('optimizerModal.selectContent')}</Text>
                        <RadioButton label={t('optimizerModal.metaTitle')} checked={contentType === 'metaTitle'} onChange={() => setContentType('metaTitle')} />
                        <RadioButton label={t('optimizerModal.metaDescription')} checked={contentType === 'metaDescription'} onChange={() => setContentType('metaDescription')} />
                        <RadioButton label={t('optimizerModal.altText')} checked={contentType === 'altText'} onChange={() => setContentType('altText')} />
                    </BlockStack>
                    
                    <TextArea
                        label={t('optimizerModal.customInstruction')}
                        value={customInstruction}
                        onChange={setCustomInstruction}
                        autoComplete="off"
                        placeholder={t('optimizerModal.customInstructionPlaceholder')}
                    />

                    <Button onClick={handleGenerate} loading={seoMutation.isLoading} disabled={!selectedProvider}>
                        {t('optimizerModal.generate')}
                    </Button>
                    
                    {seoMutation.isLoading && <Spinner size="small" />}
                    
                    {generatedContent && (
                        <Card>
                           <BlockStack gap="200" padding="400">
                             <Text as="p" fontWeight="semibold">{t('optimizerModal.generatedContent')}</Text>
                             <Text as="p" tone="subdued">{generatedContent}</Text>
                           </BlockStack>
                        </Card>
                    )}
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
};

export default OptimizeModal;
