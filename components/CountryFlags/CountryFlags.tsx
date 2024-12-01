import { CountryOption } from "@/types/countries";

import styles from "./CountryFlags.module.css";

const countryOptions: CountryOption[] = [
  { country: "Ecuador", flag: "🇪🇨" },
  { country: "Bolivia", flag: "🇧🇴" },
  { country: "Paraguay", flag: "🇵🇾" },
  { country: "Colombia", flag: "🇨🇴" },
  { country: "Brazil", flag: "🇧🇷" },
  { country: "Nicaragua", flag: "🇳🇮" },
  { country: "Venezuela", flag: "🇻🇪" },
  { country: "Peru", flag: "🇵🇪" },
  { country: "Uruguay", flag: "🇺🇾" },
  { country: "Guatemala", flag: "🇬🇹" },
  { country: "Honduras", flag: "🇭🇳" },
  { country: "El Salvador", flag: "🇸🇻" },
  { country: "Costa Rica", flag: "🇨🇷" },
  { country: "Argentina", flag: "🇦🇷" },
  { country: "Panama", flag: "🇵🇦" },
  { country: "Cuba", flag: "🇨🇺" },
  { country: "Mexico", flag: "🇲🇽" },
  { country: "Dominican Republic", flag: "🇩🇴" },
  { country: "Chile", flag: "🇨🇱" },
  { country: "Puerto Rico", flag: "🇵🇷" },
  { country: "Belize", flag: "🇧🇿" },
  { country: "Haiti", flag: "🇭🇹" },
];

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
