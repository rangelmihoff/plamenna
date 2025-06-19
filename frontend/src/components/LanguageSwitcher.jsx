import React from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonGroup, Button } from '@shopify/polaris';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <ButtonGroup segmented>
            <Button onClick={() => changeLanguage('en')} pressed={i18n.language === 'en'}>EN</Button>
            <Button onClick={() => changeLanguage('de')} pressed={i18n.language === 'de'}>DE</Button>
            <Button onClick={() => changeLanguage('fr')} pressed={i18n.language === 'fr'}>FR</Button>
            <Button onClick={() => changeLanguage('es')} pressed={i18n.language === 'es'}>ES</Button>
        </ButtonGroup>
    );
};

export default LanguageSwitcher;

