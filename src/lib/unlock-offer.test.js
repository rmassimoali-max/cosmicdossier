import { describe, expect, test } from "bun:test";
import { buildUnlockOffer } from "./unlock-offer";

const empty = {
  name: "Test",
  dob: "",
  birthTime: "",
  birthPlace: "",
};

describe("context-aware unlock benefits", () => {
  test("astrology-only does not promise personality synthesis or synastry", () => {
    const offer = buildUnlockOffer(empty, true);
    expect(offer.features.join(" ")).toContain("natal chart");
    expect(offer.features.join(" ")).not.toContain("psychological");
    expect(offer.features.join(" ")).not.toContain("relationship");
    expect(offer.additionalNote).toContain("astrology only");
  });

  test("personality-only does not promise natal chart", () => {
    const offer = buildUnlockOffer({ ...empty, mbti: "INFJ" }, false);
    expect(offer.features.join(" ")).toContain("completed assessments");
    expect(offer.features.join(" ")).not.toContain("natal chart");
  });

  test("combined profiles show combined perspectives", () => {
    const offer = buildUnlockOffer({ ...empty, attachment: "secure" }, true);
    expect(offer.features.join(" ")).toContain("Combined astrology");
  });

  test("second person is conditional and never promises unsupported insights", () => {
    const offer = buildUnlockOffer(empty, true, true);
    expect(offer.features.join(" ")).toContain("Second-person dossier");
    expect(offer.additionalNote).toContain("depend on the information");
  });

  test("empty profile does not promise chart or psychological results", () => {
    const offer = buildUnlockOffer(empty, false);
    expect(offer.features).toEqual(["Printable PDF dossier"]);
    expect(offer.additionalNote).toContain("Add birth details");
  });
});
