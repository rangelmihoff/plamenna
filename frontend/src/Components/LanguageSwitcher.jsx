import { Select } from '@shopify/polaris';
import { useAppQuery } from '../hooks/useAppQuery';
import { useAuthenticatedFetch } from '../hooks/useAppQuery';
import { useState, useEffect } from 'react';

export function LanguageSwitcher() {
  const [selected, setSelected] = useState('en');
  const fetch = useAuthenticatedFetch();

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const response = await fetch('/api/shop/settings');
        const data = await response.json();
        if (data.success && data.data.language) {
          setSelected(data.data.language);
        }
      } catch (error) {
        console.error('Failed to load language:', error);
      }
    };

    loadLanguage();
  }, []);

  const handleChange = async (value) => {
    setSelected(value);
    try {
      await fetch('/api/shop/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: value,
        }),
      });
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  return (
    <Select
      label="Language"
      labelInline
      options={[
        { label: 'English', value: 'en' },
        { label: 'French', value: 'fr' },
        { label: 'Spanish', value: 'es' },
        { label: 'German', value: 'de' },
      ]}
      value={selected}
      onChange={handleChange}
    />
  );
}