import { Layout } from "@/components/layout/Layout";
import { AIChatCard } from "@/components/dashboard/AIChatCard";

export default function AICopilotPage() {
  return (
    <Layout>
      <section className="container py-6 md:py-10">
        <AIChatCard />
      </section>
    </Layout>
  );
}
