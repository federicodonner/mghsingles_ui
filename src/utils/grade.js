// Condition and language of a copy.
//
// Nearly every card is near-mint English, so those two are the unmarked case
// everywhere — the customer's own containers and every storefront view alike:
// a row says something only when the copy is NOT that, the same rule as the
// back office.
export const DEFAULT_CONDITION = "NM";
export const DEFAULT_LANGUAGE = "Inglés";

// The parts worth showing for a card or line carrying `condition` and
// `language` names: [] for a near-mint English copy.
export function gradeParts(card) {
  const parts = [];
  if (card?.condition && card.condition !== DEFAULT_CONDITION) {
    parts.push(card.condition);
  }
  if (card?.language && card.language !== DEFAULT_LANGUAGE) {
    parts.push(card.language);
  }
  return parts;
}

export const gradeLabel = (card) => gradeParts(card).join(" · ");
