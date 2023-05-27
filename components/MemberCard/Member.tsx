import CountryFlags from "@/components/CountryFlags/CountryFlags";
import SocialLinks from "@/components/MemberCard/SocialLinks/SocialLinks";
import { MemberInterface } from "@/types/members";
import Image from "next/image";
import Link from "next/link";

interface MemberProps {
  member: MemberInterface;
}

const Member = (props: MemberProps) => {
  const { name, slug, level, countries } = props.member;

  return (
    <div>
      <Link href={props.member.path} aria-label={name} className="block">
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
        {/* Country Flag */}
        {countries && <CountryFlags countries={countries} />}
      </Link>
      {/* Social Links */}
      <SocialLinks member={props.member} />
    </div>
  );
};

export default Member;
