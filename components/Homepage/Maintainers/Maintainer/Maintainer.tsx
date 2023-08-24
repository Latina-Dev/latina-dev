import Image from "next/image";
import Link from "next/link";

interface MaintainerProps {
  name: string;
  github: string;
  imagePath: string;
}

const Maintainer = (props: MaintainerProps) => {
  const { name, github, imagePath } = props;
  return (
    <>
      <Link
        href={`https://github.com/${github}`}
        target="_blank"
        rel="noreferrer"
      >
        <Image
          src={`/img/members/${imagePath}.jpg`}
          alt={name}
          width="100"
          height="100"
        ></Image>
        <p className="mt-3">{name}</p>
      </Link>
    </>
  );
};

export default Maintainer;
