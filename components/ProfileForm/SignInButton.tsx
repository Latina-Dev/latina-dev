import { signInWithLinkedIn } from "@/app/profile/actions";

import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import styles from "./ProfileForm.module.css";

/** LinkedIn is the only way to sign in, so every profile belongs to a real person */
export default function SignInButton() {
  return (
    <form action={signInWithLinkedIn}>
      <button type="submit" className={styles.submit}>
        <FontAwesomeIcon icon={faLinkedin} aria-hidden="true" /> Continue with LinkedIn
      </button>
    </form>
  );
}
