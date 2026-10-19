import { useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ToastProvider, useToast } from "./toast";

function Trigger() {
  const toast = useToast();
  useEffect(() => {
    toast.push({ title: "Saved", variant: "success" });
  }, [toast]);
  return <p>trigger</p>;
}

describe("EasyUI toast system", () => {
  it("provides a push function through context", () => {
    const html = renderToStaticMarkup(<ToastProvider><Trigger /></ToastProvider>);
    expect(html).toContain("trigger");
  });
  it("throws a clear error outside the provider", () => {
    expect(() => renderToStaticMarkup(<Trigger />)).toThrow(/ToastProvider/);
  });
});
