/**
 * Countries members can list as their country or countries of origin.
 * This list is the single source of truth for the add-member form, the flags
 * shown on profiles and the validation of data/members/*.md.
 */
export const countryOptions = [
  { country: "Argentina", flag: "🇦🇷" },
  { country: "Belize", flag: "🇧🇿" },
  { country: "Bolivia", flag: "🇧🇴" },
  { country: "Brazil", flag: "🇧🇷" },
  { country: "Chile", flag: "🇨🇱" },
  { country: "Colombia", flag: "🇨🇴" },
  { country: "Costa Rica", flag: "🇨🇷" },
  { country: "Cuba", flag: "🇨🇺" },
  { country: "Dominican Republic", flag: "🇩🇴" },
  { country: "Ecuador", flag: "🇪🇨" },
  { country: "El Salvador", flag: "🇸🇻" },
  { country: "Guatemala", flag: "🇬🇹" },
  { country: "Haiti", flag: "🇭🇹" },
  { country: "Honduras", flag: "🇭🇳" },
  { country: "Mexico", flag: "🇲🇽" },
  { country: "Nicaragua", flag: "🇳🇮" },
  { country: "Panama", flag: "🇵🇦" },
  { country: "Paraguay", flag: "🇵🇾" },
  { country: "Peru", flag: "🇵🇪" },
  { country: "Puerto Rico", flag: "🇵🇷" },
  { country: "Uruguay", flag: "🇺🇾" },
  { country: "Venezuela", flag: "🇻🇪" },
] as const;

export type CountryName = (typeof countryOptions)[number]["country"];

type CountryFlag = (typeof countryOptions)[number]["flag"];

export const countryNames = countryOptions.map(({ country }) => country) as [
  CountryName,
  ...CountryName[],
];

export interface CountryOption {
  country: CountryName;
  flag: CountryFlag;
}
