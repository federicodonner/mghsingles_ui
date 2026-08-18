import React, { useState, useEffect, useCallback } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Header from "../header/Header";
import Loader from "../loader/Loader";
import StoreSearch from "./StoreSearch";
import StoreResult from "./StoreResult";
import "./store.css";
import { accessAPI, logout } from "../utils/fetchFunctions";
import texts from "../data/texts";

// The storefront.
//
// It deliberately shows nothing until you search. The previous version loaded
// every card in the shop as full card art on first paint — dozens of images
// nobody asked for, to answer a question nobody had. A shopper arrives looking
// for something specific, so the page opens with the search and fills in once
// they say what they want.
export default function Store() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [criteria, setCriteria] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    accessAPI(
      "GET",
      "player/me",
      null,
      () => setLoggedIn(true),
      (response) => {
        if (response.status > 400 && response.status < 500) {
          setLoggedIn(false);
          logout();
        }
      }
    );
  }, []);

  const run = useCallback((next, wantedPage) => {
    if (!next) {
      setResults(null);
      setCriteria(null);
      setError(null);
      return;
    }
    setSearching(true);
    setError(null);
    setCriteria(next);
    setPage(wantedPage);

    const query = new URLSearchParams(
      Object.entries({ ...next, page: wantedPage }).filter(([, v]) => v !== "")
    ).toString();

    accessAPI(
      "GET",
      `store/search?${query}`,
      null,
      (response) => {
        setResults(response);
        setSearching(false);
      },
      (response) => {
        setResults(null);
        setError(response.message ?? texts.API_ERROR);
        setSearching(false);
      }
    );
  }, []);

  function logOutHideMenu() {
    setLoggedIn(false);
  }

  const cards = results?.cards ?? [];

  return (
    <div>
      <Header
        showMenu={true}
        loggedIn={loggedIn}
        logOutHideMenu={logOutHideMenu}
      />
      <div className="content">
        <StoreSearch onSearch={(next) => run(next, 1)} searching={searching} />

        {searching && <Loader />}

        {!searching && error && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Before the first search, say what the page is for rather than
            leaving it blank. */}
        {!searching && !results && !error && (
          <Box className="storeEmpty">
            <Typography variant="body1" color="text.secondary">
              {texts.STORE_PROMPT}
            </Typography>
          </Box>
        )}

        {!searching && results && (
          <>
            <Stack
              direction="row"
              alignItems="baseline"
              spacing={1}
              sx={{ mt: 3, mb: 1 }}
            >
              <Typography variant="h6">{texts.SEARCH_RESULTS}</Typography>
              <Typography variant="body2" color="text.secondary">
                {results.numberOfCards} {texts.CARDS}
              </Typography>
            </Stack>

            {results.truncated && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {texts.SEARCH_TRUNCATED}
              </Alert>
            )}

            {!cards.length && (
              <Alert severity="info">{texts.NO_RESULTS}</Alert>
            )}

            {/* A grid rather than a list: the tiles are narrow enough that a
                full-width row would be mostly empty space, and a shopper
                comparing printings wants several in view at once. auto-fill
                means the column count follows the window instead of being
                guessed at a breakpoint. */}
            <Box className="storeResults">
              {cards.map((card) => (
                <StoreResult key={card.id} card={card} loggedIn={loggedIn} />
              ))}
            </Box>

            {results.numberOfPages > 1 && (
              <Stack alignItems="center" sx={{ mt: 3 }}>
                <Pagination
                  count={results.numberOfPages}
                  page={page}
                  onChange={(e, next) => run(criteria, next)}
                  color="primary"
                />
              </Stack>
            )}
          </>
        )}
      </div>
    </div>
  );
}
