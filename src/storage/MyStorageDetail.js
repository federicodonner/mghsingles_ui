import React, { useState, useEffect, useCallback } from "react";
import { toast } from "../utils/toast";
import { useParams, useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Header from "../header/Header";
import Title from "../elementos/Title";
import SideForm from "../elementos/SideForm";
import AddCardPanel from "../collection/AddCardPanel";
import Loader from "../loader/Loader";
import texts from "../data/texts";
import { accessAPI, logout } from "../utils/fetchFunctions";
import BinderEditor from "./BinderEditor";
import BoxEditor from "./BoxEditor";
import "./myStorage.css";

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

// One of the customer's containers, opened.
//
// EVERY container opens, whatever state it is in — the cards are the customer's
// whether the shop is holding them or not. Only editing is gated, because a
// container on the shop's shelf is not in front of you to rearrange.
//
// How it is shown depends on what it is: a binder is pages of pockets you drag
// cards around, a sorted box is a list you can reorder, an unsorted box is a
// list in alphabetical order because it has no order of its own.
export default function MyStorageDetail() {
  const { storageId } = useParams();
  const navigate = useNavigate();
  const [loader, setLoader] = useState(true);
  const [unit, setUnit] = useState(null);
  const [leaving, setLeaving] = useState(false);
  // Whether the add-a-card sidebar is slid out.
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    accessAPI(
      "GET",
      `mystorage/${storageId}`,
      null,
      (response) => {
        setUnit(response);
        setLoader(false);
      },
      (response) => {
        toast(response.message);
        if (response.status === 401) {
          logout();
          navigate("/login");
        } else {
          navigate("/mystorage");
        }
      }
    );
  }, [storageId, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  // Every mutation re-reads the container rather than patching state in place.
  // Depths, sequences and stack membership all shift when a card moves, and
  // guessing the new arrangement client-side is how a view starts disagreeing
  // with what is actually stored.
  const after = (response) => load();
  const onError = (response) => toast(response.message);

  const move = (placementid, position) =>
    accessAPI(
      "PUT",
      `mystorage/placement/${placementid}/position`,
      position,
      after,
      onError
    );

  const duplicate = (placementid) =>
    accessAPI(
      "POST",
      `mystorage/placement/${placementid}/duplicate`,
      null,
      after,
      onError
    );

  const remove = (placementid) =>
    accessAPI(
      "DELETE",
      `mystorage/placement/${placementid}`,
      null,
      after,
      onError
    );

  const reorder = (placementids) =>
    accessAPI(
      "PUT",
      `mystorage/${storageId}/order`,
      { placementids },
      after,
      onError
    );

  // While the shop holds the container the customer cannot rearrange it, but
  // the cards are still theirs: asking for one back raises a withdrawal on
  // the shop's queue, and nothing moves until somebody physically pulls it.
  const withdrawable = Boolean(unit && !unit.editable && unit.forsale);
  const requestWithdraw = (placementid) =>
    accessAPI(
      "POST",
      `mystorage/placement/${placementid}/withdraw`,
      null,
      (response) => toast(response.message, "success"),
      onError
    );

  const standbyCount = unit?.standby?.length ?? 0;

  // Leaving with cards still in stand-by throws them away — a card with nowhere
  // to live is exactly what this model does not allow. Warned about first,
  // because it is destructive and not obvious.
  function leave() {
    if (unit?.editable && standbyCount > 0) {
      setLeaving(true);
      return;
    }
    navigate("/mystorage");
  }

  function discardAndLeave() {
    accessAPI(
      "POST",
      `mystorage/${storageId}/discard-standby`,
      null,
      () => navigate("/mystorage"),
      (response) => {
        setLeaving(false);
        toast(response.message);
      }
    );
  }

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      <div className="myStorageContainer">
        {loader && <Loader color="blue" />}
        {!loader && unit && (
          <>
            <Title
              // Through leave(), not a bare navigate: the stand-by discard
              // warning has to fire from the arrow too.
              onBack={leave}
              title={unit.name}
              subtitle={`${unit.cardcount} ${texts.CARDS}`}
              tags={[
                TYPE_LABELS[unit.type],
                {
                  label: STATE_LABELS[unit.state],
                  color: unit.forsale ? "success" : undefined,
                },
              ]}
              buttons={
                unit.editable
                  ? [{ label: texts.ADD_CARD, onClick: () => setAdding(true) }]
                  : []
              }
            />

            {/* Says why the cards cannot be moved, rather than leaving the
                absent controls to be puzzled over. */}
            {!unit.editable && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {texts.STORAGE_LOCKED}
              </Alert>
            )}

            {unit.type === "binder" ? (
              <BinderEditor
                unit={unit}
                // The owner holds it: they may both rearrange and change what
                // is in it. While the shop holds it, neither — the shop does
                // the tidying then, from its own side.
                arrange={unit.editable}
                mutate={unit.editable}
                withdrawable={withdrawable}
                onMove={move}
                onDuplicate={duplicate}
                onRemove={remove}
                onWithdraw={requestWithdraw}
              />
            ) : (
              <>
                {!unit.cards?.length && (
                  <Alert severity="info">{texts.CONTAINER_EMPTY}</Alert>
                )}
                {unit.type === "unsorted_box" && unit.cards?.length > 0 && (
                  <Alert severity="info" sx={{ mb: 1.5 }}>
                    {texts.UNSORTED_HINT}
                  </Alert>
                )}
                <BoxEditor
                  unit={unit}
                  arrange={unit.editable}
                  mutate={unit.editable}
                  withdrawable={withdrawable}
                  onRemove={remove}
                  onReorder={reorder}
                  onWithdraw={requestWithdraw}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Adding stays open across adds: filling a container is a run of
          them, and every add re-reads the container so the page behind is
          already current when the sidebar closes. */}
      {unit && (
        <SideForm
          open={adding}
          onClose={() => setAdding(false)}
          title={texts.ADD_CARD}
        >
          <AddCardPanel unit={unit} onAdded={load} />
        </SideForm>
      )}

      <Dialog open={leaving} onClose={() => setLeaving(false)}>
        <DialogTitle>{texts.STANDBY_DISCARD_TITLE}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {texts.STANDBY_DISCARD_1}
            {standbyCount}
            {texts.STANDBY_DISCARD_2}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setLeaving(false)}>
            {texts.STANDBY_KEEP_EDITING}
          </Button>
          <Button color="error" onClick={discardAndLeave}>
            {texts.STANDBY_DISCARD_CONFIRM}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
