import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Loader from "../loader/Loader";
import texts from "../data/texts";
import { accessAPI, logout } from "../utils/fetchFunctions";
import "./myStorage.css";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";

const TYPE_LABELS = {
  binder: texts.BINDER,
  sorted_box: texts.SORTED_BOX,
  unsorted_box: texts.UNSORTED_BOX,
};

const STATE_LABELS = {
  for_sale: texts.STATE_FOR_SALE,
  retired: texts.STATE_RETIRED,
  released: texts.STATE_RELEASED,
  returning: texts.STATE_RETURNING,
};

const MOVE_LABELS = {
  retired: texts.DO_RETIRE,
  returning: texts.DO_RETURN,
};

// The customer's own binders and boxes, and the two lifecycle moves that are
// theirs to make: asking for a container back, and announcing they are bringing
// one in. The shop makes the other two, because those are claims about what
// physically happened at the counter.
//
// The API returns `cando` for each container, so this never has to work out
// which move is legal from a given state — it only names the ones offered.
export default function MyStorage() {
  const [loader, setLoader] = useState(true);
  const [units, setUnits] = useState([]);

  const nameRef = useRef(null);
  const typeRef = useRef(null);

  const navigate = useNavigate();

  function load() {
    accessAPI(
      "GET",
      "mystorage",
      null,
      (response) => {
        setUnits(response);
        setLoader(false);
      },
      (response) => {
        alert(response.message);
        logout();
        navigate("/login");
      }
    );
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A container the customer makes starts in their hands, not on sale — they
  // still have to bring it in and have the shop take delivery.
  function createUnit(e) {
    e.preventDefault();
    const name = nameRef.current.value.trim();
    if (!name) return;
    accessAPI(
      "POST",
      "mystorage",
      { name, type: typeRef.current.value },
      () => {
        nameRef.current.value = "";
        load();
      },
      (response) => alert(response.message)
    );
  }

  function move(unit, to) {
    // Retiring is worth a word of warning: the cards stop selling immediately,
    // which is the point, but it is not obvious from a button.
    if (to === "retired" && !window.confirm(texts.RETIRE_EXPLAIN)) return;
    accessAPI(
      "POST",
      `mystorage/${unit.id}/state`,
      { state: to },
      (response) => {
        // Copies already promised to a buyer do not come back with the
        // container, so say so rather than letting the count look wrong.
        if (to === "retired" && response.committed > 0) {
          alert(
            texts.RETIRED_COMMITTED_1 +
              response.committed +
              texts.RETIRED_COMMITTED_2
          );
        }
        load();
      },
      (response) => alert(response.message)
    );
  }

  function rename(unit) {
    const name = window.prompt(texts.RENAME, unit.name);
    if (!name || !name.trim()) return;
    accessAPI(
      "PUT",
      `mystorage/${unit.id}`,
      { name: name.trim() },
      () => load(),
      (response) => alert(response.message)
    );
  }

  function removeUnit(unit) {
    if (!window.confirm(texts.CONFIRM_DELETE_STORAGE)) return;
    accessAPI(
      "DELETE",
      `mystorage/${unit.id}`,
      null,
      () => load(),
      (response) => alert(response.message)
    );
  }

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      {loader && <Loader color="blue" />}
      {!loader && (
        <div className="myStorageContainer">
          <form className="myStorageForm" onSubmit={createUnit}>
            <span className="formTitle">{texts.NEW_STORAGE}</span>
            <TextField type="text" placeholder={texts.STORAGE_NAME} inputRef={nameRef} />
            <TextField select SelectProps={{ native: true }} inputRef={typeRef} defaultValue="binder">
              <option value="binder">{texts.BINDER}</option>
              <option value="sorted_box">{texts.SORTED_BOX}</option>
              <option value="unsorted_box">{texts.UNSORTED_BOX}</option>
            </TextField>
            <Button type="submit">
              {texts.CREATE}
            </Button>
          </form>

          <div className="myStorageList">
            <div className="title">{texts.MY_STORAGE_TITLE}</div>
            {!units.length && (
              <div className="emptyNote">{texts.NO_STORAGE}</div>
            )}
            {units.map((unit) => (
              <div
                className={unit.forsale ? "myStorageRow" : "myStorageRow away"}
                key={unit.id}
              >
                <span className="storageName">{unit.name}</span>
                <span className="storageType">{TYPE_LABELS[unit.type]}</span>
                <span className="storageCount">
                  {unit.cardcount} {texts.CARDS}
                </span>
                <Chip
                  size="small"
                  variant={unit.forsale ? "filled" : "outlined"}
                  color={unit.forsale ? "success" : "default"}
                  label={STATE_LABELS[unit.state]}
                  className="storageBadge"
                />
                {(unit.cando || []).map((to) => (
                  <Button
 key={to}
 size="small"
 onClick={() => move(unit, to)}
                  >
                    {MOVE_LABELS[to] || to}
                  </Button>
                ))}
                {/* Renaming and deleting are edits, so they follow the same
                    rule as rearranging: only while the customer holds it. */}
                {unit.editable ? (
                  <>
                    <Button variant="outlined" size="small" onClick={() => rename(unit)}>
                      {texts.RENAME}
                    </Button>
                    <Button variant="outlined" color="error" size="small"
 onClick={() => removeUnit(unit)}
 >
                      {texts.DELETE}
                    </Button>
                  </>
                ) : (
                  <span className="lockedNote">{texts.STORAGE_LOCKED}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
