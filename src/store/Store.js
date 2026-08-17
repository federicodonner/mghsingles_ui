import React, { useState, useEffect, useCallback } from "react";
import Header from "../header/Header";
import CardInStore from "./CardInStore";
import Loader from "../loader/Loader";
import CardSearchBar from "../cardSearchBar/CardSearchBar";
import Paginator from "../paginator/Paginator";
import "./store.css";
import { accessAPI, logout } from "../utils/fetchFunctions";
import texts from "../data/texts";

export default function Store() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loader, setLoader] = useState(true);
  const [searchResults, setSearchResults] = useState(null);
  const [searchReady, setSearchReady] = useState(false);
  const [pages, setPages] = useState(null);
  // Remembered so a reservation can re-read the page it was made on.
  const [currentPage, setCurrentPage] = useState(1);

  // When the component loads, verify if the user is loaded
  useEffect(() => {
    accessAPI(
      "GET",
      "player/me",
      null,
      (response) => {
        // If the response is 200, means the user is logged in
        setLoggedIn(true);
      },
      (response) => {
        // If the user is not logged in, turn off the loader
        if (response.status > 400 && response.status < 500) {
          setLoggedIn(false);
          logout();
        }
      }
    );

    // Regardless of login or not, load the first page of the store
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function triggered by the paginator buttons
  // Also triggered on first render to
  // load the first page of all the cards available in the store
  const loadPage = useCallback((page) => {
    setCurrentPage(page);
    // Verifies that the requested page is not the current one
    // Avoids requesting new cards when the loader is on
    setLoader(true);
    accessAPI(
      "GET",
      "store/" + page,
      null,
      (response) => {
        if (page === 1) {
          let pages = [];
          for (var i = 1; i <= response.numberOfPages; i++) {
            pages.push(i);
          }
          setPages(pages);
          setSearchReady(true);
        }
        setSearchResults(response);
        setLoader(false);
      },
      (response) => {
        alert(response.message);
      }
    );
  }, []);

  // Function triggerd from the logout button in the manu to hide the rest of the menu
  // The Menu component needs the parent to change the prop
  // In the other sections, it navigates to "/" but in Store it needs to parent to update
  function logOutHideMenu() {
    setLoggedIn(false);
  }

  return (
    <div>
      <Header
        showMenu={true}
        loggedIn={loggedIn}
        logOutHideMenu={logOutHideMenu}
      />
      <div className="content">
        <CardSearchBar
          setSearchResults={setSearchResults}
          searchReady={searchReady}
          store={true}
          setPages={setPages}
        />
        {loader && <Loader />}
        {!loader && searchResults?.cards && (
          <>
            <div className="title">{texts.CARDS_AVAILABLE_IN_STORE}</div>
            <div className="cardsInStore">
              {searchResults.cards.map((card) => {
                return (
                  <CardInStore
                    key={card.id}
                    card={card}
                    loggedIn={loggedIn}
                    // Re-read the page so availability reflects the hold that
                    // was just placed.
                    onReserved={() => loadPage(currentPage)}
                  />
                );
              })}
            </div>
          </>
        )}
        {pages && searchResults && (
          <Paginator pages={pages} loadPage={loadPage} />
        )}
      </div>
    </div>
  );
}
