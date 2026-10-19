import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DrawCheckbox } from "./DrawCheckbox";

describe("EasyUI DrawCheckbox", () => {
  it("stays a real labelled checkbox", () => {
    const html = renderToStaticMarkup(<DrawCheckbox label="News alerts" description="Shown on market moves" />);
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("News alerts");
    expect(html).toContain("Shown on market moves");
    expect(html).toContain("<label");
  });
  it("draws the checkmark when checked", () => {
    const html = renderToStaticMarkup(<DrawCheckbox checked onChange={() => {}} />);
    expect(html).toContain('checked=""');
    expect(html).toContain("M3.5 8.5");
  });
  it("renders no checkmark when unchecked", () => {
    const html = renderToStaticMarkup(<DrawCheckbox checked={false} onChange={() => {}} />);
    expect(html).not.toContain("M3.5 8.5");
  });
});
