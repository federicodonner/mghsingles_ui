import React, { useState } from "react";
import "./cardInStore.css";
import texts from "../data/texts";
import { accessAPI } from "../utils/fetchFunctions";
import { isFoil, finishLabel } from "../utils/finishes";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

export default function CardInStore(props) {
  // Load the version details in state
  const [showingDetails, setShowingDetails] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reserving, setReserving] = useState(false);

  const card = props.card;
  // `available` is stock minus what other customers are holding; fall back to
  // quantity for any caller that has not been updated to send it.
  const available = card.available ?? card.quantity ?? 0;

  function reserve() {
    setReserving(true);
    accessAPI(
      "POST",
      "order",
      { lines: [{ cardid: card.id, quantity }] },
      () => {
        setReserving(false);
        alert(texts.RESERVED_OK);
        if (props.onReserved) props.onReserved();
      },
      (response) => {
        setReserving(false);
        alert(response.message);
      }
    );
  }

  return (
    <div
      className="cardInStore"
      onMouseEnter={() => setShowingDetails(true)}
      onMouseLeave={() => setShowingDetails(false)}
    >
      {showingDetails && (
        <div className="cardCover">
          {/* The API returns cardsetname; this used to read cardSetName. */}
          <div className="set">{card.cardsetname}</div>
          <div className="condition">
            {card.condition}
            {/* Printing is a variant string now, not a foil flag. */}
            {isFoil(card.variant) && (
              <span className="foil"> - {finishLabel(card.variant)}</span>
            )}
          </div>
          <div className="language">{card.language}</div>
          <div className="quantity">
            {texts.AVAILABLE}
            {available}
            {card.reserved > 0 && (
              <span className="reservedNote">
                {" "}
                ({card.reserved} {texts.RESERVED_BY_OTHERS})
              </span>
            )}
          </div>
          {card.price !== null && card.price !== undefined && (
            <div className="price">
              <div className="priceContainer">U$S {card.price}</div>
            </div>
          )}

          {props.loggedIn && available > 0 && (
            <div className="reserveRow">
              {/* Only worth a selector when there is more than one to take. */}
              {available > 1 && (
                <TextField select SelectProps={{ native: true }}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                >
                  {Array.from({ length: available }, (_, i) => (
                    <option value={i + 1} key={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </TextField>
              )}
              <Button onClick={reserve} disabled={reserving}>
                {texts.RESERVE}
              </Button>
            </div>
          )}
          {props.loggedIn && available <= 0 && (
            <div className="soldOut">{texts.NOT_IN_STOCK}</div>
          )}
        </div>
      )}
      <img src={card.image} alt="card" className="cardImg" />
    </div>
  );
}
