import React, { useState } from "react";
import "./cardInStore.css";
import texts from "../data/texts";

export default function CardInStore(props) {
  // Load the version details in state
  const [card] = useState(props.card);
  const [showingDetails, setShowingDetails] = useState(false);

  function mouseRollOverIn() {
    setShowingDetails(true);
  }

  function mouseRollOverOut() {
    setShowingDetails(false);
  }

  return (
    <div
      className="cardInStore"
      onMouseEnter={mouseRollOverIn}
      onMouseLeave={mouseRollOverOut}
    >
      {showingDetails && (
        <div className="cardCover">
          <div className="set">{card.cardSetName}</div>
          <div className="condition">
            {card.condition}
            {card.foil === 1 && <span className="foil"> - foil</span>}
          </div>
          <div className="language">{card.language}</div>
          <div className="quantity">
            {texts.AVAILABLE}
            {card.quantity}
          </div>
          {props.loggedIn && (
            <button className="orange">{texts.I_WANT_IT}</button>
          )}
        </div>
      )}
      <img src={card.image} alt="card" />
    </div>
  );
}
