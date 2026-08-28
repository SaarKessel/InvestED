import { Layout } from "@/components/layout/Layout";
import { useLanguage } from "@/context/languageContext";

export function TermsPage() {
  const { t } = useLanguage();

  return (
    <Layout>
      <section className="container max-w-2xl py-16 md:py-24">
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">{t("terms_title")}</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>{t("terms_updated")}</p>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">{t("terms_h2_1")}</h2>
            <p>{t("terms_p_1")}</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">{t("terms_h2_2")}</h2>
            <p>{t("terms_p_2")}</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">{t("terms_h2_3_full")}</h2>
            <p>{t("terms_p_3_full")}</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">{t("terms_h2_4_full")}</h2>
            <p>{t("terms_p_4_full")}</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">{t("terms_h2_5_full")}</h2>
            <p>{t("terms_p_5_full")}</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
