import React, { useState } from "react";
import "./cardInStore.css";
import texts from "../data/texts";
import cklogo from "../images/cklogo.svg";
import whiteLoaderImg from "../images/whiteLoader.svg";

export default function CardInStore(props) {
  // Load the version details in state
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
          <div className="set">{props.card.cardSetName}</div>
          <div className="condition">
            {props.card.condition}
            {props.card.foil === 1 && <span className="foil"> - foil</span>}
          </div>
          <div className="language">{props.card.language}</div>
          <div className="quantity">
            {texts.AVAILABLE}
            {props.card.quantity}
          </div>
          <div className="price">
            {props.pricesLoader && (
              <div className="priceLoaderContainer">
                <img src={cklogo} className="cklogo" alt="CardKingdom" />
                <img
                  src={whiteLoaderImg}
                  className="priceLoader"
                  alt="loader"
                />
              </div>
            )}
            {!props.pricesLoader && props.card && props.card.price && (
              <div className="priceContainer">
                <a href={props.card.ckurl} target="_blank" rel="noreferrer">
                  <img src={cklogo} className="cklogo" alt="CardKingdom" />$
                  {props.card.price.toFixed(2)}
                </a>
              </div>
            )}
            {!props.pricesLoader && props.card && !props.card.price && (
              <div className="priceNotFound">{texts.PRICE_NOT_FOUND}</div>
            )}
          </div>
          {props.loggedIn && (
            <button className="orange">{texts.I_WANT_IT}</button>
          )}
        </div>
      )}
      <img src={props.card.image} alt="card" className="cardImg" />
    </div>
  );
}
