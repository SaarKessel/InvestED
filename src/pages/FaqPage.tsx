import { Layout } from "@/components/layout/Layout";
import { Accordion } from "@/components/ui/interactive";
import { useLanguage } from "@/context/languageContext";

export function FaqPage() {
  const { t } = useLanguage();

  const FAQS = [
    { id: "1", q: t("faq_q_1"), a: t("faq_a_1") },
    { id: "2", q: t("faq_q_2"), a: t("faq_a_2") },
    { id: "3", q: t("faq_q_3"), a: t("faq_a_3") },
    { id: "4", q: t("faq_q_4"), a: t("faq_a_4") },
    { id: "5", q: t("faq_q_5"), a: t("faq_a_5") },
    { id: "6", q: t("faq_q_6"), a: t("faq_a_6") },
    { id: "7", q: t("faq_q_7"), a: t("faq_a_7") },
    { id: "8", q: t("faq_q_8"), a: t("faq_a_8") },
  ];

  return (
    <Layout>
      <section className="container max-w-2xl py-16 md:py-24">
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">{t("faq_title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("faq_subtitle_full")}</p>

        <div className="mt-10">
          <Accordion items={FAQS.map((f) => ({ id: f.id, title: f.q, content: f.a }))} />
        </div>
      </section>
    </Layout>
  );
}
