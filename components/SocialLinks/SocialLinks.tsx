import Link from "next/link";

import { faBluesky, faGithub, faLinkedin, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { faGlobe, faRss } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { MemberInterface } from "@/types/members";

import styles from "./SocialLinks.module.css";

interface MemberProps {
  member: MemberInterface;
}

const SocialLinks = (props: MemberProps) => {
  const { name, linkedin, github, twitter, bluesky, website, blog } = props.member;

  return (
    <div className={styles.socialLinks}>
      {/* LinkedIn */}
      {linkedin && (
        <Link
          href={`https://www.linkedin.com/in/${linkedin}`}
          aria-label={`${name} LinkedIn`}
          target={"_blank"}
          rel="noopener noreferrer">
          <FontAwesomeIcon icon={faLinkedin} />
        </Link>
      )}
      {/* GitHub */}
      {github && (
        <Link
          href={`https://www.github.com/${github}`}
          aria-label={`${name} GitHub`}
          target={"_blank"}
          rel="noopener noreferrer">
          <FontAwesomeIcon icon={faGithub} />
        </Link>
      )}
      {/* X */}
      {twitter && (
        <Link
          href={`https://x.com/${twitter}`}
          aria-label={`${name} X`}
          target={"_blank"}
          rel="noopener noreferrer">
          <FontAwesomeIcon icon={faXTwitter} />
        </Link>
      )}
      {/* Bluesky */}
      {bluesky && (
        <Link
          href={`https://bsky.app/profile/${bluesky}`}
          aria-label={`${name} Bluesky`}
          target={"_blank"}
          rel="noopener noreferrer">
          <FontAwesomeIcon icon={faBluesky} />
        </Link>
      )}
      {/* Website */}
      {website && (
        <Link
          href={website}
          aria-label={`${name} Website`}
          target={"_blank"}
          rel="noopener noreferrer">
          <FontAwesomeIcon icon={faGlobe} />
        </Link>
      )}
      {/* Blog */}
      {blog && (
        <Link href={blog} aria-label={`${name} Blog`} target={"_blank"} rel="noopener noreferrer">
          <FontAwesomeIcon icon={faRss} />
        </Link>
      )}
    </div>
  );
};

export default SocialLinks;
