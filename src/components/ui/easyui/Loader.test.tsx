import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Loader } from "./Loader";

describe("EasyUI Loader", () => {
  it.each(["arc", "dots", "line", "rings"] as const)("announces %s loading politely", (variant) => {
    const html = renderToStaticMarkup(<Loader variant={variant} label="Loading data" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading data");
  });

  it("stays decorative when nested in another live region", () => {
    const html = renderToStaticMarkup(<Loader variant="dots" label={null} />);
    expect(html).not.toContain('role="status"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("drops the spin animation under reduced motion", () => {
    const html = renderToStaticMarkup(<Loader variant="arc" reduceMotion label="Loading" />);
    expect(html).not.toContain("animate-spin");
  });
});
