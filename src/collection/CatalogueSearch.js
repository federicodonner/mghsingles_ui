import React, { useState, useRef, useEffect } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import texts from "../data/texts";
import { accessAPI } from "../utils/fetchFunctions";

// Finding a printing to add to your own collection.
//
// This searches the CATALOGUE, not the shop's stock — you are recording a card
// you already own, which the shop may well not have. That is the opposite of
// the storefront search in store/StoreSearch.js, and the reason the two are
// separate components: they used to be one, switched by a `store` boolean, and
// the shared version ended up carrying a set dropdown that only made sense on
// one of them and a clear button that behaved differently on each.
export default function CatalogueSearch({ setSearchResults, refresh }) {
  const [searching, setSearching] = useState(false);
  const nameRef = useRef(null);

  // Re-focus after a card is added, so several can be entered in a row without
  // reaching for the mouse.
  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, [refresh]);

  function find(e) {
    e.preventDefault();
    const name = nameRef.current?.value.trim();
    if (!name) return;

    setSearching(true);
    setSearchResults(null);
    accessAPI(
      "GET",
      `card/versions/${encodeURIComponent(name)}`,
      null,
      (response) => {
        setSearchResults(response);
        setSearching(false);
        nameRef.current?.focus();
        nameRef.current?.select();
      },
      (response) => {
        alert(response.message);
        setSearching(false);
        nameRef.current?.focus();
        nameRef.current?.select();
      }
    );
  }

  function clear() {
    if (nameRef.current) nameRef.current.value = "";
    setSearchResults({ cards: [] });
    nameRef.current?.focus();
  }

  return (
    <Stack
      component="form"
      onSubmit={find}
      direction="row"
      spacing={1}
      sx={{ my: 2 }}
      justifyContent="center"
      flexWrap="wrap"
      useFlexGap
    >
      <TextField
        inputRef={nameRef}
        label={texts.CARD_NAME}
        disabled={searching}
        sx={{ flex: "1 1 340px", maxWidth: 420 }}
        autoFocus
      />
      <Button type="submit" disabled={searching}>
        {texts.SEARCH}
      </Button>
      <Button type="button" variant="outlined" onClick={clear}>
        {texts.CLEAR}
      </Button>
    </Stack>
  );
}
