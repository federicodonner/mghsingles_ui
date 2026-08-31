import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "../utils/toast";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Header from "../header/Header";
import Title from "../elementos/Title";
import Loader from "../loader/Loader";
import texts from "../data/texts";
import { accessAPI, readFromLS } from "../utils/fetchFunctions";
import { isFoil, finishLabel } from "../utils/finishes";
import { useExchangeRate, dualLive } from "../utils/exchange";
import "../storage/binder.css";
import "./browse.css";

const TYPE_LABELS = {
  binder: texts.BINDER,
  sorted_box: texts.SORTED_BOX,
  unsorted_box: texts.UNSORTED_BOX,
};

// One for-sale container, opened for shopping.
//
// A binder shows the same facing pages its owner sees — same grid, same
// spread arithmetic — because the point of browsing is to leaf through the
// physical object from home. Boxes are lists, exactly as they are on a table.
// Clicking a card (or a stack) opens the shopping view: price in both
// currencies, availability, and the add-to-cart button.
export default function BrowseUnitDetail() {
  const { storageId } = useParams();
  const navigate = useNavigate();
  const rate = useExchangeRate();
  const loggedIn = Boolean(readFromLS(process.env.REACT_APP_LS_LOGIN_TOKEN));
  const [loader, setLoader] = useState(true);
  const [unit, setUnit] = useState(null);
  // Which spread is open — mirrored from the binder editor: 0 is [cover, 1].
  const [spread, setSpread] = useState(0);
  // The stack of cards being looked at, or null. A pocket click passes its
  // whole stack; a box row passes a single card.
  const [viewing, setViewing] = useState(null);
  // Copies sent to the cart in this sitting, by cardid — so availability on
  // screen follows the clicks even though the cart reserves nothing.
  const [added, setAdded] = useState({});
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    accessAPI(
      "GET",
      `store/units/${storageId}`,
      null,
      (response) => {
        setUnit(response);
        setLoader(false);
      },
      (response) => {
        toast(response.message);
        navigate("/browse");
      }
    );
  }, [storageId, navigate]);

  const availableNow = useCallback(
    (card) => Math.max(0, (card.available ?? 0) - (added[card.cardid] ?? 0)),
    [added]
  );

  function addToCart(card) {
    if (!loggedIn) {
      navigate("/login");
      return;
    }
    setAdding(true);
    accessAPI(
      "POST",
      "cart",
      { cardid: card.cardid },
      (response) => {
        setAdding(false);
        setAdded((cur) => ({
          ...cur,
          [card.cardid]: (cur[card.cardid] ?? 0) + 1,
        }));
        toast(response.message, "success");
        window.dispatchEvent(new Event("cartchange"));
      },
      (response) => {
        setAdding(false);
        toast(response.message);
      }
    );
  }

  // ---- binder rendering --------------------------------------------------

  const spreadForPage = (page) => (page <= 1 ? 0 : Math.floor(page / 2));
  const pagesInSpread = (s) => (s <= 0 ? [null, 1] : [s * 2, s * 2 + 1]);

  // The API only sends pages that hold cards; the blanks in between are still
  // real paper, so they render as empty grids rather than being skipped.
  const pageAt = (page) =>
    page === null
      ? null
      : unit.pages?.find((p) => p && p.page === page) ?? {
          page,
          pockets: Array.from({ length: 9 }, (_, i) => ({
            pocket: i + 1,
            cards: [],
          })),
        };

  const lastSpread = unit ? spreadForPage(unit.maxPage ?? 1) : 0;

  function renderPocket(pocket) {
    const cards = pocket.cards ?? [];
    const top = cards[0];
    const soldOut = top && availableNow(top) === 0;
    return (
      <div
        key={pocket.pocket}
        className={`binderPocket${top ? " browsePocket" : ""}${
          soldOut ? " browseSoldOut" : ""
        }`}
        onClick={() => top && setViewing(cards)}
      >
        {!top && <span className="pocketEmpty">·</span>}
        {top && (
          <div className="binderCard">
            {top.image ? (
              <img src={top.image} alt={top.name} loading="lazy" />
            ) : (
              <div className="binderCard binderCardNoArt">{top.name}</div>
            )}
            {cards.length > 1 && (
              <span className="pocketCount">{cards.length}</span>
            )}
            {top.price != null && (
              <span className="browsePrice">
                {texts.CURRENCY} {top.price}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderBinder() {
    const visible = pagesInSpread(spread).map(pageAt);
    return (
      <div className="binderPages" style={{ alignItems: "center", display: "flex" }}>
        <IconButton
          className="pageNav"
          disabled={spread === 0}
          onClick={() => setSpread(spread - 1)}
        >
          ‹
        </IconButton>
        {visible.map((page, i) =>
          page === null ? (
            <div className="binderPage pageBlank" key={`blank-${i}`} />
          ) : (
            <div className="binderPage" key={page.page}>
              <Typography variant="caption" className="binderPageLabel">
                {texts.PAGE} {page.page}
              </Typography>
              <div className="binderGrid">
                {page.pockets.map(renderPocket)}
              </div>
            </div>
          )
        )}
        <IconButton
          className="pageNav"
          disabled={spread >= lastSpread}
          onClick={() => setSpread(spread + 1)}
        >
          ›
        </IconButton>
      </div>
    );
  }

  // ---- box rendering -----------------------------------------------------

  function renderBox() {
    // An unsorted box has no order of its own, so it reads alphabetically —
    // the same convention as the owner's view.
    const cards =
      unit.type === "unsorted_box"
        ? [...(unit.cards ?? [])].sort((a, b) =>
            (a.name ?? "").localeCompare(b.name ?? "")
          )
        : unit.cards ?? [];
    return (
      <Stack spacing={1}>
        {cards.map((card) => {
          const left = availableNow(card);
          return (
            <Stack
              key={card.placementid}
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{
                p: 1,
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                opacity: left === 0 ? 0.6 : 1,
              }}
            >
              <Box
                component="img"
                src={card.image}
                alt={card.name}
                loading="lazy"
                sx={{ width: 44, height: 61, borderRadius: 1, objectFit: "cover" }}
              />
              <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {card.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.cardsetname}
                  {card.cardsetcode && ` (${card.cardsetcode.toUpperCase()})`}
                </Typography>
              </Box>
              {isFoil(card.variant) && (
                <Chip
                  size="small"
                  color="secondary"
                  label={finishLabel(card.variant)}
                />
              )}
              {card.price != null && (
                <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {dualLive(card.price, rate)}
                </Typography>
              )}
              <Button
                size="small"
                variant="contained"
                disabled={adding || left === 0}
                onClick={() => addToCart(card)}
                sx={{ whiteSpace: "nowrap", flex: "0 0 auto" }}
              >
                {left === 0 ? texts.SOLD_OUT : texts.ADD_TO_CART}
              </Button>
            </Stack>
          );
        })}
      </Stack>
    );
  }

  // ---- shared ------------------------------------------------------------

  return (
    <div>
      <Header showMenu={true} loggedIn={loggedIn} />
      <div className="content">
        {loader && <Loader />}
        {!loader && unit && (
          <>
            <Title
              onBack={() => navigate("/browse")}
              title={unit.name}
              subtitle={`${unit.cardcount} ${texts.CARDS}`}
              tags={[TYPE_LABELS[unit.type]]}
            />

            {unit.type === "binder" ? renderBinder() : renderBox()}

            {unit.type === "binder" && unit.standby?.length > 0 && (
              <Box className="browseStandby">
                <Typography variant="subtitle2" color="text.secondary">
                  {texts.NOT_FILED_YET}
                </Typography>
                <Box className="browseStandbyCards">
                  {unit.standby.map((card) => (
                    <div
                      key={card.placementid}
                      className={`browseStandbyCard${
                        availableNow(card) === 0 ? " browseSoldOut" : ""
                      }`}
                      onClick={() => setViewing([card])}
                    >
                      <img src={card.image} alt={card.name} loading="lazy" />
                      {card.price != null && (
                        <span className="browsePrice">
                          {texts.CURRENCY} {card.price}
                        </span>
                      )}
                    </div>
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </div>

      {/* The shopping view of a pocket: every card in the stack, priced in
          both currencies, each with its own add button. */}
      <Dialog open={Boolean(viewing)} onClose={() => setViewing(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{viewing?.[0]?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {(viewing ?? []).map((card) => {
              const left = availableNow(card);
              return (
                <Stack key={card.placementid} direction="row" spacing={2}>
                  <Box
                    component="img"
                    src={card.image}
                    alt={card.name}
                    sx={{ width: 120, borderRadius: 2, alignSelf: "flex-start" }}
                  />
                  <Stack spacing={0.75} sx={{ flex: "1 1 auto" }}>
                    <Typography variant="subtitle2">{card.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {card.cardsetname}
                      {card.cardsetcode && ` (${card.cardsetcode.toUpperCase()})`}
                    </Typography>
                    {isFoil(card.variant) && (
                      <Box>
                        <Chip
                          size="small"
                          color="secondary"
                          label={finishLabel(card.variant)}
                        />
                      </Box>
                    )}
                    {card.price != null && (
                      <Typography variant="h6">
                        {dualLive(card.price, rate)}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {texts.AVAILABLE_NOW}: {left}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={adding || left === 0}
                      onClick={() => addToCart(card)}
                    >
                      {!loggedIn
                        ? texts.LOGIN_TO_ORDER
                        : left === 0
                        ? texts.SOLD_OUT
                        : texts.ADD_TO_CART}
                    </Button>
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        </DialogContent>
      </Dialog>
    </div>
  );
}
