import React from 'react';
import { Navigation as PolarisNavigation, Frame } from '@shopify/polaris';
import {
    HomeIcon,
    ProductIcon,
    ChartLineIcon,
    SettingsIcon
} from '@shopify/polaris-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';


function Navigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const navigationMarkup = (
        <PolarisNavigation location={location.pathname}>
            <PolarisNavigation.Section
                items={[
                    {
                        url: '/',
                        label: t('navigation.dashboard'),
                        icon: HomeIcon,
                        onClick: () => navigate('/'),
                    },
                    {
                        url: '/products',
                        label: t('navigation.products'),
                        icon: ProductIcon,
                        onClick: () => navigate('/products'),
                    },
                    {
                        url: '/pricing',
                        label: t('navigation.pricing'),
                        icon: ChartLineIcon,
                        onClick: () => navigate('/pricing'),
                    },
                    {
                        url: '/settings',
                        label: t('navigation.settings'),
                        icon: SettingsIcon,
                        onClick: () => navigate('/settings'),
                    },
                ]}
            />
        </PolarisNavigation>
    );
    
    const topBarMarkup = (
        <Frame.TopBar
            showMobileNavigation={true}
            secondaryMenu={<LanguageSwitcher />}
        />
    );


    return (
        <Frame topBar={topBarMarkup} navigation={navigationMarkup}>
            <div/>
        </Frame>
    );
}

export default Navigation;

