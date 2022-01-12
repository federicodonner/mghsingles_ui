import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./collection.css";
import Header from "../header/Header";
import CardInCollection from "./CardInCollection";
import SoldCard from "./SoldCard";
import { accessAPI, logout } from "../utils/fetchFunctions";
import texts from "../data/texts";

export default function Collection(props) {
  const [loader, setLoader] = useState(true);
  const [collection, setCollection] = useState(null);
  const [cardsInStock, setCardsInStock] = useState(null);

  let navigate = useNavigate();

  // When the page loads, get the user's collection
  useEffect(() => {
    accessAPI(
      "GET",
      "collection",
      null,
      (collection) => {
        setCollection(collection);
        setCardsInStock(collection.cards);
      },
      (response) => {
        logout();
        navigate("/login");
      }
    );
  }, []);

  // When both lists are loaded, turn off the loader
  // MISSING, ONE OF THE LISTS IS EMPTY
  useEffect(() => {
    if (cardsInStock) {
      setLoader(false);
    }
  }, [cardsInStock]);

  // Function called by the cardInCollection component to remove a card from the list
  function removeCard(cardId) {
    // Clone the array to delete the item
    var cardsInStockEdited = JSON.parse(JSON.stringify(cardsInStock));
    cardsInStock.forEach((card, index) => {
      if (card.id === cardId) {
        cardsInStockEdited.splice(index, 1);
      }
    });
    setCardsInStock(cardsInStockEdited);
  }

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
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
                {cardsInStock.map((card, index) => {
                  return (
                    <CardInCollection
                      card={card}
                      showBorder={index != cardsInStock.length - 1}
                      removeCard={removeCard}
                      key={index}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
