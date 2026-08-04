import { Link } from "react-router-dom";
import { CompassIcon, ArrowLeft } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/primitives";

export function NotFoundPage() {
  return (
    <Layout>
      <section className="container flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CompassIcon className="h-9 w-9" />
        </div>
        <p className="font-display text-6xl font-extrabold gradient-text">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold">׳ ׳¨׳׳” ׳©׳”׳׳›׳× ׳׳׳™׳‘׳•׳“</h1>
        <p className="mt-2 max-w-sm text-muted-foreground">
          ׳”׳¢׳׳•׳“ ׳©׳—׳™׳₪׳©׳× ׳׳ ׳§׳™׳™׳ ׳׳• ׳©׳”׳•׳¡׳¨. ׳‘׳•׳׳• ׳ ׳—׳–׳™׳¨ ׳׳×׳›׳ ׳׳׳¡׳׳•׳ ׳”׳׳׳™׳“׳”.
        </p>
        <Link to="/" className="mt-8">
          <Button size="lg" className="gap-2">
            ׳—׳–׳¨׳” ׳׳“׳£ ׳”׳‘׳™׳×
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </section>
    </Layout>
  );
}

