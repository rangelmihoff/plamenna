import React from 'react';
import { Frame, TopBar, Navigation as PolarisNavigation } from '@shopify/polaris';
import {
    HomeIcon,
    ProductIcon,
    ChartLineIcon,
    CreditCardIcon,
    SettingsIcon
} from '@shopify/polaris-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';


function AppNavigation({ children }) {
    const navigationMarkup = (
    <PolarisNavigation location={window.location.pathname}>
      <PolarisNavigation.Section
        items={[
          {
            url: '/',
            label: 'Dashboard',
            icon: HomeIcon,
            selected: window.location.pathname === '/'
          },
          {
            url: '/products',
            label: 'Products',
            icon: ProductIcon,
            selected: window.location.pathname === '/products'
          },
          {
            url: '/seo-generator',
            label: 'SEO Generator',
            icon: ChartLineIcon,
            selected: window.location.pathname === '/seo-generator'
          },
          {
            url: '/subscription',
            label: 'Subscription',
            icon: CreditCardIcon,
            selected: window.location.pathname === '/subscription'
          },
          {
            url: '/settings',
            label: 'Settings',
            icon: SettingsIcon,
            selected: window.location.pathname === '/settings'
          }
        ]}
      />
    </PolarisNavigation>
  );
  const topBarMarkup = (
    <TopBar showNavigationToggle />
  );
  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={false}
    >
      {children}
    </Frame>
  );
}

export default AppNavigation;

