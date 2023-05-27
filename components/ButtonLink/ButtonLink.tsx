import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import styles from "./ButtonLink.module.css";

interface Props {
  text: string;
  url: string;
  icon?: IconProp;
  external?: boolean;
}

const ButtonLink = (props: Props) => {
  const { text, url, icon, external } = props;

  const target = external ? "_blank" : "_self";

  return (
    <Link
      href={url}
      aria-label={text}
      target={target}
      className={styles.buttonLink}
    >
      {text} {icon && <FontAwesomeIcon icon={icon} />}
    </Link>
  );
};

export default ButtonLink;
