import { countryOptions } from "@/types/countries";

import styles from "./CountryFlags.module.css";

interface Props {
  countries: string[];
}

const CountryFlags = (props: Props) => {
  const { countries } = props;

  // get flag based on country name given
  const getFlag = (country: string) => {
    const countryOption = countryOptions.find((countryOption) => countryOption.country === country);
    if (!countryOption) return null;
    return countryOption.flag;
  };

  // return list of flags
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
