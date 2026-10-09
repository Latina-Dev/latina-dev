import Link from "next/link";

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import styles from "./ButtonLink.module.css";

interface Props {
  text: string;
  url: string;
  icon?: IconProp;
  external?: boolean;
  variant?: "primary" | "outline" | "light"; // light sits on the red masthead
}

const ButtonLink = (props: Props) => {
  const { text, url, icon, external, variant = "primary" } = props;

  return (
    <Link
      href={url}
      className={`${styles.buttonLink} ${styles[variant]}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {icon && <FontAwesomeIcon icon={icon} aria-hidden="true" />}
      <span>{text}</span>
    </Link>
  );
};

export default ButtonLink;
