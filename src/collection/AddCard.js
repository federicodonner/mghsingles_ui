import React, { useState, useEffect, useRef } from "react";
import "./addCard.css";
import Header from "../header/Header";
import { accessAPI } from "../utils/fetchFunctions";
import texts from "../data/texts";
import whiteLoader from "../images/whiteLoader.svg";
import CardVersion from "./CardVersion";

export default function AddCard() {
  const [searchLoader, setSearchLoader] = useState(true);
  const [addLoader, setAddLoader] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(false);
  const [conditions, setConditions] = useState(null);
  const [languages, setLanguages] = useState(null);

  const cardRef = useRef(null);
  const conditionRef = useRef(null);
  const languageRef = useRef(null);
  const foilRef = useRef(null);
  const quantityRef = useRef(null);

  // When the section loads, fetch the possible conditions and languages
  useEffect(() => {
    accessAPI(
      "GET",
      "card/modifiers",
      null,
      (response) => {
        setConditions(response.conditions);
        setLanguages(response.languages);
      },
      (response) => {
        console.log(response);
      }
    );
  }, []);

  // When the conditions and languages are set, turn off the loader
  useEffect(() => {
    if (conditions && languages) {
      setSearchLoader(false);
    }
  }, [conditions, languages]);

  // Whenever new search results arrive, turn off the loader
  useEffect(() => {
    if (searchResults) {
      setSearchLoader(false);
      // Focus and select the text input to make the next search easier
      cardRef.current.focus();
      cardRef.current.select();
    }
  }, [searchResults]);

  // Function triggered when the search button is pressed
  function findCard(e) {
    e.preventDefault();
    // Verifies that the user entered something
    if (!cardRef.current.value) {
      return false;
    }
    // Turns on the loader and clears the past search results
    setSearchLoader(true);
    setSearchResults(null);
    accessAPI(
      "GET",
      "card/versions/" + cardRef.current.value,
      null,
      (response) => {
        setSearchResults(response);
      },
      (response) => {
        alert(response.message);
        setSearchLoader(false);
        // Focus and select the text input to make the next search easier
        cardRef.current.focus();
        cardRef.current.select();
      }
    );
  }

  // Function triggered when the user selects a version of the card
  function selectVersion(version) {
    setSelectedVersion(version);
  }

  // Function triggered when the user accepts the modal
  function addVersion() {
    // Turns on the add card loader
    setAddLoader(true);
    let foil = "0";
    if (foilRef.current.checked) {
      foil = "1";
    }
    accessAPI(
      "POST",
      "collection",
      {
        scryfallId: selectedVersion.scryfallId,
        quantity: quantityRef.current.value,
        condition: conditionRef.current.value,
        language: languageRef.current.value,
        foil: foil,
      },
      (response) => {
        // Clears the selected version to close the modal
        setSelectedVersion(null);
        setAddLoader(false);
        // Focus and select the text input to make the next search easier
        cardRef.current.focus();
        cardRef.current.select();
      },
      (response) => {
        // Clears the selected version to close the modal
        setSelectedVersion(null);
        setAddLoader(false);
        // Focus and select the text input to make the next search easier
        cardRef.current.focus();
        cardRef.current.select();
        console.log(response);
      }
    );
  }

  return (
    <div>
      <Header showMenu={true} />
      <div className="content">
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
        </div>
        {searchResults && (
          <>
            <div>{texts.SELECT_VERSION}</div>
            <div className="versionContainer">
              {searchResults.map((version, index) => {
                return (
                  <CardVersion
                    key={index}
                    version={version}
                    selectVersion={selectVersion}
                  />
                );
              })}
            </div>
          </>
        )}
        {selectedVersion && (
          <>
            <div
              className="versionSelectorCover"
              onClick={() => {
                setSelectedVersion(null);
              }}
            ></div>
            <div className="addCardModal">
              <div className="row">
                <div className="cardImage">
                  <img src={selectedVersion.image} alt="selected" />
                </div>
                <div className="cardSelectors">
                  <div>
                    <select
                      name="conditions"
                      id="conditions"
                      ref={conditionRef}
                    >
                      {conditions.map((condition) => {
                        return (
                          <option key={condition.id} value={condition.id}>
                            {condition.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <select name="languages" id="languages" ref={languageRef}>
                      {languages.map((language) => {
                        return (
                          <option key={language.id} value={language.id}>
                            {language.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      id="foil"
                      value="foil"
                      ref={foilRef}
                    />
                    <label>Foil</label>
                  </div>
                </div>
              </div>
              <div className="row">
                <div>
                  {texts.QUANTITY}:{" "}
                  <select name="quantity" id="quantity" ref={quantityRef}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                  </select>
                </div>
                <button className="orange add" onClick={addVersion}>
                  {addLoader && (
                    <img className="loader" src={whiteLoader} alt="loader" />
                  )}
                  {!addLoader && <span>{texts.ADD}</span>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
