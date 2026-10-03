import { describe, expect, it } from "vitest";
import { pickVoice, textLocale, cleanForSpeech, type VoiceLike } from "./speechOutput";
const rows = ["en-US", "he-IL"].flatMap((locale) => [false, true].flatMap((exactLocal) => [false, true].flatMap((sameLocal) => [false, true].map((reverse) => [locale, exactLocal, sameLocal, reverse] as const))));
describe("[sweep] B155 voice selection prefers exact locale before local base-language fallback", () => {
  it.each(rows)("locale %s exact local %s same local %s reverse %s", (locale, exactLocal, sameLocal, reverse) => {
    const base = locale.slice(0, 2);
    const exact: VoiceLike = { lang: locale.replace("-", "_"), name: "exact", localService: exactLocal };
    const same: VoiceLike = { lang: `${base}-XX`, name: "same", localService: sameLocal };
    const other: VoiceLike = { lang: "fr-FR", name: "other", localService: true };
    const voices = reverse ? [other, same, exact] : [exact, same, other];
    expect(pickVoice(voices, locale)).toBe(exact);
    expect(pickVoice([same, other], locale)).toBe(same);
    expect(pickVoice([other], locale)).toBeNull();
    expect(pickVoice([], locale)).toBeNull();
  });
});
describe("[hand] B155 speech cleanup removes URL markup and hidden direction noise", () => {
  it("keeps spoken content and Hebrew language identity", () => {
    expect(cleanForSpeech("# Heading\n**Text** https://example.test/page\n```code block```\nשלום\u200f")).toBe("Heading Text שלום");
    expect(textLocale("English only")).toBe("en-US");
    expect(textLocale("English with שלום")).toBe("he-IL");
    const voices = [{ lang: "en-US", name: "remote" }, { lang: "en-US", name: "local", localService: true }];
    expect(pickVoice(voices, "en-US")).toBe(voices[1]);
  });
});
