import { MemberInterface } from "@/types/members";
import {
  faGithub,
  faLinkedin,
  faTwitter
} from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import styles from "./Member.module.css";

interface MemberProps {
  member: MemberInterface;
}

const SocialLinks = (props: MemberProps) => {
  const { name, linkedin, github, twitter, website } = props.member

  return (
    <div className={styles.avatars_social_links}>
      {/* LinkedIn */}
      {linkedin && (
        <Link
          href={`https://www.linkedin.com/in/${linkedin}`}
          aria-label={`${name} LinkedIn`}
          target={"_blank"}
        >
          <FontAwesomeIcon icon={faLinkedin} />
        </Link>
      )}
      {/* GitHub */}
      {github && (
        <Link
          href={`https://www.github.com/${github}`}
          aria-label={`${name} GitHub`}
          target={"_blank"}
        >
          <FontAwesomeIcon icon={faGithub} />
        </Link>
      )}
      {/* Twitter */}
      {twitter && (
        <Link
          href={`https://www.twitter.com/${twitter}`}
          aria-label={`${name} Twitter`}
          target={"_blank"}
        >
          <FontAwesomeIcon icon={faTwitter} />
        </Link>
      )}
      {/* Website */}
      {website && (
        <Link href={website} aria-label={`${name} Website`} target={"_blank"}>
          <FontAwesomeIcon icon={faGlobe} />
        </Link>
      )}
    </div>
  );
};

export default SocialLinks;
