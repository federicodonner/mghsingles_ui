import React, { useState, useEffect, useRef } from "react";
import { toast } from "../utils/toast";
import { confirmDialog } from "../utils/confirm";
import { useNavigate, Link } from "react-router-dom";
import Header from "../header/Header";
import Title from "../elementos/Title";
import SideForm from "../elementos/SideForm";
import Loader from "../loader/Loader";
import texts from "../data/texts";
import { accessAPI, logout } from "../utils/fetchFunctions";
import "./myStorage.css";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import TablePagination from "@mui/material/TablePagination";

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
  const [total, setTotal] = useState(0);
  // Search and paging are server-side: a collector with a hundred binders
  // should not download all of them to see the first screen.
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  // Copies that are not in any container. Contenedores is the only place a
  // customer sees their cards now, so a copy with no placement has to be shown
  // somewhere or it simply disappears.
  const [unfiled, setUnfiled] = useState([]);
  // The sidebar: null, {mode:"create"} or {mode:"rename", unit}.
  const [panel, setPanel] = useState(null);
  // Controlled rather than a ref: MUI's styled Select (no native <select>)
  // keeps its value in state, not in a DOM element.
  const [newType, setNewType] = useState("binder");

  const nameRef = useRef(null);

  const navigate = useNavigate();

  function load() {
    accessAPI(
      "GET",
      `mystorage?page=${page + 1}&limit=${limit}` +
        (q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ""),
      null,
      (response) => {
        setUnits(response.units ?? []);
        setTotal(response.total ?? 0);
        setLoader(false);
      },
      (response) => {
        toast(response.message);
        logout();
        navigate("/login");
      }
    );
  }

  // Typing searches after a pause, not per keystroke.
  useEffect(() => {
    const timer = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page, limit]);

  useEffect(() => {
    accessAPI(
      "GET",
      "mystorage/unfiled",
      null,
      (response) => setUnfiled(response ?? []),
      () => setUnfiled([])
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A container the customer makes starts in their hands, not on sale — they
  // still have to bring it in and have the shop take delivery. Straight into
  // the new container afterwards: the reason to create one is to fill it.
  function createUnit(e) {
    e.preventDefault();
    const name = nameRef.current.value.trim();
    if (!name) return;
    accessAPI(
      "POST",
      "mystorage",
      { name, type: newType },
      (response) => navigate(`/mystorage/${response.id}`),
      (response) => toast(response.message)
    );
  }

  // The rename form shares the sidebar with creation — no more browser
  // prompt() with the domain name in its title bar.
  function renameUnit(e) {
    e.preventDefault();
    const name = nameRef.current.value.trim();
    if (!name) return;
    accessAPI(
      "PUT",
      `mystorage/${panel.unit.id}`,
      { name },
      () => {
        setPanel(null);
        load();
      },
      (response) => toast(response.message)
    );
  }

  async function move(unit, to) {
    // Retiring is worth a word of warning: the cards stop selling immediately,
    // which is the point, but it is not obvious from a button.
    if (to === "retired" && !(await confirmDialog(texts.RETIRE_EXPLAIN))) return;
    accessAPI(
      "POST",
      `mystorage/${unit.id}/state`,
      { state: to },
      (response) => {
        // Copies already promised to a buyer do not come back with the
        // container, so say so rather than letting the count look wrong.
        if (to === "retired" && response.committed > 0) {
          toast(
            texts.RETIRED_COMMITTED_1 +
              response.committed +
              texts.RETIRED_COMMITTED_2
          );
        }
        load();
      },
      (response) => toast(response.message)
    );
  }

  async function removeUnit(unit) {
    if (!(await confirmDialog(texts.CONFIRM_DELETE_STORAGE))) return;
    accessAPI(
      "DELETE",
      `mystorage/${unit.id}`,
      null,
      () => load(),
      (response) => toast(response.message)
    );
  }

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      {loader && <Loader color="blue" />}
      {!loader && (
        <div className="myStorageContainer">
          <div className="myStorageList">
            <Title
              title={texts.MY_STORAGE_TITLE}
              buttons={[
                { label: texts.NEW_STORAGE, onClick: () => setPanel({ mode: "create" }) },
              ]}
            />
            <TextField
              size="small"
              placeholder={texts.STORAGE_SEARCH}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              sx={{ mb: 1, width: 320, maxWidth: "100%" }}
            />
            {!units.length && (
              <div className="emptyNote">
                {q ? texts.STORAGE_NO_MATCHES : texts.NO_STORAGE}
              </div>
            )}
            {units.map((unit) => (
              <div className="myStorageRow" key={unit.id}>
                {/* Opens whatever state it is in. The cards are the customer's
                    whether the shop is holding the container or not. */}
                <Link to={`/mystorage/${unit.id}`} className="storageName">
                  {unit.name}
                </Link>
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
                    <Button variant="outlined" size="small"
                      onClick={() => setPanel({ mode: "rename", unit })}
                    >
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
            {total > limit && (
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(e, next) => setPage(next)}
                rowsPerPage={limit}
                onRowsPerPageChange={(e) => {
                  setLimit(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[25, 50, 100]}
                labelRowsPerPage={texts.PER_PAGE}
              />
            )}
          </div>

          {/* Copies with no container. Shown rather than hidden: they are the
              customer's cards, and Contenedores is now the only place their
              cards appear at all. */}
          {unfiled.length > 0 && (
            <div className="myStorageList">
              <Title title={texts.UNFILED_TITLE} />
              <Alert severity="info" sx={{ mb: 1 }}>
                {texts.UNFILED_HINT}
              </Alert>
              {unfiled.map((row) => (
                <div className="myStorageRow" key={row.cardid}>
                  <Typography sx={{ fontWeight: 600, flex: "1 1 200px" }}>
                    {row.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {row.cardsetname}
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    <Chip size="small" label={row.condition} />
                    <Chip size="small" variant="outlined" label={row.language} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    x{row.copies}
                  </Typography>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <SideForm
        open={Boolean(panel)}
        onClose={() => setPanel(null)}
        title={panel?.mode === "rename" ? texts.RENAME : texts.NEW_STORAGE}
      >
        {panel?.mode === "create" && (
          <Stack component="form" onSubmit={createUnit} spacing={2}>
            <TextField
              label={texts.STORAGE_NAME}
              inputRef={nameRef}
              autoFocus
              fullWidth
            />
            {/* MUI's own dropdown, not the OS one: it stays inside the app's
                look and inside the panel. */}
            <TextField
              select
              label={texts.STORAGE_TYPE}
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              fullWidth
            >
              <MenuItem value="binder">{texts.BINDER}</MenuItem>
              <MenuItem value="sorted_box">{texts.SORTED_BOX}</MenuItem>
              <MenuItem value="unsorted_box">{texts.UNSORTED_BOX}</MenuItem>
            </TextField>
            <Button type="submit">{texts.CREATE}</Button>
          </Stack>
        )}
        {panel?.mode === "rename" && (
          <Stack component="form" onSubmit={renameUnit} spacing={2}>
            <TextField
              label={texts.STORAGE_NAME}
              inputRef={nameRef}
              defaultValue={panel.unit.name}
              autoFocus
              fullWidth
            />
            <Button type="submit">{texts.SAVE}</Button>
          </Stack>
        )}
      </SideForm>
    </div>
  );
}
