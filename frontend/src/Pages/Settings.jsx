import { Page, Layout, Card } from '@shopify/polaris';
import { PlanUsage } from '../components/PlanUsage';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export default function SettingsPage() {
  return (
    <Page title="Settings">
      <Layout>
        <Layout.Section>
          <Card title="Subscription" sectioned>
            <PlanUsage />
          </Card>
        </Layout.Section>
        <Layout.Section secondary>
          <Card title="Preferences" sectioned>
            <LanguageSwitcher />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}