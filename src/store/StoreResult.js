import React, { useState } from "react";
import { toast } from "../utils/toast";
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
import { pesosLive } from "../utils/exchange";
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

export default function StoreResult({ card, rate, loggedIn, wishlisted }) {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  // Copies of this row sent to the cart in this sitting. The cart holds no
  // stock, but offering a fifth copy of a card with four would only move the
  // refusal to the confirm step, so the tile counts its own adds.
  const [inCart, setInCart] = useState(0);

  // Send THIS copy — printing and finish, exactly as clicked — to the cart.
  //
  // Nothing is reserved yet: the cart is a draft, and the shop only hears
  // about it when the customer confirms from the Carrito page. That is the
  // confirmation step the instant buy used to skip.
  function addToCart() {
    setAdding(true);
    accessAPI(
      "POST",
      "cart",
      { cardid: card.id },
      (response) => {
        setAdding(false);
        setInCart((n) => n + 1);
        toast(response.message, "success");
        // The menu's cart badge listens for this, so the count follows the
        // click wherever on the site it happened.
        window.dispatchEvent(new Event("cartchange"));
      },
      (response) => {
        setAdding(false);
        toast(response.message);
      }
    );
  }

  // The customer's own consigned card: no price, and the action is to ask for
  // it back (a withdrawal), not to buy it. Raised through the same endpoint the
  // wishlist match uses, which detects ownership and files a withdrawal.
  const [requested, setRequested] = useState(false);
  function requestReturn() {
    setAdding(true);
    accessAPI(
      "POST",
      "wishlist/buy",
      { cardid: card.id },
      (response) => {
        setAdding(false);
        setRequested(true);
        toast(response.message, "success");
      },
      (response) => {
        setAdding(false);
        toast(response.message);
      }
    );
  }

  const availableNow = Math.max(0, (card.available ?? 0) - inCart);

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

            {/* Condition and language are tracked but not shown (2026-08-23,
                the shop's call) — the tile names printing and finish only.
                Only say "foil" when it is one; a chip reading "normal" on
                every other tile is noise. */}
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
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
          {/* A customer's own card shows "es tuya" in place of a price; the
              price is never even sent for it. Everyone else sees pesos only. */}
          {card.mine ? (
            <Typography variant="h6" className="storeResultPrice">
              {texts.ITS_YOURS}
            </Typography>
          ) : (
            pesosLive(card.price, rate) && (
              <Typography variant="h6" className="storeResultPrice">
                {pesosLive(card.price, rate)}
              </Typography>
            )
          )}
        {!card.mine && (
          <Typography variant="body2" color="text.secondary">
            {texts.AVAILABLE_NOW}: {availableNow}
          </Typography>
        )}
        {/* Covered by a wishlist entry — worth knowing, but no reason to stop
            a purchase: the entry answers itself when the copy lands in the
            bag. */}
        {!card.mine && wishlisted && inCart === 0 && (
          <Typography variant="caption" color="text.secondary">
            {texts.IN_WISHLIST}
          </Typography>
        )}
      </Box>

        {/* Pushed to the bottom so the buttons line up across a row of tiles
            whose text runs to different lengths. */}
      {!loggedIn ? (
        <Button
          size="small"
          fullWidth
          sx={{ mt: "auto" }}
          onClick={() => navigate("/login")}
        >
          {texts.LOGIN_TO_ORDER}
        </Button>
      ) : card.mine ? (
        <Button
          size="small"
          fullWidth
          variant={requested ? "outlined" : "contained"}
          sx={{ mt: "auto" }}
          disabled={adding || requested}
          onClick={requestReturn}
        >
          {requested ? texts.RESERVED_FOR_YOU : texts.REQUEST_MINE_BACK}
        </Button>
      ) : (
        <Button
          size="small"
          fullWidth
          sx={{ mt: "auto" }}
          variant={availableNow <= 0 ? "outlined" : "contained"}
          disabled={adding || availableNow <= 0}
          onClick={addToCart}
        >
          {/* Still addable while copies remain — somebody may want two. Only
              when their own adds cover the stock does the button retire. */}
          {availableNow <= 0 && inCart > 0 ? texts.IN_YOUR_CART : texts.ADD_TO_CART}
        </Button>
      )}
    </Card>
  );
}
