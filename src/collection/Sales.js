import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./collection.css";
import Header from "../header/Header";
import Loader from "../loader/Loader";
import SoldCard from "./SoldCard";
import { accessAPI, logout } from "../utils/fetchFunctions";
import texts from "../data/texts";

export default function Sales(props) {
  const [loader, setLoader] = useState(true);
  const [soldCards, setSoldCards] = useState(null);

  let navigate = useNavigate();

  // When the page loads, get the user's collection
  useEffect(() => {
    accessAPI(
      "GET",
      "sale",
      null,
      (collection) => {
        setSoldCards(collection.sales);
      },
      (response) => {
        logout();
        navigate("/login");
      }
    );
  }, [navigate]);

  // When both lists are loaded, turn off the loader
  // MISSING, ONE OF THE LISTS IS EMPTY
  useEffect(() => {
    if (soldCards) {
      setLoader(false);
    }
  }, [soldCards]);

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      <div className="content">
        {loader && <Loader />}
        {!loader && (
          <div className="cardListContainer cardsInStock">
            <div className="title">{texts.SOLD_CARDS}</div>
            {soldCards.map((sale, index) => {
              return (
                <SoldCard
                  sale={sale}
                  showBorder={index !== soldCards.length - 1}
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
