import React, { useState, useEffect } from 'react';
import { Page, Layout, Grid } from '@shopify/polaris';
import axios from 'axios';
import PlanCard from '../components/PlanCard';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

function PricingPage() {
    const [plans, setPlans] = useState([]);
    const { shopStatus } = useAppContext();
    const { t } = useTranslation();

    useEffect(() => {
        axios.get('/api/plans')
            .then(response => setPlans(response.data))
            .catch(error => console.error("Error fetching plans:", error));
    }, []);

    return (
        <Page title={t('pricing.title')} fullWidth>
            <Layout>
                <Layout.Section>
                     <Grid>
                        {plans.map(plan => (
                             <Grid.Cell key={plan._id} columnSpan={{xs: 6, sm: 3, md: 3, lg: 4, xl: 4}}>
                                <PlanCard
                                    plan={plan}
                                    isCurrentPlan={shopStatus?.plan?._id === plan._id}
                                />
                             </Grid.Cell>
                        ))}
                    </Grid>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

export default PricingPage;

