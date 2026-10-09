import { countryOptions } from "@/types/countries";

import styles from "./CountryFlags.module.css";

interface Props {
  countries: string[];
  showNames?: boolean; // flag followed by the country name, e.g. 🇵🇪 Peru
}

const getFlag = (country: string) =>
  countryOptions.find((countryOption) => countryOption.country === country)?.flag ?? null;

const CountryFlags = (props: Props) => {
  const { countries, showNames } = props;

  if (showNames) {
    return (
      <ul className={styles.named}>
        {countries.map((country) => (
          <li key={country}>
            <span aria-hidden="true">{getFlag(country)}</span> {country}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      {countries.map((country) => (
        <span key={country} className={styles.country}>
          {getFlag(country)}
        </span>
      ))}
    </div>
  );
};

export default CountryFlags;
