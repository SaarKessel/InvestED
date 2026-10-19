import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Stepper } from "./Stepper";

const steps = [{ title: "Learn" }, { title: "Practice" }, { title: "Defend" }];

describe("EasyUI Stepper", () => {
  it("marks the current step", () => {
    const html = renderToStaticMarkup(<Stepper steps={steps} current={1} />);
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Practice");
  });
  it("announces completed steps to screen readers", () => {
    const html = renderToStaticMarkup(<Stepper steps={steps} current={1} completedLabel="done" />);
    expect(html).toContain("done");
    expect(html).toContain("sr-only");
  });
  it("renders all step titles in vertical mode", () => {
    const html = renderToStaticMarkup(<Stepper steps={steps} current={0} orientation="vertical" dir="rtl" />);
    for (const s of steps) expect(html).toContain(s.title);
  });
});
