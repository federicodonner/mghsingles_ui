import React, { useState } from "react";
import { toast } from "../utils/toast";
import texts from "../data/texts";
import { accessAPI } from "../utils/fetchFunctions";
import { finishLabel, isFoil } from "../utils/finishes";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

// One wishlist row, with an expandable editor for its constraints: printings
// and finishes. Each category is independent and multi-select: nothing ticked
// means "any". Language and condition used to be constraints too — the shop
// stopped showing them (2026-08-23), so the editor no longer offers them and
// saving clears whatever a wish still carried, or the old, invisible
// constraints would keep silently filtering matches.
export default function WishlistEntry(props) {
  const { entry, onChanged, onRemove } = props;

  // Only offer finishes this card exists in at all — no "foil" for a card that
  // has no foil printing. The API computes this across every printing.
  const finishOptions = entry.availableFinishes ?? [];

  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState(null); // printings, loaded lazily
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wanted, setWanted] = useState(entry.quantity ?? 1);

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

  // Local working copy so ticking boxes does not save on every click.
  const [pickedVersions, setPickedVersions] = useState(entry.versions);
  const [pickedVariants, setPickedVariants] = useState(entry.variants);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    // A card can have dozens of printings, so only fetch them when the editor
    // is actually opened.
    if (next && versions === null && !loadingVersions) {
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

  function toggle(list, setList, value) {
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value]
    );
  }

  function save() {
    setSaving(true);
    accessAPI(
      "PUT",
      `wishlist/${entry.id}`,
      {
        versions: pickedVersions,
        languageids: [],
        conditionids: [],
        variants: pickedVariants,
      },
      () => {
        setSaving(false);
        setOpen(false);
        onChanged();
      },
      (response) => {
        setSaving(false);
        toast(response.message);
      }
    );
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
        <Button size="small" onClick={toggleOpen}>
          {open ? texts.WISHLIST_CLOSE : texts.WISHLIST_EDIT}
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

      {open && (
        <div className="constraintEditor">
          <div className="constraintHint">{texts.WISHLIST_ANY_HINT}</div>

          <div className="constraintColumn versions">
              <div className="constraintTitle">{texts.WISHLIST_VERSIONS}</div>
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
                  versions.map((version) => {
                    const picked = pickedVersions.includes(version.scryfallid);
                    return (
                      <div
                        className={picked ? "versionTile picked" : "versionTile"}
                        key={version.scryfallid}
                        title={`${version.cardsetname} #${version.collectornumber}`}
                        onClick={() =>
                          toggle(
                            pickedVersions,
                            setPickedVersions,
                            version.scryfallid
                          )
                        }
                      >
                        {version.image ? (
                          <img src={version.image} alt={version.cardsetname} />
                        ) : (
                          <span className="versionNoImage">
                            {version.cardsetname}
                          </span>
                        )}
                        <span className="versionCaption">
                          {(version.cardsetcode ?? "").toUpperCase()} #
                          {version.collectornumber}
                        </span>
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

          <div className="constraintColumns">
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
                      onChange={() => toggle(pickedVariants, setPickedVariants, finish)}
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
          </div>

          <Button onClick={save} disabled={saving}>
            {texts.WISHLIST_SAVE}
          </Button>
        </div>
      )}

    </div>
  );
}
