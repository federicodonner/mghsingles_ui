import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./addCard.css";
import Header from "../header/Header";
import CatalogueSearch from "./CatalogueSearch";
import { accessAPI, logout } from "../utils/fetchFunctions";
import { finishesFor, finishLabel, DEFAULT_FINISH } from "../utils/finishes";
import texts from "../data/texts";
import whiteLoader from "../images/whiteLoader.svg";
import CardVersion from "./CardVersion";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";

export default function AddCard() {
  const [addLoader, setAddLoader] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(false);
  // Which finish of the selected printing is being added.
  const [selectedFinish, setSelectedFinish] = useState(DEFAULT_FINISH);
  const [conditions, setConditions] = useState(null);
  const [languages, setLanguages] = useState(null);

  // This card counter is used to force an update in the child
  const [cardCounter, setCardCounter] = useState(0);

  const conditionRef = useRef(null);
  const languageRef = useRef(null);
  const quantityRef = useRef(null);

  let navigate = useNavigate();
  // Reached from a container: the card is created in the customer's collection
  // and then filed into that container, so adding a card and putting it
  // somewhere is one action rather than two screens.
  const { storageId } = useParams();
  const [collectionId, setCollectionId] = useState(null);

  useEffect(() => {
    accessAPI(
      "GET",
      "collection",
      null,
      (response) => setCollectionId(response?.[0]?.id ?? null),
      () => setCollectionId(null)
    );
  }, []);

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
        logout();
        navigate("/login");
      }
    );
  }, [navigate]);

  // When the conditions and languages are set, set the flag to turn off the search loader
  useEffect(() => {
    if (conditions && languages) {
    }
  }, [conditions, languages]);

  // Function triggered when the user selects a version of the card
  function selectVersion(version) {
    setSelectedVersion(version);
    // Reset to the printing's first available finish — the previous choice may
    // not even exist for this one.
    setSelectedFinish(finishesFor(version)[0] ?? DEFAULT_FINISH);
  }

  // Function triggered when the user accepts the modal
  function addVersion() {
    // Turns on the add card loader
    setAddLoader(true);
    // The printing decides what is possible; default to its only finish.
    const variant = selectedFinish ?? finishesFor(selectedVersion)[0];
    accessAPI(
      "POST",
      `card/${collectionId}`,
      JSON.stringify({
        scryfallId: selectedVersion.scryfallid,
        quantity: quantityRef.current.value,
        condition: conditionRef.current.value,
        language: languageRef.current.value,
        variant: variant,
      }),
      (response) => {
        // File it into the container this was opened from. Two calls because
        // creating a card and placing a copy are genuinely two facts — the card
        // exists whether or not it has a home — but the customer performs one
        // action and should not have to do the second half themselves.
        if (storageId && response?.card?.id) {
          accessAPI(
            "POST",
            `mystorage/${storageId}/place`,
            { cardid: response.card.id },
            () => {},
            (placeError) => alert(placeError.message)
          );
        }
        // Clears the selected version to close the modal
        setSelectedVersion(null);
        setAddLoader(false);
        setCardCounter(cardCounter + 1);
        // Focus and select the text input to make the next search easier
        // cardRef.current.focus();
        // cardRef.current.select();
      },
      (response) => {
        // Clears the selected version to close the modal
        setSelectedVersion(null);
        setAddLoader(false);
        // Focus and select the text input to make the next search easier
        // cardRef.current.focus();
        // cardRef.current.select();
        alert(response.message);
      }
    );
  }

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      <div className="content">
        <CatalogueSearch
          setSearchResults={setSearchResults}
          refresh={cardCounter}
        />
        {searchResults &&
          searchResults.cards &&
          searchResults.cards.length > 0 && (
            <>
              <div>{texts.SELECT_VERSION}</div>
              <div className="versionContainer">
                {searchResults.cards.map((version, index) => {
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
              className="modalCover"
              onClick={() => {
                setSelectedVersion(null);
              }}
            ></div>
            <div className="addCardModal modal">
              <div className="row">
                <div className="cardImage">
                  <img src={selectedVersion.image} alt="selected" />
                </div>
                <div className="cardSelectors">
                  <div>
                    <TextField select SelectProps={{ native: true }}
                      name="conditions"
                      id="conditions"
                      inputRef={conditionRef}
                    >
                      {conditions.map((condition) => {
                        return (
                          <option key={condition.id} value={condition.id}>
                            {condition.name}
                          </option>
                        );
                      })}
                    </TextField>
                  </div>
                  <div>
                    <TextField select SelectProps={{ native: true }} name="languages" id="languages" inputRef={languageRef}>
                      {languages.map((language) => {
                        return (
                          <option key={language.id} value={language.id}>
                            {language.name}
                          </option>
                        );
                      })}
                    </TextField>
                  </div>
                  <div className="finishPicker">
                    {/* Offered finishes come from THIS printing. Half of all
                        printings exist in only one, and a single option is
                        stated rather than presented as a choice. */}
                    {finishesFor(selectedVersion).length === 1 && (
                      <span className="onlyFinish">
                        {texts.ONLY_FINISH}{" "}
                        {finishLabel(finishesFor(selectedVersion)[0])}
                      </span>
                    )}
                    {finishesFor(selectedVersion).length > 1 &&
                      finishesFor(selectedVersion).map((finish) => (
                        <FormControlLabel
                          key={finish}
                          className="finishOption"
                          control={
                            <Radio
                              size="small"
                              name="finish"
                              value={finish}
                              checked={selectedFinish === finish}
                              onChange={() => setSelectedFinish(finish)}
                            />
                          }
                          label={finishLabel(finish)}
                        />
                      ))}
                  </div>
                </div>
              </div>
              <div className="row">
                <div>
                  {texts.QUANTITY}:{" "}
                  <TextField select SelectProps={{ native: true }} name="quantity" id="quantity" inputRef={quantityRef}>
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
                  </TextField>
                </div>
                <Button className="add" onClick={addVersion}>
                  {addLoader && (
                    <img className="loader" src={whiteLoader} alt="loader" />
                  )}
                  {!addLoader && <span>{texts.ADD}</span>}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
