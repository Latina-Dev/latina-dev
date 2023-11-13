import {
  faDiscord,
  faGithub,
  faLinkedin,
} from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer>
      <div className='flex justify-evenly mx-auto max-w-5xl mt-[50px] p-9 text-primary dark:text-whiteColor'>
        <Link
          href='https://github.com/Latina-Dev/latina-dev'
          aria-label='Latina Dev GitHub'
          className='text-xl p-4  hover:text-white hover:bg-primaryDark transition-all duration-150 ease-in-out '
          target={'_blank'}>
          <FontAwesomeIcon icon={faGithub} />
        </Link>
        <Link
          href='https://discord.com/invite/xzHDhxsQAQ'
          aria-label='Latina Dev Discord'
          className='text-xl p-4  hover:text-white hover:bg-primaryDark transition-all duration-150 ease-in-out '
          target={'_blank'}>
          <FontAwesomeIcon icon={faDiscord} width={25} />
        </Link>
        <Link
          href='https://www.linkedin.com/company/latina-dev/'
          aria-label='Latina Dev LinkedIn'
          className='text-xl p-4 hover:text-white hover:bg-primaryDark transition-all duration-150 ease-in-out '
          target={'_blank'}>
          <FontAwesomeIcon icon={faLinkedin} />
        </Link>
      </div>
      <div className='text-center'>
        <Link
          href='https://vercel.com?utm_source=latina-dev&utm_campaign=oss'
          aria-label='Vercel'
          target={'_blank'}>
          <Image
            src='/img/logos/vercel.svg'
            alt='Vercel'
            width='212'
            height='44'></Image>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
