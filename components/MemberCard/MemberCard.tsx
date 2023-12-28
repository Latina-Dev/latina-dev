import CountryFlags from '@/components/CountryFlags/CountryFlags';
import SocialLinks from '@/components/SocialLinks/SocialLinks';
import { MemberInterface } from '@/types/members';
import Image from 'next/legacy/image';
import Link from 'next/link';

interface MemberProps {
  member: MemberInterface;
}

const MemberCard = (props: MemberProps) => {
  const { name, slug, level, countries } = props.member;

  return (
    <div className={'text-center'}>
      <Link href={props.member.path} aria-label={name} className='block'>
        {/* Image */}
        <div className='w-[130px] h-[130px] sm:w-[250px] sm:h-[250px] mx-auto'>
          <Image
            src={`/img/members/${slug}.jpg`}
            alt={name}
            width={130}
            height={130}
            layout='responsive'
            className='rounded-xl'
          />
        </div>
        {/* Name */}
        <h4 className='mt-3'>{name}</h4>
        {/* Level */}
        <p className='text-muted'>{level}</p>
        {/* Country Flag */}
        {countries && <CountryFlags countries={countries} />}
      </Link>
      {/* Social Links */}
      <SocialLinks member={props.member} />
    </div>
  );
};

export default MemberCard;
