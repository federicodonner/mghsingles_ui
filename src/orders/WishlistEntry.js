import React, { useState } from "react";
import { toast } from "../utils/toast";
import texts from "../data/texts";
import PreviewCarta from "../elementos/PreviewCarta";
import SideForm from "../elementos/SideForm";
import { accessAPI } from "../utils/fetchFunctions";
import { finishLabel, isFoil } from "../utils/finishes";
import { useExchangeRate, pesosLive } from "../utils/exchange";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

// One wishlist row. Its constraints — printings and finishes — are edited in
// a wide sidebar (the same 720px surface the storage add-card panel uses),
// because the version picker is a grid of card images that needs room, not an
// inline form. Each category is independent and multi-select: nothing ticked
// means "any". Language and condition used to be constraints too — the shop
// stopped showing them (2026-08-23), so the editor no longer offers them and
// saving clears whatever a wish still carried, or the old, invisible
// constraints would keep silently filtering matches.
export default function WishlistEntry(props) {
  const { entry, onChanged, onRemove } = props;
  const rate = useExchangeRate();

  // Only offer finishes this card exists in at all — no "foil" for a card that
  // has no foil printing. The API computes this across every printing.
  const finishOptions = entry.availableFinishes ?? [];

  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState(null); // printings, loaded lazily
  const [loadingVersions, setLoadingVersions] = useState(false);
  // Narrows the version grid by set code as you type — some cards have dozens
  // of printings and you usually know which set you are after. Display-only:
  // hidden tiles keep whatever picked state they have.
  const [setFilter, setSetFilter] = useState("");
  const [wanted, setWanted] = useState(entry.quantity ?? 1);
  const [autobuy, setAutobuy] = useState(entry.autobuy ?? false);

  // Shown immediately and written behind it. On failure the control goes back
  // to what the server still holds, rather than displaying a number that was
  // never saved.
  function changeQuantity(next) {
    const previous = wanted;
    setWanted(next);
    accessAPI(
      "PUT",
      `wishlist/${entry.id}`,
      { quantity: next },
      () => {},
      (response) => {
        setWanted(previous);
        toast(response.message);
      }
    );
  }

  // "Buy it for me automatically" — when the shop gets it in stock, it goes
  // straight into a pending order for me instead of waiting for the shop to
  // ask. Saved on the spot; reverts on failure.
  function changeAutobuy(next) {
    setAutobuy(next);
    accessAPI(
      "PUT",
      `wishlist/${entry.id}`,
      { autobuy: next },
      () => {},
      (response) => {
        setAutobuy(!next);
        toast(response.message);
      }
    );
  }

  // Local working copy so ticking boxes does not save on every click.
  const [pickedVersions, setPickedVersions] = useState(entry.versions);
  const [pickedVariants, setPickedVariants] = useState(entry.variants);

  function openEditor() {
    setOpen(true);
    // A card can have dozens of printings, so only fetch them when the editor
    // is actually opened.
    if (versions === null && !loadingVersions) {
      setLoadingVersions(true);
      accessAPI(
        "GET",
        `wishlist/${entry.id}/versions`,
        null,
        (response) => {
          setVersions(response);
          setLoadingVersions(false);
        },
        () => {
          setVersions([]);
          setLoadingVersions(false);
        }
      );
    }
  }

  // Every tick saves on the spot — there is no Save button to remember.
  // The whole constraint state travels with each change, so what is stored
  // is exactly what is on screen (and the language/condition constraints the
  // editor no longer offers are cleared along the way).
  function persist(versions, variants) {
    accessAPI(
      "PUT",
      `wishlist/${entry.id}`,
      {
        versions,
        languageids: [],
        conditionids: [],
        variants,
      },
      () => onChanged(),
      (response) => toast(response.message)
    );
  }

  const flip = (list, value) =>
    list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];

  function toggleVersion(scryfallid) {
    const next = flip(pickedVersions, scryfallid);
    setPickedVersions(next);
    persist(next, pickedVariants);
  }

  function toggleVariant(finish) {
    const next = flip(pickedVariants, finish);
    setPickedVariants(next);
    persist(pickedVersions, next);
  }

  // A one-line summary of the constraints, so the list is readable collapsed.
  function countSummary(picked) {
    return picked.length ? `${picked.length}` : texts.WISHLIST_ANY;
  }
  function variantSummary(picked) {
    if (!picked.length) return texts.WISHLIST_ANY;
    return picked.map(finishLabel).join(", ");
  }

  return (
    <div className="wishlistRow">
      <div className="wishlistHead">
        <span className="wishlistName">{entry.name}</span>

        {/* How many you want, next to the card it belongs to. Saved on change:
            it is one value with an obvious meaning, so making it wait behind
            the preferences editor's Save would be a step for nothing. */}
        <TextField
          select
          size="small"
          label={texts.WISHLIST_QUANTITY}
          value={wanted}
          onChange={(e) => changeQuantity(Number(e.target.value))}
          sx={{ width: 96 }}
        >
          {[1, 2, 3, 4].map((n) => (
            <MenuItem value={n} key={n}>
              {n}
            </MenuItem>
          ))}
        </TextField>
        {/* Buy it for me automatically when it comes in — no waiting for the
            shop to ask. */}
        <FormControlLabel
          sx={{ ml: 0 }}
          control={
            <Switch
              size="small"
              checked={autobuy}
              onChange={(e) => changeAutobuy(e.target.checked)}
            />
          }
          label={texts.WISHLIST_AUTOBUY}
        />
        <Button size="small" onClick={openEditor}>
          {texts.WISHLIST_EDIT}
        </Button>
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => onRemove(entry)}
        >
          {texts.DELETE}
        </Button>
      </div>

      <div className="constraintSummary">
        <span>
          {texts.WISHLIST_VERSIONS}: {countSummary(entry.versions)}
        </span>
        <span>
          {texts.WISHLIST_FINISHES}: {variantSummary(entry.variants)}
        </span>
      </div>

      {/* The preferences workbench: finishes first (a couple of checkboxes),
          then the version grid, which grows as long as it needs — the drawer
          itself scrolls. Every tick still saves on the spot, so closing the
          sidebar never loses anything. */}
      <SideForm
        open={open}
        onClose={() => setOpen(false)}
        title={`${texts.WISHLIST_EDIT} · ${entry.name}`}
        width={720}
      >
        <div className="wishlistEditorPanel">
          <div className="constraintHint">{texts.WISHLIST_ANY_HINT}</div>

          <div className="constraintColumn">
            <div className="constraintTitle">{texts.WISHLIST_FINISHES}</div>
            {finishOptions.map((finish) => (
              <FormControlLabel
                key={finish}
                className="constraintOption"
                control={
                  <Checkbox
                    size="small"
                    checked={pickedVariants.includes(finish)}
                    onChange={() => toggleVariant(finish)}
                  />
                }
                label={finishLabel(finish)}
              />
            ))}
            {finishOptions.length === 1 && (
              <div className="onlyFinish">
                {texts.ONLY_FINISH} {finishLabel(finishOptions[0])}
              </div>
            )}
          </div>

          <div className="constraintColumn">
            <div className="constraintTitle">{texts.WISHLIST_VERSIONS}</div>
            <TextField
              size="small"
              label={texts.WISHLIST_FILTER_SET}
              value={setFilter}
              onChange={(e) => setSetFilter(e.target.value)}
              sx={{ mb: 1.5, width: 280 }}
            />
            {loadingVersions && (
              <div className="constraintLoading">
                {texts.WISHLIST_LOADING_VERSIONS}
              </div>
            )}
            {/* Picked by eye: printings differ by art, and an etched
                printing has its own collector number and image, so it shows
                up here as its own tile. */}
            <div className="versionGrid">
              {versions &&
                versions
                  .filter(
                    (version) =>
                      !setFilter.trim() ||
                      (version.cardsetcode ?? "")
                        .toLowerCase()
                        .includes(setFilter.trim().toLowerCase())
                  )
                  .map((version) => {
                  const picked = pickedVersions.includes(version.scryfallid);
                  return (
                    <div
                      className={picked ? "versionTile picked" : "versionTile"}
                      key={version.scryfallid}
                      title={`${version.cardsetname} #${version.collectornumber}`}
                      onClick={() => toggleVersion(version.scryfallid)}
                    >
                      {version.image ? (
                        <PreviewCarta
                          image={version.image}
                          name={version.cardsetname}
                          fill
                        />
                      ) : (
                        <span className="versionNoImage">
                          {version.cardsetname}
                        </span>
                      )}
                      <span className="versionCaption">
                        {(version.cardsetcode ?? "").toUpperCase()} #
                        {version.collectornumber}
                      </span>
                      {/* What this printing costs at the shop — quoted by
                          the API with the full selling rules, so a cheap
                          rare already reads $1 here. */}
                      {pesosLive(version.price, rate) && (
                        <span className="versionPrice">
                          {pesosLive(version.price, rate)}
                        </span>
                      )}
                      {/* Flag the finishes that are unique to this printing,
                          since that is why it exists separately. */}
                      {(version.finishes ?? []).some(isFoil) &&
                        !(version.finishes ?? []).includes("nonfoil") && (
                          <span className="versionFinish">
                            {version.finishes.map(finishLabel).join(" / ")}
                          </span>
                        )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </SideForm>

    </div>
  );
}
