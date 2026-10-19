import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SpotlightCard } from "./SpotlightCard";

describe("EasyUI SpotlightCard", () => {
  it("renders children inside a card surface", () => {
    const html = renderToStaticMarkup(<SpotlightCard><p>Feature</p></SpotlightCard>);
    expect(html).toContain("Feature");
    expect(html).toContain("bg-card");
  });
  it("marks decorative glow layers hidden", () => {
    const html = renderToStaticMarkup(<SpotlightCard><p>x</p></SpotlightCard>);
    expect(html).toContain('aria-hidden="true"');
  });
});
