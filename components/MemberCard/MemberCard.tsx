import Image from "next/image";
import Link from "next/link";

import CountryFlags from "@/components/CountryFlags/CountryFlags";
import SocialLinks from "@/components/SocialLinks/SocialLinks";

import { MemberInterface } from "@/types/members";

interface MemberProps {
  member: MemberInterface;
}

const MemberCard = (props: MemberProps) => {
  const { name, slug, level, countries, linkedin } = props.member;

  return (
    <div className={"text-center"}>
      <Link
        href={`https://linkedin.com/in/${linkedin}`}
        aria-label={name}
        className="block"
        target="_blank"
        rel="noopener noreferrer">
        {/* Image */}
        <div className="relative mx-auto w-[250px] h-[250px]">
          <Image
            src={`/img/members/${slug}.jpg`}
            alt={name}
            fill
            className="rounded-xl object-cover object-top"
          />
        </div>
        {/* Name */}
        <h4 className="mt-3">{name}</h4>
        {/* Level */}
        <p className="text-muted">{level}</p>
        {/* Country Flag */}
        {countries && <CountryFlags countries={countries} />}
      </Link>
      {/* Social Links */}
      <SocialLinks member={props.member} />
    </div>
  );
};

export default MemberCard;
