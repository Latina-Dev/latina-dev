import ButtonLink from "@/components/ButtonLink/ButtonLink";

import { joinLabel, joinPath } from "@/lib/join";

interface Props {
  variant?: "primary" | "outline" | "light";
}

/** The site's one join button. Use it anywhere we ask someone to join Latina Dev or our Slack. */
const JoinButton = ({ variant = "primary" }: Props) => (
  <ButtonLink text={joinLabel} url={joinPath} variant={variant} />
);

export default JoinButton;
