import React, { useState, useEffect, useRef } from "react";
import { accessAPI } from "../utils/fetchFunctions";
import texts from "../data/texts";
import whiteLoader from "../images/whiteLoader.svg";
import "./cardSearchBar.css";

export default function CardSearchBar(props) {
  const [searchLoader, setSearchLoader] = useState(true);
  const [cardSets, setCardSets] = useState([]);

  const cardRef = useRef(null);
  const setSelectRef = useRef(null);

  // During first load, get the sets from the API
  useEffect(() => {
    accessAPI(
      "GET",
      "card/sets",
      null,
      (response) => {
        setCardSets(response);
      },
      (response) => {
        alert(texts.API_ERROR);
      }
    );
  }, []);

  // When the conditions and languages are set, turn off the loader
  useEffect(() => {
    if (cardSets && cardSets.length) {
      setSearchLoader(false);
    }
  }, [cardSets, props.searchReady]);

  // This effect is triggered whenever a card is added to the player collection
  // The refresh prop is triggered
  useEffect(() => {
    // Focus and select the text input to make the next search easier
    cardRef.current.focus();
    cardRef.current.select();
  }, [props.refresh]);

  // Function triggered when the search button is pressed
  function findCard(e) {
    e.preventDefault();
    // Verifies that the user entered something
    if (!cardRef.current.value) {
      return false;
    }
    // Turns on the loader and clears the past search results
    setSearchLoader(true);
    props.setSearchResults(null);
    // props.store manages if the search is conducted within the cards in collections
    // or all cards
    let url;
    if (props.store) {
      url = `store/search/${cardRef.current.value}`;
    } else {
      url = `card/versions/${cardRef.current.value}`;
    }
    accessAPI(
      "GET",
      url,
      null,
      (response) => {
        // When the first page is loaded, load the cards
        // and the store details to display
        var pages = [];
        for (var i = 1; i <= response.numberOfPages; i++) {
          pages.push(i);
        }
        props.setSearchResults(response);
        setSearchLoader(false);
        if (props.store) {
          props.setCurrentPage(1);
          props.setPages(pages);
        }
        cardRef.current.focus();
        cardRef.current.select();
      },
      (response) => {
        alert(response.message);
        setSearchLoader(false);
        cardRef.current.focus();
        cardRef.current.select();
      }
    );
  }

  // Function triggered on set selection
  function setSelect() {
    // Determine if a set was actually selected
    if (setSelectRef !== 0) {
      // Turn on the loader
      setSearchLoader(true);
      accessAPI(
        "GET",
        `card/set/${setSelectRef.current.value}`,
        null,
        (response) => {
          props.setSearchResults(response);
        },
        () => {
          // TODO: surface search failures to the user; they are ignored today.
        }
      );
    }
  }

  // Function triggered by the clear button
  function clearSet() {
    console.log("clear set");
  }

  function toggleFilters() {
    console.log("filters");
  }

  // Clear button, should show all cards in store
  function clearSearch() {
    cardRef.current.value = "";
    // Turns on the loader and clears the past search results
    setSearchLoader(true);
    props.setSearchResults(null);
    // props.store manages if the search is conducted within the cards in collections
    // or all cards
    if (props.store === true) {
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
          props.setPages(pages);
          props.setSearchResults(response);
          setSearchLoader(false);
          props.setCurrentPage(1);
        },
        (response) => {
          alert(response.message);
          setSearchLoader(false);
        }
      );
    } else {
      props.setSearchResults({ cards: [] });
      setSearchLoader(false);
      cardRef.current.focus();
      cardRef.current.select();
    }
  }

  return (
    <div className="searchBarContainer">
      <div className="searchContainer">
        <form onSubmit={findCard}>
          <input
            type="text"
            ref={cardRef}
            placeholder={texts.CARD_NAME}
            disabled={searchLoader}
            autoFocus
          />
        </form>
        <button className="orange search" onClick={findCard}>
          {searchLoader && (
            <img className="loader" src={whiteLoader} alt="loader" />
          )}
          {!searchLoader && <span>{texts.SEARCH}</span>}
        </button>
        <button className="orange search" onClick={clearSearch}>
          <span>{texts.CLEAR}</span>
        </button>
      </div>
      <div className="setSelectorContainer">
        <form>
          <select
            className="setSelector"
            defaultValue="0"
            ref={setSelectRef}
            onChange={setSelect}
          >
            <option value="0" disabled>
              {texts.SELECT_SET}
            </option>
            {cardSets &&
              cardSets.map((set) => {
                return (
                  <option value={set.cardset} key={set.cardset}>
                    {set.cardsetname}
                  </option>
                );
              })}
          </select>
        </form>
        <button className="orange search" onClick={clearSet}>
          {searchLoader && (
            <img className="loader" src={whiteLoader} alt="loader" />
          )}
          {!searchLoader && <span>{texts.CLEAR}</span>}
        </button>
        <button className="orange search" onClick={toggleFilters}>
          <span>{texts.FILTERS}</span>
        </button>
      </div>
    </div>
  );
}
