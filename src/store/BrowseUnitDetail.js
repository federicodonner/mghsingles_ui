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
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../header/Header";
import Title from "../elementos/Title";
import Loader from "../loader/Loader";
import texts from "../data/texts";
import PreviewCarta from "../elementos/PreviewCarta";
import { accessAPI, readFromLS } from "../utils/fetchFunctions";
import { isFoil, finishLabel } from "../utils/finishes";
import { useExchangeRate, pesosLive } from "../utils/exchange";
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
  // On a phone two facing pages do not fit, so the binder leafs one page at
  // a time — its own position, because a page index is finer than a spread.
  const phone = useMediaQuery("(max-width:700px)");
  const [phonePage, setPhonePage] = useState(1);
  // The stack of cards being looked at, or null. A pocket click passes its
  // whole stack; a box row passes a single card.
  const [viewing, setViewing] = useState(null);
  // Which fifty rows of a box are on screen — same page size as the owner's
  // box editor, clamped rather than reset when the list shrinks.
  const [boxPage, setBoxPage] = useState(1);
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

  // Ask for one of your OWN cards back (a withdrawal). Same endpoint as the
  // store tile; the API detects ownership and files a withdrawal, not a sale.
  const [requested, setRequested] = useState({});
  function requestReturn(card) {
    if (!loggedIn) {
      navigate("/login");
      return;
    }
    setAdding(true);
    accessAPI(
      "POST",
      "wishlist/buy",
      { cardid: card.cardid },
      (response) => {
        setAdding(false);
        setRequested((cur) => ({ ...cur, [card.placementid]: true }));
        toast(response.message, "success");
      },
      (response) => {
        setAdding(false);
        toast(response.message);
      }
    );
  }

  // The peso price text for a card. Own cards carry their price too now; the
  // "es tuya" indicator is a chip shown next to it rather than replacing it.
  const priceText = (card) => pesosLive(card.price, rate);

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
            {/* A stacked pocket shows no magnifier: only its top card is
                visible, and zooming that would suggest it is the whole
                story. Opening the pocket (the click it already invites)
                shows every card, each with its own magnifier. */}
            {top.image && cards.length === 1 ? (
              <PreviewCarta image={top.image} name={top.name} fill />
            ) : top.image ? (
              <img src={top.image} alt={top.name} loading="lazy" />
            ) : (
              <div className="binderCard binderCardNoArt">{top.name}</div>
            )}
            {cards.length > 1 && (
              <span className="pocketCount">{cards.length}</span>
            )}
            {priceText(top) && (
              <span className="browsePrice">{priceText(top)}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // One page between the arrows — the phone's whole binder view. No blank
  // "inside cover": pages run 1..maxPage and each one fills the screen.
  function renderBinderPhone() {
    const maxPage = unit.maxPage ?? 1;
    const current = pageAt(phonePage);
    return (
      <div className="binderPages" style={{ alignItems: "center", display: "flex" }}>
        <IconButton
          className="pageNav"
          disabled={phonePage <= 1}
          onClick={() => setPhonePage(phonePage - 1)}
        >
          ‹
        </IconButton>
        <div className="binderPage" key={current.page}>
          <Typography variant="caption" className="binderPageLabel">
            {texts.PAGE} {current.page}
          </Typography>
          <div className="binderGrid">{current.pockets.map(renderPocket)}</div>
        </div>
        <IconButton
          className="pageNav"
          disabled={phonePage >= maxPage}
          onClick={() => setPhonePage(phonePage + 1)}
        >
          ›
        </IconButton>
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

  // Ten rows per page, like the owner's box editor: a store box holds
  // hundreds of copies and one endless list is heavy to render and heavier
  // to scroll.
  const BOX_PAGE_SIZE = 10;

  function renderBox() {
    // An unsorted box has no order of its own, so it reads alphabetically —
    // the same convention as the owner's view.
    const cards =
      unit.type === "unsorted_box"
        ? [...(unit.cards ?? [])].sort((a, b) =>
            (a.name ?? "").localeCompare(b.name ?? "")
          )
        : unit.cards ?? [];
    const pageCount = Math.max(1, Math.ceil(cards.length / BOX_PAGE_SIZE));
    const curPage = Math.min(boxPage, pageCount);
    const visible = cards.slice(
      (curPage - 1) * BOX_PAGE_SIZE,
      curPage * BOX_PAGE_SIZE
    );
    return (
      <Stack spacing={1}>
        {visible.map((card) => {
          const left = availableNow(card);
          // The row's trailing pieces, built once and slotted into the
          // desktop row or the phone's second line — same chips, same
          // button, different homes.
          const foilChip = isFoil(card.variant) && (
            <Chip
              size="small"
              color="secondary"
              label={finishLabel(card.variant)}
            />
          );
          const priceEl = priceText(card) && (
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
            >
              {priceText(card)}
            </Typography>
          );
          const mineChip = card.mine && (
            <Chip
              size="small"
              color="success"
              variant="outlined"
              label={texts.ITS_YOURS}
              sx={{ flex: "0 0 auto" }}
            />
          );
          const actionButton = card.mine ? (
            <Button
              size="small"
              variant={requested[card.placementid] ? "outlined" : "contained"}
              disabled={adding || requested[card.placementid]}
              onClick={() => requestReturn(card)}
              sx={{ whiteSpace: "nowrap", flex: "0 0 auto" }}
            >
              {requested[card.placementid]
                ? texts.RESERVED_FOR_YOU
                : texts.REQUEST_MINE_BACK}
            </Button>
          ) : (
            <Button
              size="small"
              variant="contained"
              disabled={adding || left === 0}
              onClick={() => addToCart(card)}
              sx={{ whiteSpace: "nowrap", flex: "0 0 auto" }}
            >
              {left === 0 ? texts.SOLD_OUT : texts.ADD_TO_CART}
            </Button>
          );
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
              <PreviewCarta
                image={card.image}
                name={card.name}
                small
                sx={{ width: 44, height: 61, borderRadius: 1, objectFit: "cover" }}
              />
              <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
                {/* On a phone the set code rides inline with the name — the
                    full set name needs a width the screen does not have. */}
                <Typography variant="subtitle2" noWrap>
                  {card.name}
                  {card.cardsetcode && (
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 0.75, display: { xs: "inline", sm: "none" } }}
                    >
                      {card.cardsetcode.toUpperCase()}
                    </Typography>
                  )}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  {card.cardsetname}
                  {card.cardsetcode && ` (${card.cardsetcode.toUpperCase()})`}
                </Typography>
                {/* The phone's second line: price and tags left, the action
                    on the right edge where a thumb expects it. Wraps so a
                    crowded line (foil + price + tag) drops the button under
                    them instead of pushing it off the card. */}
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ display: { xs: "flex", sm: "none" }, mt: 0.5, rowGap: 0.5 }}
                >
                  {foilChip}
                  {priceEl}
                  {mineChip}
                  <Box sx={{ ml: "auto" }}>{actionButton}</Box>
                </Stack>
              </Box>
              {/* Desktop keeps the single-row layout. */}
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ display: { xs: "none", sm: "flex" }, flex: "0 0 auto" }}
              >
                {foilChip}
                {priceEl}
                {mineChip}
                {actionButton}
              </Stack>
            </Stack>
          );
        })}
        {pageCount > 1 && (
          <Pagination
            count={pageCount}
            page={curPage}
            onChange={(e, next) => setBoxPage(next)}
            sx={{ display: "flex", justifyContent: "center", my: 1.5 }}
          />
        )}
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
              tags={
                unit.mine
                  ? [
                      TYPE_LABELS[unit.type],
                      { label: texts.CONTAINER_MINE, color: "success" },
                    ]
                  : [TYPE_LABELS[unit.type]]
              }
            />

            {unit.type === "binder"
              ? phone
                ? renderBinderPhone()
                : renderBinder()
              : renderBox()}

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
                      <PreviewCarta image={card.image} name={card.name} fill />
                      {priceText(card) && (
                        <span className="browsePrice">{priceText(card)}</span>
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
                  <PreviewCarta
                    image={card.image}
                    name={card.name}
                    sx={{ width: 120, borderRadius: 2 }}
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
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      {priceText(card) && (
                        <Typography variant="h6">{priceText(card)}</Typography>
                      )}
                      {card.mine && (
                        <Chip
                          size="small"
                          color="success"
                          variant="outlined"
                          label={texts.ITS_YOURS}
                        />
                      )}
                    </Stack>
                    {!card.mine && (
                      <Typography variant="body2" color="text.secondary">
                        {texts.AVAILABLE_NOW}: {left}
                      </Typography>
                    )}
                    {card.mine ? (
                      <Button
                        variant={requested[card.placementid] ? "outlined" : "contained"}
                        size="small"
                        disabled={adding || requested[card.placementid]}
                        onClick={() => requestReturn(card)}
                      >
                        {!loggedIn
                          ? texts.LOGIN_TO_ORDER
                          : requested[card.placementid]
                          ? texts.RESERVED_FOR_YOU
                          : texts.REQUEST_MINE_BACK}
                      </Button>
                    ) : (
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
                    )}
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
