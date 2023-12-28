import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

interface Props {
  text: string;
  url: string;
  icon?: IconProp;
  external?: boolean;
}

const ButtonLink = (props: Props) => {
  const { text, url, icon, external } = props;

  const target = external ? '_blank' : '_self';

  return (
    <Link
      href={url}
      aria-label={text}
      target={target}
      className='py-[18px] px-[33px]  sm:px-[46px] bg-buttonBackground text-whiteColor rounded-lg font-bold    hover:text-buttonDarkHover hover:bg-buttonBackgroundHover hover:border-solid outline-2  hover:border-buttonDarkHover transition-all'>
      {text} {icon && <FontAwesomeIcon icon={icon} />}
    </Link>
  );
};

export default ButtonLink;
