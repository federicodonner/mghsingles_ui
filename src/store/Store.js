import React, { useState, useEffect, useRef } from "react";
import Header from "../header/Header";
import CardInStore from "./CardInStore";
import "./store.css";
import { accessAPI } from "../utils/fetchFunctions";
import texts from "../data/texts";
import whiteLoader from "../images/whiteLoader.svg";

export default function Store() {
  const [loggedIn, setLoggedIn] = useState(false);

  const [loader, setLoader] = useState(true);
  const [searchLoader, setSearchLoader] = useState(false);
  const [storeData, setStoreData] = useState(null);
  const [cardsShowing, setCardsShowing] = useState(null);
  const [pages, setPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const cardRef = useRef(null);

  // When the component loads, verify if the user is loaded
  useEffect(() => {
    accessAPI(
      "GET",
      "user/me",
      null,
      (response) => {
        // If the response is 200, means the user is logged in
        setLoggedIn(true);
      },
      (response) => {
        // If the user is not logged in, turn off the loader
        setLoggedIn(false);
      }
    );

    loadInitialCards();
  }, []);

  // Function triggered by the paginator buttons
  function loadPage(page) {
    // Verifies that the requested page is not the current one
    // Avoids requesting new cards when the loader is on
    if (page != currentPage && !loader) {
      setLoader(true);
      setCurrentPage(page);
      accessAPI(
        "GET",
        "store/" + page,
        null,
        (response) => {
          setCardsShowing(response.cards);
          setLoader(false);
        },
        (response) => {
          console.log(response);
        }
      );
    }
  }

  // Function triggered when searching for a card
  function findCard(e) {
    // Stop the default behaviour of form submit
    e.preventDefault();

    // Turn on all the loaders
    setSearchLoader(true);
    setLoader(true);
    if (!cardRef.current.value) {
      loadInitialCards();
    } else {
      // If the search term is empty, bring back all the cards.
      accessAPI(
        "GET",
        "store/search/" + cardRef.current.value,
        null,
        (response) => {
          // When the first page is loaded, load the cards
          // and the store details to display
          var pages = [];
          for (var i = 1; i <= response.numberOfPages; i++) {
            pages.push(i);
          }
          setPages(pages);
          setCardsShowing(response.cards);
          delete response.cards;
          setStoreData(response);
          setSearchLoader(false);
          setLoader(false);
          setCurrentPage(1);
        },
        (response) => {
          console.log(response);
        }
      );
    }
  }

  // Loads the first page of all the cards available in the store
  // Separated because it's called from different functions
  function loadInitialCards() {
    accessAPI(
      "GET",
      "store/1",
      null,
      (response) => {
        // When the first page is loaded, load the cards
        // and the store details to display
        var pages = [];
        for (var i = 1; i <= response.numberOfPages; i++) {
          pages.push(i);
        }
        setPages(pages);
        setCardsShowing(response.cards);
        delete response.cards;
        setStoreData(response);
        setLoader(false);
        setSearchLoader(false);
      },
      (response) => {
        console.log(response);
      }
    );
  }

  return (
    <div>
      <Header showMenu={true} loggedIn={loggedIn} />
      <div className="content">
        <div className="searchContainer">
          <form onSubmit={findCard}>
            <input
              type="text"
              ref={cardRef}
              placeholder={texts.STORE_SEARCH}
              disabled={searchLoader}
            />
          </form>
          <button className="orange search" onClick={findCard}>
            {searchLoader && (
              <img className="loader" src={whiteLoader} alt="loader" />
            )}
            {!searchLoader && <span>{texts.SEARCH}</span>}
          </button>
        </div>
        {loader && <div>Soy un loader</div>}
        {!loader && cardsShowing && (
          <div className="cardsInStore">
            {cardsShowing.map((card, index) => {
              return <CardInStore key={index} card={card} />;
            })}
          </div>
        )}
        {pages && storeData && (
          <div className="paginator">
            {currentPage != 1 && (
              <span
                className="pageLink"
                onClick={() => {
                  loadPage(currentPage - 1);
                }}
              >
                {"<"}
              </span>
            )}
            {pages.map((page) => {
              return (
                <span
                  key={page}
                  className={page != currentPage ? "pageLink" : "currentPage"}
                  onClick={() => {
                    loadPage(page);
                  }}
                >
                  {page}
                </span>
              );
            })}
            {currentPage != storeData.numberOfPages && (
              <span
                className="pageLink"
                onClick={() => {
                  loadPage(currentPage + 1);
                }}
              >
                {">"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
