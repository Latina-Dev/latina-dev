import { signInWithLinkedIn } from "@/app/profile/actions";

import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import styles from "./ProfileForm.module.css";

/** LinkedIn is the only way to sign in, so every profile belongs to a real person */
export default function SignInButton({ claim, slack }: { claim?: string; slack?: string }) {
  return (
    <form action={signInWithLinkedIn}>
      {claim && <input type="hidden" name="claim" value={claim} />}
      {slack && <input type="hidden" name="slack" value={slack} />}
      <button type="submit" className={styles.submit}>
        <FontAwesomeIcon icon={faLinkedin} aria-hidden="true" /> Continue with LinkedIn
      </button>
    </form>
  );
}
