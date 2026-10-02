import { Layout } from "@/components/layout/Layout";
import { LinkSandbox } from "@/components/literacy/LinkSandbox";

/** Suspicious-link sandbox: text-only practice for reading a link before trusting it. */
export default function LinkLabPage() {
  return (
    <Layout>
      <section className="container max-w-3xl py-8 md:py-12"><LinkSandbox /></section>
    </Layout>
  );
}
