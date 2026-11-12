import { faSlack } from "@fortawesome/free-brands-svg-icons";

import ButtonLink from "@/components/ButtonLink/ButtonLink";

import { askChannelName, joinPath, slackUrl } from "@/lib/questions";

import styles from "./questions.module.css";

/** How to ask or answer: in the members' Slack, which anyone joins through the directory */
export default function AskCallout({ heading = "Have a question?" }: { heading?: string }) {
  return (
    <aside className={styles.callout}>
      <div>
        <h2>{heading}</h2>
        <p>
          Members ask and answer in the <strong>{askChannelName}</strong> channel of the Latina Dev
          Slack. Once someone answers, the thread shows up here for everyone. Not a member yet? Add
          your profile to the directory and we&apos;ll invite you.
        </p>
      </div>
      <div className={styles.actions}>
        <ButtonLink text={`Ask in ${askChannelName}`} url={slackUrl} icon={faSlack} external />
        <ButtonLink text="Join to ask" url={joinPath} variant="outline" />
      </div>
    </aside>
  );
}
