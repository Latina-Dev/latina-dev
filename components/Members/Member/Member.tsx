import { MemberInterface } from "@/types/members";
import {
  faGithub,
  faLinkedin,
  faTwitter
} from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import styles from "./Member.module.css";
import SocialLinks from "@/components/Members/Member/SocialLinks";

interface MemberProps {
  member: MemberInterface;
}

const Member = (props: MemberProps) => {
  const { name, slug, level } =
    props.member;

  return (
    <div>
      <Link
        href={props.member.path}
        aria-label={name}
        target={"_blank"}
        className="block"
      >
      {/* Image */}
      <Image
        src={`/img/members/${slug}.jpg`}
        alt={name}
        width="250"
        height="250"
        className="rounded-xl"
      />
      {/* Name */}

        <h4 className="mt-3">{name}</h4>

      {/* Level */}
      <p className="text-muted">{level}</p>
      </Link>
      {/* Social Links */}
      <SocialLinks member={props.member}/>
    </div>
  );
};

export default Member;
