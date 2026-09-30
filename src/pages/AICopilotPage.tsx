import { Layout } from "@/components/layout/Layout";
import { AIChatCard } from "@/components/dashboard/AIChatCard";

export default function AICopilotPage() {
  return (
    <Layout>
      <div className="relative">
        <section className="container relative z-10 py-6 md:py-10">
          <AIChatCard />
        </section>
      </div>
    </Layout>
  );
}
