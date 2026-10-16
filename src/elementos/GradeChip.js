import React from "react";
import Chip from "@mui/material/Chip";
import { gradeParts } from "../utils/grade";

// A copy's condition and language as one quiet chip — "EX · Japonés" — in
// every storefront view: search, browsed binders and boxes, cart, orders.
// Whatever is NM / Inglés is left out, and a near-mint English copy shows no
// chip at all (see utils/grade.js).
export default function GradeChip({ card, sx }) {
  const parts = gradeParts(card);
  if (!parts.length) return null;
  return (
    <Chip
      size="small"
      variant="outlined"
      label={parts.join(" · ")}
      sx={{ flex: "0 0 auto", ...sx }}
    />
  );
}
