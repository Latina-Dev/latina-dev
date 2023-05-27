export type CountryName =
  | "Ecuador"
  | "Bolivia"
  | "Paraguay"
  | "Colombia"
  | "Brazil"
  | "Nicaragua"
  | "Venezuela"
  | "Peru"
  | "Uruguay"
  | "Guatemala"
  | "Honduras"
  | "El Salvador"
  | "Costa Rica"
  | "Argentina"
  | "Panama"
  | "Cuba"
  | "Mexico"
  | "Dominican Republic"
  | "Chile"
  | "Puerto Rico"
  | "Belize"
  | "Haiti";

type CountryFlag =
  | "🇪🇨"
  | "🇧🇴"
  | "🇵🇾"
  | "🇨🇴"
  | "🇧🇷"
  | "🇳🇮"
  | "🇻🇪"
  | "🇵🇪"
  | "🇺🇾"
  | "🇬🇹"
  | "🇭🇳"
  | "🇸🇻"
  | "🇨🇷"
  | "🇦🇷"
  | "🇵🇦"
  | "🇨🇺"
  | "🇲🇽"
  | "🇩🇴"
  | "🇨🇱"
  | "🇵🇷"
  | "🇧🇿"
  | "🇭🇹";

export interface CountryOption {
  country: CountryName;
  flag: CountryFlag;
}
