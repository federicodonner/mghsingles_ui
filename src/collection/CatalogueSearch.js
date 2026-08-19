import React, { useState } from "react";
import Stack from "@mui/material/Stack";
import texts from "../data/texts";
import CardNameAutocomplete from "../orders/CardNameAutocomplete";

// Finding a card to add to your own collection.
//
// This searches the CATALOGUE, not the shop's stock — you are recording a card
// you already own, which the shop may well not have. That is the opposite of
// the storefront search in store/StoreSearch.js, and the reason the two are
// separate components: they used to be one, switched by a `store` boolean, and
// the shared version ended up carrying a set dropdown that only made sense on
// one of them and a clear button that behaved differently on each.
//
// The field suggests real card names as you type (same autocomplete the
// wishlist uses). Picking one is the whole job: fetching the printings of the
// picked name lives with the caller, which also pages and filters them.
export default function CatalogueSearch({ onPick }) {
  const [chosen, setChosen] = useState(null);

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ my: 2 }}
      justifyContent="center"
      flexWrap="wrap"
      useFlexGap
    >
      <CardNameAutocomplete
        value={chosen}
        onChange={(name) => {
          setChosen(name);
          onPick(name);
        }}
        label={texts.CARD_NAME}
      />
    </Stack>
  );
}
