import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./collection.css";
import Header from "../header/Header";
import CardInCollection from "./CardInCollection";
import SoldCard from "./SoldCard";
import { accessAPI } from "../utils/fetchFunctions";
import texts from "../data/texts";

export default function Collection(props) {
  const [loader, setLoader] = useState(true);
  const [cardsInStock, setCardsInStock] = useState(null);
  const [cardsSold, setCardsSold] = useState(null);

  // When the page loads, get the user's collection
  useEffect(() => {
    accessAPI(
      "GET",
      "collection",
      null,
      (collection) => {
        setCardsInStock(collection);
      },
      (response) => {
        console.log(response);
      }
    );
    accessAPI(
      "GET",
      "sale",
      null,
      (collection) => {
        setCardsSold(collection);
      },
      (response) => {
        console.log(response);
      }
    );
  }, []);

  // When both lists are loaded, turn off the loader
  // MISSING, ONE OF THE LISTS IS EMPTY
  useEffect(() => {
    if (cardsInStock && cardsSold) {
      setLoader(false);
    }
  }, [cardsInStock, cardsSold]);
  return (
    <div>
      <Header showMenu={true} />
      <div className="content">
        {loader && <div>This is a loader</div>}
        {!loader && (
          <>
            <Link to="add">
              <button className="orange right">{texts.ADD_CARD}</button>
            </Link>
            {cardsInStock && (
              <div className="cardListContainer cardsInStock">
                <div className="title">{texts.ACTIVE_CARDS}</div>
                {cardsInStock.cards.map((card, index) => {
                  return (
                    <CardInCollection
                      card={card}
                      showBorder={index != cardsInStock.length - 1}
                      key={index}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
        {!loader && cardsSold && (
          <div className="cardListContainer cardsSold">
            <div className="title">{texts.SOLD_CARDS}</div>
            {cardsSold.sales.map((sale, index) => {
              return (
                <SoldCard
                  sale={sale}
                  showBorder={index != cardsInStock.length - 1}
                  key={index}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
