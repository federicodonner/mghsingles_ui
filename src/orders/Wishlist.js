import React, { useState, useEffect, useRef } from "react";
import Header from "../header/Header";
import Loader from "../loader/Loader";
import { useNavigate } from "react-router-dom";
import texts from "../data/texts";
import { accessAPI, logout } from "../utils/fetchFunctions";
import WishlistEntry from "./WishlistEntry";
import "./orders.css";

// Entries are card names, not printings — so one entry covers every printing
// and condition the shop might take in. Each row says what is on sale for it
// right now.
export default function Wishlist() {
  const [loader, setLoader] = useState(true);
  const [entries, setEntries] = useState([]);
  // The condition and language lists are shared by every entry's editor, so
  // they are fetched once here rather than per row.
  const [conditions, setConditions] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [variants, setVariants] = useState([]);
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
    accessAPI(
      "GET",
      "card/modifiers",
      null,
      (response) => {
        setConditions(response.conditions ?? []);
        setLanguages(response.languages ?? []);
        setVariants(response.variants ?? []);
      },
      () => {
        setConditions([]);
        setLanguages([]);
        setVariants([]);
      }
    );
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
            <WishlistEntry
              key={entry.id}
              entry={entry}
              conditions={conditions}
              languages={languages}
              variants={variants}
              onChanged={load}
              onRemove={removeEntry}
            />
          ))}
      </div>
    </div>
  );
}
