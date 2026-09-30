import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Logo } from "./logo";

// Exercise the public import used by the login, sidebar and unavailable shell.
// An upstream merge that restores the OpenShip mark must fail this acceptance.
describe("Ven fork branding acceptance", () => {
  it("renders the approved accessible wordmark through the public Logo import", () => {
    const markup = renderToStaticMarkup(createElement(Logo, { size: 28 }));
    expect(markup).toContain('aria-label="Ven"');
    expect(markup).toContain('role="img"');
    expect(markup).toContain('viewBox="0 0 432 140"');
    expect(markup.match(/<path /g)).toHaveLength(4);
    expect(markup).toContain("height:28px;width:86.4px");
  });

  it("renders the compact mark without squeezing the whole wordmark", () => {
    const markup = renderToStaticMarkup(createElement(Logo, { compact: true, size: 18 }));
    expect(markup).toContain('viewBox="20 20 104 100"');
    expect(markup.match(/<path /g)).toHaveLength(1);
    expect(markup).toContain("height:18px;width:18.72px");
  });

  it("inherits theme foreground and caller classes without browser or remote assets", () => {
    const markup = renderToStaticMarkup(createElement(Logo, { className: "acceptance-class" }));
    expect(markup).toContain("text-foreground acceptance-class");
    expect(markup.match(/fill="currentColor"/g)).toHaveLength(4);
    expect(markup).not.toContain("<img");
    expect(markup).not.toContain("<script");
  });
});
