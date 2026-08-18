import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import texts from "../data/texts";
import { accessAPI } from "../utils/fetchFunctions";
import { isFoil, finishLabel } from "../utils/finishes";
import "./storeResult.css";

// One card the shop actually has.
//
// A tile rather than a full-width row, so several fit on a line. The facts kept
// here are the ones that distinguish this copy from another printing of the
// same card — set, condition, language, finish. "Black Lotus" is not something
// you can buy; a near-mint English one from Beta is.
//
// The type line is deliberately absent: it is the same for every printing of a
// card, so it never helps choose between two of them. It still earns its place
// as a search filter, which is where it lives.

// Sized with `sx`, not a CSS class: MUI's own styles sit in a layer that beats
// a plain class, which is how the art ended up stretched across the row.
const ART_SX = {
  width: 74,
  height: 103,
  flex: "0 0 auto",
  borderRadius: 1,
  objectFit: "cover",
  bgcolor: "#f0f0f0",
};

export default function StoreResult({ card, loggedIn, wishlisted, onWishlisted }) {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  // A wishlist entry is a card NAME, so this adds the name and nothing else.
  // Silently pinning the entry to this printing's set, language, grade and
  // finish would be a lot to infer from one click — and the customer would then
  // have to go and undo four constraints they never chose. Preferences are
  // picked deliberately, on the wishlist itself.
  function addToWishlist() {
    setAdding(true);
    accessAPI(
      "POST",
      "wishlist",
      { name: card.name },
      () => {
        setAdding(false);
        onWishlisted(card.name);
      },
      (response) => {
        setAdding(false);
        // Already on the list is not a failure: what the customer wanted is
        // true either way, so the button just settles into its added state.
        if (response.status === 400) onWishlisted(card.name);
        else alert(response.message);
      }
    );
  }

  return (
    <Card
      variant="outlined"
      className="storeResult"
      /* The tile itself is the flex column, so `mt: auto` on the button has the
         full height to push against and the buttons line up across a row even
         when one card has no price and another does.
         No `height: 100%` — a grid item already stretches to its row, and
         asking for it as well is what made the tile overflow. */
      sx={{
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
      }}
    >
      {/* Everything is left-aligned against the art's edge, so the eye has one
          column to run down rather than three. */}
      <Stack direction="row" spacing={1.5}>
          {card.image ? (
            <Box
              component="img"
              src={card.image}
              alt={card.name}
              loading="lazy"
              sx={ART_SX}
            />
          ) : (
            <Box sx={{ ...ART_SX, border: "1px dashed #ccc" }} />
          )}

          <Stack spacing={0.5} sx={{ flex: "1 1 auto", minWidth: 0 }}>
            <Typography variant="subtitle2" className="storeResultName">
              {card.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {card.cardsetname}
              {card.cardsetcode && (
                <span className="setCode">
                  {" "}
                  ({card.cardsetcode.toUpperCase()})
                </span>
              )}
            </Typography>

            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={card.condition} />
              <Chip size="small" variant="outlined" label={card.language} />
              {/* Only say "foil" when it is one — a chip reading "normal" on
                  every other tile is noise. */}
              {isFoil(card.variant) && (
                <Chip
                  size="small"
                  color="secondary"
                  label={finishLabel(card.variant)}
                />
              )}
            </Stack>
        </Stack>
      </Stack>

      <Box>
          {card.price != null && (
            <Typography variant="h6" className="storeResultPrice">
              {texts.CURRENCY} {card.price}
            </Typography>
          )}
        <Typography variant="body2" color="text.secondary">
          {texts.AVAILABLE_NOW}: {card.available}
        </Typography>
      </Box>

        {/* Pushed to the bottom so the buttons line up across a row of tiles
            whose text runs to different lengths. */}
      {loggedIn ? (
        <Button
          size="small"
          fullWidth
          sx={{ mt: "auto" }}
          variant={wishlisted ? "outlined" : "contained"}
          disabled={adding || wishlisted}
          onClick={addToWishlist}
        >
          {wishlisted ? texts.IN_WISHLIST : texts.ADD_TO_WISHLIST}
        </Button>
      ) : (
        <Button
          size="small"
          fullWidth
          sx={{ mt: "auto" }}
          onClick={() => navigate("/login")}
        >
          {texts.LOGIN_TO_ORDER}
        </Button>
      )}
    </Card>
  );
}
