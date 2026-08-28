import { Layout } from "@/components/layout/Layout";
import { useLanguage } from "@/context/languageContext";

export function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <Layout>
      <section className="container max-w-2xl py-16 md:py-24">
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">{t("privacy_title")}</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>{t("privacy_updated")}</p>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">{t("privacy_h2_collected")}</h2>
            <p>{t("privacy_p_collected")}</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">{t("privacy_h2_ai")}</h2>
            <p>{t("privacy_p_ai")}</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">{t("privacy_h2_cookies")}</h2>
            <p>{t("privacy_p_cookies")}</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">{t("privacy_h2_thirdparty_full")}</h2>
            <p>{t("privacy_p_thirdparty_full")}</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">{t("privacy_h2_contact_full")}</h2>
            <p>{t("privacy_p_contact_full")}</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
