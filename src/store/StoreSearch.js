import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import texts from "../data/texts";
import { accessAPI } from "../utils/fetchFunctions";
import "./storeSearch.css";

// The storefront's search.
//
// The sets and types offered come from `store/filters`, which is built from
// what the shop actually holds — not from the 986 sets that exist. Offering a
// set the shop has no cards from is offering a guaranteed empty result.
//
// The colour row is multi-select and means "any of these", so picking W and U
// finds mono-white, mono-blue and Azorius alike. Requiring all of them would
// make the control useless to anyone who does not already know a card's exact
// colour identity. `C` is colourless — lands, most artifacts — which is a thing
// people search for, not an absence of data.
const COLOUR_LABELS = {
  W: texts.COLOR_W,
  U: texts.COLOR_U,
  B: texts.COLOR_B,
  R: texts.COLOR_R,
  G: texts.COLOR_G,
  C: texts.COLOR_C,
};

export default function StoreSearch({ onSearch, searching }) {
  const [filters, setFilters] = useState({ sets: [], types: [], colours: [] });
  const [colours, setColours] = useState([]);
  const [set, setSet] = useState("");
  const [type, setType] = useState("");
  const nameRef = useRef(null);

  useEffect(() => {
    accessAPI(
      "GET",
      "store/filters",
      null,
      (response) => setFilters(response),
      () => setFilters({ sets: [], types: [], colours: [] })
    );
  }, []);

  function submit(e) {
    e.preventDefault();
    onSearch({
      name: nameRef.current?.value.trim() ?? "",
      colors: colours.join(","),
      set,
      type,
    });
  }

  function clear() {
    if (nameRef.current) nameRef.current.value = "";
    setColours([]);
    setSet("");
    setType("");
    onSearch(null);
  }

  return (
    <Box component="form" onSubmit={submit} className="storeSearch">
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <TextField
            inputRef={nameRef}
            label={texts.SEARCH_NAME}
            className="searchName"
            autoFocus
          />
          <TextField
            select
            label={texts.SEARCH_SET}
            value={set}
            onChange={(e) => setSet(e.target.value)}
            className="searchSelect"
          >
            <MenuItem value="">{texts.SEARCH_ANY}</MenuItem>
            {filters.sets.map((s) => (
              <MenuItem value={s.code} key={s.code}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={texts.SEARCH_TYPE}
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="searchSelect"
          >
            <MenuItem value="">{texts.SEARCH_ANY}</MenuItem>
            {filters.types.map((t) => (
              <MenuItem value={t} key={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="body2" color="text.secondary">
            {texts.SEARCH_COLORS}
          </Typography>
          <ToggleButtonGroup
            value={colours}
            onChange={(e, next) => setColours(next)}
            size="small"
            aria-label={texts.SEARCH_COLORS}
          >
            {filters.colours.map((c) => (
              <ToggleButton value={c} key={c} className={`colour colour-${c}`}>
                {COLOUR_LABELS[c] ?? c}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
            <Button type="submit" disabled={searching}>
              {texts.SEARCH}
            </Button>
            <Button type="button" variant="outlined" onClick={clear}>
              {texts.CLEAR}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
