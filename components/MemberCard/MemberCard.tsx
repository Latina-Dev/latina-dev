import Image from "next/image";
import Link from "next/link";

import CountryFlags from "@/components/CountryFlags/CountryFlags";
import SocialLinks from "@/components/SocialLinks/SocialLinks";

import { MemberInterface, MemberLevel } from "@/types/members";

import styles from "./MemberCard.module.css";

// Short labels keep the level tag on one line in a two-column phone grid
export const levelTags: Record<MemberLevel, string> = {
  Student: "Student",
  "Individual Contributor": "IC",
  Leader: "Leader",
};

interface MemberProps {
  member: MemberInterface;
}

const MemberCard = (props: MemberProps) => {
  const { name, slug, path, level, affiliation, countries } = props.member;

  return (
    <article className={styles.card}>
      <Link href={path} className={styles.main}>
        <div className={styles.photo}>
          <Image
            src={`/img/members/${slug}.jpg`}
            alt={name}
            fill
            sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 300px"
            className={styles.image}
          />
        </div>
        <div className={styles.body}>
          <span className={styles.level} title={level}>
            {levelTags[level]}
          </span>
          <h3 className={styles.name}>{name}</h3>
          {affiliation && <p className={styles.affiliation}>{affiliation}</p>}
          {countries && (
            <div className={styles.countries}>
              <CountryFlags countries={countries} showNames />
            </div>
          )}
        </div>
      </Link>
      <div className={styles.socials}>
        <SocialLinks member={props.member} />
      </div>
    </article>
  );
};

export default MemberCard;
