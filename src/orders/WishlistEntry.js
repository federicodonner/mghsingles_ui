import React, { useState } from "react";
import texts from "../data/texts";
import { accessAPI } from "../utils/fetchFunctions";

// One wishlist row, with an expandable editor for its three constraints.
//
// Each category is independent and multi-select: nothing ticked means "any", so
// a customer can pin three acceptable printings while still taking any language,
// or accept any printing in only English or Spanish.
export default function WishlistEntry(props) {
  const { entry, conditions, languages, onChanged, onRemove } = props;

  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState(null); // printings, loaded lazily
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local working copy so ticking boxes does not save on every click.
  const [pickedVersions, setPickedVersions] = useState(entry.versions);
  const [pickedLanguages, setPickedLanguages] = useState(entry.languageids);
  const [pickedConditions, setPickedConditions] = useState(entry.conditionids);

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
        languageids: pickedLanguages,
        conditionids: pickedConditions,
      },
      () => {
        setSaving(false);
        setOpen(false);
        onChanged();
      },
      (response) => {
        setSaving(false);
        alert(response.message);
      }
    );
  }

  // A one-line summary of the constraints, so the list is readable collapsed.
  // Languages and grades are short lists, so name them; printings are not, so
  // they get a count.
  function namedSummary(picked, options) {
    if (!picked.length) return texts.WISHLIST_ANY;
    const names = picked
      .map((id) => options.find((option) => option.id === id)?.name)
      .filter(Boolean);
    return names.length ? names.join(", ") : String(picked.length);
  }
  function countSummary(picked) {
    return picked.length ? `${picked.length}` : texts.WISHLIST_ANY;
  }

  return (
    <div className="wishlistRow">
      <div className="wishlistHead">
        <span className="wishlistName">{entry.name}</span>
        <span
          className={entry.inStock.length ? "stockBadge in" : "stockBadge out"}
        >
          {entry.inStock.length ? texts.IN_STOCK_NOW : texts.NOT_IN_STOCK}
        </span>
        <button className="orange small" onClick={toggleOpen}>
          {open ? texts.WISHLIST_CLOSE : texts.WISHLIST_EDIT}
        </button>
        <button className="orange small" onClick={() => onRemove(entry)}>
          {texts.DELETE}
        </button>
      </div>

      <div className="constraintSummary">
        <span>
          {texts.WISHLIST_VERSIONS}: {countSummary(entry.versions)}
        </span>
        <span>
          {texts.WISHLIST_LANGUAGES}:{" "}
          {namedSummary(entry.languageids, languages)}
        </span>
        <span>
          {texts.WISHLIST_GRADES}:{" "}
          {namedSummary(entry.conditionids, conditions)}
        </span>
      </div>

      {open && (
        <div className="constraintEditor">
          <div className="constraintHint">{texts.WISHLIST_ANY_HINT}</div>

          <div className="constraintColumns">
            <div className="constraintColumn versions">
              <div className="constraintTitle">{texts.WISHLIST_VERSIONS}</div>
              {loadingVersions && (
                <div className="constraintLoading">
                  {texts.WISHLIST_LOADING_VERSIONS}
                </div>
              )}
              {versions &&
                versions.map((version) => (
                  <label className="constraintOption" key={version.scryfallid}>
                    <input
                      type="checkbox"
                      checked={pickedVersions.includes(version.scryfallid)}
                      onChange={() =>
                        toggle(
                          pickedVersions,
                          setPickedVersions,
                          version.scryfallid
                        )
                      }
                    />
                    <span className="versionSet">
                      {(version.cardsetcode ?? "").toUpperCase()}
                    </span>
                    <span className="versionNumber">
                      #{version.collectornumber}
                    </span>
                    <span className="versionName">{version.cardsetname}</span>
                  </label>
                ))}
            </div>

            <div className="constraintColumn">
              <div className="constraintTitle">{texts.WISHLIST_LANGUAGES}</div>
              {languages.map((language) => (
                <label className="constraintOption" key={language.id}>
                  <input
                    type="checkbox"
                    checked={pickedLanguages.includes(language.id)}
                    onChange={() =>
                      toggle(pickedLanguages, setPickedLanguages, language.id)
                    }
                  />
                  <span>{language.name}</span>
                </label>
              ))}
            </div>

            <div className="constraintColumn">
              <div className="constraintTitle">{texts.WISHLIST_GRADES}</div>
              {conditions.map((condition) => (
                <label className="constraintOption" key={condition.id}>
                  <input
                    type="checkbox"
                    checked={pickedConditions.includes(condition.id)}
                    onChange={() =>
                      toggle(pickedConditions, setPickedConditions, condition.id)
                    }
                  />
                  <span>{condition.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button className="orange" onClick={save} disabled={saving}>
            {texts.WISHLIST_SAVE}
          </button>
        </div>
      )}

      {/* What is purchasable right now and passes the filters. */}
      {entry.inStock.map((card) => (
        <div className="wishlistStock" key={card.cardid}>
          <span className="lineSet">
            {(card.cardsetcode ?? "").toUpperCase()}
          </span>
          <span className="lineMeta">{card.condition}</span>
          <span className="lineMeta">{card.language}</span>
          {card.variant === "foil" && <span className="lineMeta">foil</span>}
          <span className="lineMeta">
            {texts.AVAILABLE_NOW}: {card.available}
          </span>
          {card.price !== null && (
            <span className="linePrice">U$S {card.price}</span>
          )}
        </div>
      ))}

      {/* Distinguishes "the shop has none" from "the shop has some but they
          do not match what you asked for". */}
      {!entry.inStock.length && entry.excluded > 0 && (
        <div className="excludedNote">
          {texts.WISHLIST_EXCLUDED_1}
          {entry.excluded}
          {texts.WISHLIST_EXCLUDED_2}
        </div>
      )}
    </div>
  );
}
