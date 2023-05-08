import Maintainer from "@/components/Maintainers/Maintainer/Maintainer";
import styles from "./Maintainers.module.css";

export default function Maintainers() {
  return (
    <section className={styles.avatars}>
      <h2>Contributors</h2>
      <div className="mt-10 grid grid-cols-2">
        <Maintainer
          name="Frances Coronel"
          github="FrancesCoronel"
          imagePath="frances"
        />
        <Maintainer
          name="Gabriella Corales"
          github="EllaCodes4"
          imagePath="gabriella"
        />
      </div>
    </section>
  );
}
