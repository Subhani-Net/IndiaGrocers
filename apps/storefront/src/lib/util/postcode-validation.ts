/**
 * London delivery zone postcode configuration.
 *
 * Postcodes are validated by prefix — the outward code (first part before the space).
 * A postcode like "SW9 8AL" has outward code "SW9".
 *
 * US-07-02: Postcode Validation for London Delivery Zones
 */

/**
 * Full list of London postcode outward codes we deliver to.
 * Covers all London boroughs reachable via our C&C + delivery network.
 */
export const LONDON_POSTCODE_PREFIXES = new Set([
  // Central & Inner London
  "EC1", "EC2", "EC3", "EC4", // City of London
  "WC1", "WC2",               // Westminster / Camden
  "W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12", "W13", "W14",
  "SW1", "SW2", "SW3", "SW4", "SW5", "SW6", "SW7", "SW8", "SW9", "SW10", "SW11", "SW12", "SW13", "SW14", "SW15", "SW16", "SW17", "SW18", "SW19", "SW20",
  "NW1", "NW2", "NW3", "NW4", "NW5", "NW6", "NW7", "NW8", "NW9", "NW10", "NW11",
  "N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8", "N9", "N10", "N11", "N12", "N13", "N14", "N15", "N16", "N17", "N18", "N19", "N20", "N21", "N22",
  "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E12", "E13", "E14", "E15", "E16", "E17", "E18",
  "SE1", "SE2", "SE3", "SE4", "SE5", "SE6", "SE7", "SE8", "SE9", "SE10", "SE11", "SE12", "SE13", "SE14", "SE15", "SE16", "SE17", "SE18", "SE19", "SE20", "SE21", "SE22", "SE23", "SE24", "SE25", "SE26", "SE27", "SE28",

  // Greater London / Outer
  "CR0", "CR2", "CR4", "CR5", "CR7", "CR8", // Croydon
  "SM1", "SM2", "SM3", "SM4", "SM5", "SM6", // Sutton
  "KT1", "KT2", "KT3", "KT4", "KT5", "KT6", // Kingston
  "TW1", "TW2", "TW3", "TW4", "TW5", "TW7", "TW8", "TW9", "TW10", "TW11", "TW12", "TW13", "TW14", // Twickenham/Richmond
  "UB1", "UB2", "UB3", "UB4", "UB5", "UB6", "UB7", "UB8", "UB9", "UB10", // Southall/Uxbridge
  "HA0", "HA1", "HA2", "HA3", "HA4", "HA5", "HA6", "HA7", "HA8", "HA9", // Harrow
  "RM1", "RM2", "RM3", "RM5", "RM6", "RM7", "RM8", "RM9", "RM10", "RM11", "RM12", "RM13", "RM14", // Romford
  "IG1", "IG2", "IG3", "IG4", "IG5", "IG6", "IG7", "IG8", // Ilford
  "EN1", "EN2", "EN3", "EN4", "EN5", // Enfield
  "BR1", "BR2", "BR3", "BR4", // Bromley
  "DA1", "DA5", "DA6", "DA7", "DA8", "DA14", "DA15", "DA16", // Dartford/Bexley
  "WD1", "WD2", "WD3", "WD4", "WD5", "WD6", "WD7", // Watford
])

/**
 * Extracts the outward code from a UK postcode.
 * "SW9 8AL" → "SW9"
 * "sw98al" → "SW9"
 * "E1 6AN" → "E1"
 */
export function extractOutwardCode(postcode: string): string {
  const cleaned = postcode.toUpperCase().replace(/\s+/g, "")
  // Outward code is everything except the last 3 characters
  if (cleaned.length < 4) return ""
  return cleaned.slice(0, -3)
}

/**
 * Valid postcode format per UK standard: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i
 */
export function isValidUkPostcode(postcode: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(postcode.trim())
}

export type PostcodeCheckResult =
  | { status: "valid"; outward: string }
  | { status: "invalid_format" }
  | { status: "not_in_zone"; outward: string }

/**
 * Validates a postcode against the London delivery zone.
 */
export function checkPostcode(postcode: string): PostcodeCheckResult {
  if (!isValidUkPostcode(postcode.trim())) {
    return { status: "invalid_format" }
  }
  const outward = extractOutwardCode(postcode)
  if (!outward) return { status: "invalid_format" }
  if (LONDON_POSTCODE_PREFIXES.has(outward)) {
    return { status: "valid", outward }
  }
  return { status: "not_in_zone", outward }
}
