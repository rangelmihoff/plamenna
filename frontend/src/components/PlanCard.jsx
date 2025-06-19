import React from 'react';
import { Card, Text, Button, VerticalStack, Divider, List } from '@shopify/polaris';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';


function PlanCard({ plan, isCurrentPlan }) {
    const { refetchStatus } = useAppContext();
    const { t } = useTranslation();

    const handleSelectPlan = async () => {
        try {
            // В реално приложение тук ще се стартира Shopify Billing Flow
            await axios.post('/api/select-plan', { planId: plan._id });
            alert(`You have selected the ${plan.name} plan!`);
            refetchStatus();
        } catch (error) {
            console.error("Error selecting plan:", error);
            alert('Failed to select plan.');
        }
    };

    return (
        <Card>
            <VerticalStack gap="4">
                <Text variant="headingXl" as="h2">{plan.name}</Text>
                <Text variant="heading2xl" as="p">${plan.price}<Text as="span" color="subdued">/mo</Text></Text>

                <Button
                    primary={!isCurrentPlan}
                    disabled={isCurrentPlan}
                    onClick={handleSelectPlan}
                    fullWidth
                >
                    {isCurrentPlan ? t('plans.current') : t('plans.choose')}
                </Button>

                <Divider />

                <List type="bullet">
                    <List.Item>{plan.ai_queries} {t('plans.aiQueries')}</List.Item>
                    <List.Item>{plan.product_limit} {t('plans.products')}</List.Item>
                    <List.Item>{t('plans.syncEvery')} {plan.sync_interval_hours} {t('plans.hours')}</List.Item>
                    <List.Item>{plan.ai_providers_count} {t('plans.aiProviders')}</List.Item>
                </List>
            </VerticalStack>
        </Card>
    );
}

export default PlanCard;

