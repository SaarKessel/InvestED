import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StretchSwitch } from "./StretchSwitch";

describe("EasyUI StretchSwitch", () => {
  it("is a real switch with state", () => {
    const html = renderToStaticMarkup(<StretchSwitch checked onChange={() => {}} aria-label="Memory" />);
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('aria-label="Memory"');
  });
  it("reflects the off state", () => {
    const html = renderToStaticMarkup(<StretchSwitch checked={false} onChange={() => {}} />);
    expect(html).toContain('aria-checked="false"');
  });
  it("respects disabled", () => {
    const html = renderToStaticMarkup(<StretchSwitch disabled />);
    expect(html).toContain('disabled=""');
  });
});
