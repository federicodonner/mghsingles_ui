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
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import { confirmDialog } from "../utils/confirm";

// One wishlist row. Its constraints — printings, languages, grades and
// finishes — are edited in a wide sidebar (the same 720px surface the storage
// add-card panel uses), because the version picker is a grid of card images
// that needs room, not an inline form. Each category is independent and
// multi-select, and an explicit list: everything starts ticked, the section
// checkbox ticks or unticks the lot, and Aceptar refuses a category left
// empty. Nothing is saved until Aceptar.
export default function WishlistEntry(props) {
  const { entry, modifiers, onChanged, onRemove } = props;
  const languageOptions = modifiers?.languages ?? [];
  const conditionOptions = modifiers?.conditions ?? [];
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
      },
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
      },
    );
  }

  // The editor works on a DRAFT of all four categories, copied from the entry
  // when it opens and written only on Aceptar. Cancel (or clicking away)
  // throws it away. Lists are explicit: what is ticked is what is accepted.
  const [draft, setDraft] = useState(null);
  // Categories Aceptar found empty, shown as an error inside the sidebar.
  const [emptyCategories, setEmptyCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  const fromEntry = () => ({
    versions: entry.versions,
    languageids: entry.languageids,
    conditionids: entry.conditionids,
    variants: entry.variants,
  });

  function openEditor() {
    setDraft(fromEntry());
    setEmptyCategories([]);
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
        },
      );
    }
  }

  // Every option of each category, for the section checkboxes. Versions are
  // only known once the grid has loaded.
  const allOf = {
    versions: (versions ?? []).map((version) => version.scryfallid),
    languageids: languageOptions.map((option) => option.id),
    conditionids: conditionOptions.map((option) => option.id),
    variants: finishOptions,
  };
  const categoryTitle = {
    versions: texts.WISHLIST_VERSIONS,
    languageids: texts.WISHLIST_LANGUAGES,
    conditionids: texts.WISHLIST_GRADES,
    variants: texts.WISHLIST_FINISHES,
  };

  function toggle(key, value) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
    setEmptyCategories((current) => current.filter((k) => k !== key));
  }

  // The section checkbox: everything ticked -> untick everything (so the
  // customer can then pick exactly the one they want); anything less -> tick
  // everything.
  function toggleAll(key) {
    const all = allOf[key];
    setDraft((current) => ({
      ...current,
      [key]: all.every((value) => current[key].includes(value)) ? [] : all,
    }));
    setEmptyCategories((current) => current.filter((k) => k !== key));
  }

  // Aceptar: every category must keep at least one option; if one does not,
  // say which and stay open.
  function accept() {
    const empty = Object.keys(categoryTitle).filter(
      (key) => !draft[key].length,
    );
    if (empty.length) {
      setEmptyCategories(empty);
      return;
    }
    setSaving(true);
    accessAPI(
      "PUT",
      `wishlist/${entry.id}`,
      draft,
      () => {
        setSaving(false);
        setOpen(false);
        onChanged();
      },
      (response) => {
        setSaving(false);
        toast(response.message);
      },
    );
  }

  // Cancelar (and clicking away / Escape): always asks before closing without
  // saving, whether or not anything was changed.
  async function cancel() {
    const leave = await confirmDialog(texts.WISHLIST_DISCARD, {
      cancelLabel: texts.WISHLIST_DISCARD_NO,
      confirmLabel: texts.WISHLIST_DISCARD_YES,
    });
    if (!leave) return;
    setOpen(false);
  }

  // A one-line summary of the constraints, so the list is readable collapsed.
  // "Todas"/"Todos" when everything is accepted, otherwise what is.
  function versionSummary(picked) {
    const total = entry.versionCount ?? 0;
    if (total && picked.length >= total) return texts.WISHLIST_ALL_F;
    return total
      ? `${picked.length} ${texts.WISHLIST_OF} ${total}`
      : `${picked.length}`;
  }
  function variantSummary(picked) {
    if (
      finishOptions.length &&
      finishOptions.every((f) => picked.includes(f))
    ) {
      return texts.WISHLIST_ALL_F;
    }
    return picked.map(finishLabel).join(", ");
  }
  // Names in the shop's own order; an id the shop no longer has is skipped.
  function namesSummary(picked, options) {
    if (options.length && options.every((o) => picked.includes(o.id))) {
      return texts.WISHLIST_ALL_M;
    }
    const names = options
      .filter((option) => picked.includes(option.id))
      .map((option) => option.name);
    return names.length ? names.join(", ") : `${picked.length}`;
  }

  // A section title with its tick-all / untick-all checkbox.
  function sectionTitle(key) {
    const all = allOf[key];
    const picked = draft?.[key] ?? [];
    const count = all.filter((value) => picked.includes(value)).length;
    return (
      <div className="constraintTitle">
        <Checkbox
          size="small"
          sx={{ p: 0.5, mr: 0.5 }}
          checked={all.length > 0 && count === all.length}
          indeterminate={count > 0 && count < all.length}
          disabled={!all.length}
          onChange={() => toggleAll(key)}
          inputProps={{ "aria-label": texts.WISHLIST_TOGGLE_ALL }}
        />
        {categoryTitle[key]}
      </div>
    );
  }

  // A column of checkboxes for one id-based constraint (language, grade).
  function idColumn(key, options) {
    if (!options.length || !draft) return null;
    return (
      <div className="constraintColumn">
        {sectionTitle(key)}
        {options.map((option) => (
          <FormControlLabel
            key={option.id}
            className="constraintOption"
            control={
              <Checkbox
                size="small"
                checked={draft[key].includes(option.id)}
                onChange={() => toggle(key, option.id)}
              />
            }
            label={option.name}
          />
        ))}
      </div>
    );
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
          {texts.WISHLIST_VERSIONS}: {versionSummary(entry.versions)}
        </span>
        <span>
          {texts.WISHLIST_LANGUAGES}:{" "}
          {namesSummary(entry.languageids, languageOptions)}
        </span>
        <span>
          {texts.WISHLIST_GRADES}:{" "}
          {namesSummary(entry.conditionids, conditionOptions)}
        </span>
        <span>
          {texts.WISHLIST_FINISHES}: {variantSummary(entry.variants)}
        </span>
      </div>

      {/* The preferences workbench: languages, grades and finishes first
          (a few checkboxes each),
          then the version grid, which grows as long as it needs — the drawer
          itself scrolls. Edits are a draft until Aceptar, pinned at the
          top; Cancelar or clicking away discards them (after asking). */}
      <SideForm
        open={open}
        onClose={cancel}
        title={`${texts.WISHLIST_EDIT} · ${entry.name}`}
        width={720}
        notice={
          emptyCategories.length > 0 && (
            <Alert severity="error">
              {texts.WISHLIST_EMPTY_CATEGORIES}{" "}
              {emptyCategories.map((key) => categoryTitle[key]).join(", ")}
            </Alert>
          )
        }
        actions={
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button variant="outlined" onClick={cancel} disabled={saving}>
              {texts.CANCEL}
            </Button>
            <Button variant="contained" onClick={accept} disabled={saving}>
              {texts.ACCEPT}
            </Button>
          </Stack>
        }
      >
        {draft && (
          <div className="wishlistEditorPanel">
            <div className="constraintHint">{texts.WISHLIST_ANY_HINT}</div>

            {idColumn("languageids", languageOptions)}
            {idColumn("conditionids", conditionOptions)}

            <div className="constraintColumn">
              {sectionTitle("variants")}
              {finishOptions.map((finish) => (
                <FormControlLabel
                  key={finish}
                  className="constraintOption"
                  control={
                    <Checkbox
                      size="small"
                      checked={draft.variants.includes(finish)}
                      onChange={() => toggle("variants", finish)}
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
              {sectionTitle("versions")}
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
                          .includes(setFilter.trim().toLowerCase()),
                    )
                    .map((version) => {
                      const picked = draft.versions.includes(
                        version.scryfallid,
                      );
                      return (
                        <div
                          className={
                            picked ? "versionTile picked" : "versionTile"
                          }
                          key={version.scryfallid}
                          title={`${version.cardsetname} #${version.collectornumber}`}
                          onClick={() => toggle("versions", version.scryfallid)}
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
        )}
      </SideForm>
    </div>
  );
}
