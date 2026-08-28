import React, { useState, useEffect } from "react";
import { toast } from "../utils/toast";
import Header from "../header/Header";
import Title from "../elementos/Title";
import SideForm from "../elementos/SideForm";
import Loader from "../loader/Loader";
import { useNavigate } from "react-router-dom";
import texts from "../data/texts";
import { accessAPI, logout } from "../utils/fetchFunctions";
import WishlistEntry from "./WishlistEntry";
import "./orders.css";
import CardNameAutocomplete from "./CardNameAutocomplete";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

// Entries are card names, not printings — so one entry covers every printing
// and condition the shop might take in. Each row says what is on sale for it
// right now.
// Alphabetical, except for anything added in this sitting — those sit on top,
// newest first, so a row you just created is where you are already looking.
// `recent` is component state, so a reload settles everything into name order.
function sortForDisplay(entries, recent) {
  const rank = new Map(recent.map((id, i) => [id, i]));
  return entries.slice().sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id) : Infinity;
    const rb = rank.has(b.id) ? rank.get(b.id) : Infinity;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
}

export default function Wishlist() {
  const [loader, setLoader] = useState(true);
  const [entries, setEntries] = useState([]);
  // The chosen suggestion, not free text: the field only yields a real card
  // name, so an entry can never be for a card that does not exist.
  const [chosen, setChosen] = useState(null);
  // Entries added in this sitting, newest first.
  //
  // The API returns the list alphabetically, which is what you want for finding
  // a card — but a row you just added would drop into the middle of the list
  // and look like nothing happened. These float to the top until the page is
  // reloaded, so the thing you just did stays where you are looking.
  const [recent, setRecent] = useState([]);
  // Whether the add-to-wishlist form is slid out.
  const [adding, setAdding] = useState(false);
  // The Moxfield import: its sidebar, the pasted link, and the in-flight
  // flag that keeps the button honest while the deck downloads.
  const [importOpen, setImportOpen] = useState(false);
  const [moxUrl, setMoxUrl] = useState("");
  const [importing, setImporting] = useState(false);

  const navigate = useNavigate();

  function load() {
    accessAPI(
      "GET",
      "wishlist",
      null,
      (response) => {
        setEntries(response);
        setLoader(false);
      },
      (response) => {
        toast(response.message);
        logout();
        navigate("/login");
      }
    );
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Picking a suggestion IS adding it: the field only ever yields real card
  // names, so once one is chosen there is nothing left to confirm.
  function addEntry(name) {
    if (!name) return;
    accessAPI(
      "POST",
      "wishlist",
      { name },
      (response) => {
        setChosen(null);
        if (response?.id) setRecent((ids) => [response.id, ...ids]);
        load();
      },
      (response) => {
        setChosen(null);
        toast(response.message);
      }
    );
  }

  // Pull a public Moxfield deck and add every card it needs as a bare entry
  // (no preferences) — the API skips names already on the list and reports
  // names the catalogue does not know.
  function importMoxfield() {
    if (!moxUrl.trim() || importing) return;
    setImporting(true);
    accessAPI(
      "POST",
      "wishlist/import-moxfield",
      { url: moxUrl.trim() },
      (result) => {
        setImporting(false);
        setMoxUrl("");
        setImportOpen(false);
        let message = `${result.added}${texts.MOX_ADDED}`;
        if (result.existing > 0)
          message += ` · ${result.existing}${texts.MOX_EXISTING}`;
        if (result.notfound.length > 0)
          message += ` · ${result.notfound.length}${texts.MOX_NOTFOUND}`;
        toast(message, "success");
        load();
      },
      (response) => {
        setImporting(false);
        toast(response.message);
      },
      // Moxfield plus one insert per card takes a moment on a big deck.
      { timeout: 60000 }
    );
  }

  function removeEntry(entry) {
    accessAPI(
      "DELETE",
      `wishlist/${entry.id}`,
      null,
      () => load(),
      (response) => toast(response.message)
    );
  }

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      <div className="ordersContainer">
        <Title
          title={texts.MY_WISHLIST}
          buttons={[
            { label: texts.ADD_WISHLIST, onClick: () => setAdding(true) },
            {
              label: texts.IMPORT_MOXFIELD,
              onClick: () => setImportOpen(true),
            },
          ]}
        />

        {loader && <Loader color="orange" />}
        {!loader && !entries.length && (
          <div className="emptyState">{texts.NO_WISHLIST}</div>
        )}

        {!loader &&
          sortForDisplay(entries, recent).map((entry) => (
            <WishlistEntry
              key={entry.id}
              entry={entry}
              onChanged={load}
              onRemove={removeEntry}
            />
          ))}
      </div>

      {/* Stays open across adds — a wishlist grows a few cards at a time, and
          each new entry floats to the top of the list behind the form. */}
      <SideForm
        open={adding}
        onClose={() => setAdding(false)}
        title={texts.ADD_WISHLIST}
      >
        <CardNameAutocomplete
          value={chosen}
          onChange={(name) => {
            setChosen(name);
            addEntry(name);
          }}
        />
      </SideForm>

      <SideForm
        open={importOpen}
        onClose={() => !importing && setImportOpen(false)}
        title={texts.IMPORT_MOXFIELD}
      >
        <Stack spacing={2}>
          <TextField
            label={texts.MOXFIELD_URL}
            placeholder="https://moxfield.com/decks/..."
            value={moxUrl}
            onChange={(e) => setMoxUrl(e.target.value)}
            disabled={importing}
            fullWidth
          />
          <Button
            onClick={importMoxfield}
            disabled={importing || !moxUrl.trim()}
          >
            {importing ? texts.ADDING : texts.MOXFIELD_IMPORT}
          </Button>
          <div className="constraintHint">{texts.MOXFIELD_HINT}</div>
        </Stack>
      </SideForm>
    </div>
  );
}
