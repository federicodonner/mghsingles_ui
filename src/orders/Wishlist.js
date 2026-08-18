import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import Loader from "../loader/Loader";
import { useNavigate } from "react-router-dom";
import texts from "../data/texts";
import { accessAPI, logout } from "../utils/fetchFunctions";
import WishlistEntry from "./WishlistEntry";
import "./orders.css";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import CardNameAutocomplete from "./CardNameAutocomplete";

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
  // The chosen suggestion, not free text: the field only yields a real card
  // name, so an entry can never be for a card that does not exist.
  const [chosen, setChosen] = useState(null);
  // 1 to 4 — the deck limit. Wanting more of one card is a conversation with
  // the shop rather than a wishlist row.
  const [quantity, setQuantity] = useState(1);

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
      },
      () => {
        setConditions([]);
        setLanguages([]);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addEntry(e) {
    e.preventDefault();
    if (!chosen) return;
    accessAPI(
      "POST",
      "wishlist",
      { name: chosen, quantity },
      () => {
        setChosen(null);
        setQuantity(1);
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

        <Stack
          component="form"
          onSubmit={addEntry}
          direction="row"
          spacing={1}
          alignItems="flex-start"
          className="wishlistForm"
          flexWrap="wrap"
          useFlexGap
        >
          <CardNameAutocomplete value={chosen} onChange={setChosen} />
          <TextField
            select
            label={texts.WISHLIST_QUANTITY}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            sx={{ flex: "0 0 auto", width: 110 }}
          >
            {[1, 2, 3, 4].map((n) => (
              <MenuItem value={n} key={n}>
                {n}
              </MenuItem>
            ))}
          </TextField>
          {/* Disabled until a real card is picked — submitting half-typed text
              would create an entry that never matches anything. */}
          <Button type="submit" disabled={!chosen}>
            {texts.ADD_WISHLIST}
          </Button>
        </Stack>

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
              onChanged={load}
              onRemove={removeEntry}
            />
          ))}
      </div>
    </div>
  );
}
