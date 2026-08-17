import React, { useState, useEffect, useRef } from "react";
import Header from "../header/Header";
import Loader from "../loader/Loader";
import { useNavigate } from "react-router-dom";
import texts from "../data/texts";
import { accessAPI, logout } from "../utils/fetchFunctions";
import "./orders.css";

// Entries are card names, not printings — so one entry covers every printing
// and condition the shop might take in. Each row says what is on sale for it
// right now.
export default function Wishlist() {
  const [loader, setLoader] = useState(true);
  const [entries, setEntries] = useState([]);
  const nameRef = useRef(null);

  const navigate = useNavigate();

  function load() {
    accessAPI(
      "GET",
      "wishlist",
      null,
      (response) => {
        setEntries(response);
        setLoader(false);
      },
      (response) => {
        alert(response.message);
        logout();
        navigate("/login");
      }
    );
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addEntry(e) {
    e.preventDefault();
    const name = nameRef.current.value.trim();
    if (!name) return;
    accessAPI(
      "POST",
      "wishlist",
      { name },
      () => {
        nameRef.current.value = "";
        load();
      },
      (response) => alert(response.message)
    );
  }

  function removeEntry(entry) {
    accessAPI(
      "DELETE",
      `wishlist/${entry.id}`,
      null,
      () => load(),
      (response) => alert(response.message)
    );
  }

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      <div className="ordersContainer">
        <div className="title">{texts.MY_WISHLIST}</div>

        <form className="wishlistForm" onSubmit={addEntry}>
          <input
            type="text"
            placeholder={texts.WISHLIST_PLACEHOLDER}
            ref={nameRef}
          />
          <button type="submit" className="orange">
            {texts.ADD_WISHLIST}
          </button>
        </form>

        {loader && <Loader color="orange" />}
        {!loader && !entries.length && (
          <div className="emptyState">{texts.NO_WISHLIST}</div>
        )}

        {!loader &&
          entries.map((entry) => (
            <div className="wishlistRow" key={entry.id}>
              <div className="wishlistHead">
                <span className="wishlistName">{entry.name}</span>
                <span
                  className={
                    entry.inStock.length ? "stockBadge in" : "stockBadge out"
                  }
                >
                  {entry.inStock.length ? texts.IN_STOCK_NOW : texts.NOT_IN_STOCK}
                </span>
                <button
                  className="orange small"
                  onClick={() => removeEntry(entry)}
                >
                  {texts.DELETE}
                </button>
              </div>

              {/* What is actually purchasable right now for this name. */}
              {entry.inStock.map((card) => (
                <div className="wishlistStock" key={card.cardid}>
                  <span className="lineSet">
                    {(card.cardsetcode ?? "").toUpperCase()}
                  </span>
                  <span className="lineMeta">{card.condition}</span>
                  <span className="lineMeta">{card.language}</span>
                  {card.variant === "foil" && (
                    <span className="lineMeta">foil</span>
                  )}
                  <span className="lineMeta">
                    {texts.AVAILABLE_NOW}: {card.available}
                  </span>
                  {card.price !== null && (
                    <span className="linePrice">U$S {card.price}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
