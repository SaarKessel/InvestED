import { motion } from "framer-motion";
import { Linkedin, MessageCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, Button } from "@/components/ui/primitives";

export function ContactPage() {
  return (
    <Layout>
      <section className="container flex max-w-xl flex-col items-center py-16 text-center md:py-24">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageCircle className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-extrabold md:text-4xl">׳‘׳•׳׳• ׳ ׳“׳‘׳¨</h1>
          <p className="mt-3 text-muted-foreground">
            ׳©׳׳׳•׳×, ׳”׳¦׳¢׳•׳× ׳©׳™׳₪׳•׳¨, ׳”׳–׳“׳׳ ׳•׳™׳•׳× ׳©׳™׳×׳•׳£ ׳₪׳¢׳•׳׳”, ׳׳• ׳¡׳×׳ ׳¨׳•׳¦׳™׳ ׳׳”׳’׳™׳“ ׳©׳׳•׳ ג€” ׳”׳“׳¨׳ ׳”׳›׳™ ׳׳”׳™׳¨׳”
            ׳׳”׳’׳™׳¢ ׳׳׳™׳™ ׳”׳™׳ ׳”׳•׳“׳¢׳” ׳₪׳¨׳˜׳™׳× ׳‘-LinkedIn.
          </p>
        </motion.div>

        <Card className="mt-10 w-full">
          <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
            <a
              href="https://www.linkedin.com/in/saarkessel"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button size="lg" className="w-full gap-2">
                <Linkedin className="h-5 w-5" />
                ׳©׳׳— ׳׳™ ׳”׳•׳“׳¢׳” ׳‘-LinkedIn
              </Button>
            </a>
            <p className="text-xs text-muted-foreground">
              ׳׳ ׳™ ׳׳ ׳¡׳” ׳׳¢׳ ׳•׳× ׳׳›׳ ׳”׳•׳“׳¢׳” ׳×׳•׳ ׳–׳׳ ׳§׳¦׳¨.
            </p>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}

