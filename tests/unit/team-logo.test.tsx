import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TeamLogo } from "@/components/shared/TeamLogo";

describe("TeamLogo", () => {
  it("shows initials when there is no src", () => {
    expect(renderToStaticMarkup(<TeamLogo name="Flamengo" src={null} />)).toContain("FL");
    expect(renderToStaticMarkup(<TeamLogo name="Atlético Mineiro" src={null} />)).toContain("AM");
  });

  it("truncates very long names", () => {
    const html = renderToStaticMarkup(<TeamLogo name={"A".repeat(80)} src={null} />);
    expect(html).toContain("truncate");
  });

  it("renders an image with the team name as alt when src is present", () => {
    const html = renderToStaticMarkup(
      <TeamLogo name="Flamengo" src="https://media.api-sports.io/football/teams/127.png" />,
    );
    expect(html).toContain("<img");
    expect(html).toContain('alt="Flamengo"');
  });
});
