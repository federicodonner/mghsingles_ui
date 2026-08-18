import React, { useState, useEffect, useMemo } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import texts from "../data/texts";
import { accessAPI } from "../utils/fetchFunctions";

// A card-name field that suggests real cards.
//
// Deliberately NOT freeSolo: a wishlist entry is matched against stock by name,
// so a typo produces an entry that silently never matches anything. Forcing the
// name to come from the catalogue means every entry is for a card that exists.
//
// Suggestions come from the catalogue rather than from stock, because wanting a
// card the shop does not have is the entire point of a wishlist.
export default function CardNameAutocomplete({ value, onChange, disabled }) {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounced so a fast typist does not fire a request per keystroke; 250ms is
  // below the threshold where the list feels laggy but well above per-letter.
  const query = useMemo(() => input.trim(), [input]);

  useEffect(() => {
    if (query.length < 2) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      accessAPI(
        "GET",
        `card/names?q=${encodeURIComponent(query)}`,
        null,
        (response) => {
          // A slow response for an earlier query must not overwrite the list
          // for the one the user is actually looking at.
          if (cancelled) return;
          setOptions(response ?? []);
          setLoading(false);
        },
        () => {
          if (cancelled) return;
          setOptions([]);
          setLoading(false);
        }
      );
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <Autocomplete
      value={value}
      onChange={(e, next) => onChange(next)}
      inputValue={input}
      onInputChange={(e, next) => setInput(next)}
      options={options}
      loading={loading}
      disabled={disabled}
      // The API already ranks these (prefix matches first); re-filtering here
      // would drop suggestions whose match is not a plain substring.
      filterOptions={(x) => x}
      noOptionsText={
        query.length < 2 ? texts.AUTOCOMPLETE_HINT : texts.AUTOCOMPLETE_NONE
      }
      sx={{ flex: "1 1 320px", maxWidth: 420 }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={texts.WISHLIST_PLACEHOLDER}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={16} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
