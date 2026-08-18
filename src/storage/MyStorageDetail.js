import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Header from "../header/Header";
import Loader from "../loader/Loader";
import texts from "../data/texts";
import { accessAPI, logout } from "../utils/fetchFunctions";
import { isFoil, finishLabel } from "../utils/finishes";
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

// What is inside one of the customer's containers.
//
// EVERY container opens, whatever state it is in — the cards are the customer's
// whether the shop is holding them or not, and being unable to look at your own
// binder because it is on a shelf would be absurd. Only editing is gated: a
// container the shop holds cannot be rearranged from here, because the cards
// are not in front of you.
export default function MyStorageDetail() {
  const { storageId } = useParams();
  const navigate = useNavigate();
  const [loader, setLoader] = useState(true);
  const [unit, setUnit] = useState(null);

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
        alert(response.message);
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

  function removePlacement(placementid) {
    accessAPI(
      "DELETE",
      `mystorage/placement/${placementid}`,
      null,
      () => load(),
      (response) => alert(response.message)
    );
  }

  // Binders come back as pages of pockets, boxes as a flat list. Flattened here
  // so one renderer covers both — the customer is reading a list of cards
  // either way, and the pocket coordinates are shown as a label rather than
  // reproduced as a grid.
  const cards = unit
    ? unit.type === "binder"
      ? (unit.pages ?? [])
          .filter(Boolean)
          .flatMap((page) =>
            page.pockets.flatMap((pocket) =>
              pocket.cards.map((card) => ({
                ...card,
                where: `${texts.PAGE} ${page.page} · ${texts.POCKET} ${pocket.pocket}`,
              }))
            )
          )
      : (unit.cards ?? []).map((card) => ({
          ...card,
          where: card.sequence ? `#${card.sequence}` : null,
        }))
    : [];

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      <div className="myStorageContainer">
        {loader && <Loader color="blue" />}
        {!loader && unit && (
          <>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: 2 }}
            >
              <Button
                component={Link}
                to="/mystorage"
                variant="outlined"
                size="small"
              >
                {texts.BACK_TO_STORAGE}
              </Button>
              <Typography variant="h6">{unit.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {TYPE_LABELS[unit.type]}
              </Typography>
              <Chip
                size="small"
                variant={unit.forsale ? "filled" : "outlined"}
                color={unit.forsale ? "success" : "default"}
                label={STATE_LABELS[unit.state]}
              />
            </Stack>

            {unit.editable && (
              <Button
                component={Link}
                to={`/mystorage/${storageId}/add`}
                sx={{ mb: 2 }}
              >
                {texts.ADD_CARD}
              </Button>
            )}

            {/* Says why the cards cannot be moved, rather than leaving the
                absence of buttons to be puzzled over. */}
            {!unit.editable && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {texts.STORAGE_LOCKED}
              </Alert>
            )}

            {!cards.length && (
              <Alert severity="info">{texts.CONTAINER_EMPTY}</Alert>
            )}

            <Stack spacing={1}>
              {cards.map((card) => (
                <Box key={card.placementid} className="containerCard">
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    {card.image && (
                      <Box
                        component="img"
                        src={card.image}
                        alt={card.name}
                        loading="lazy"
                        sx={{
                          width: 42,
                          height: 59,
                          objectFit: "cover",
                          borderRadius: 0.5,
                          flex: "0 0 auto",
                        }}
                      />
                    )}
                    <Typography sx={{ fontWeight: 600, flex: "1 1 180px" }}>
                      {card.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.cardsetname}
                    </Typography>
                    <Chip size="small" label={card.condition} />
                    <Chip size="small" variant="outlined" label={card.language} />
                    {isFoil(card.variant) && (
                      <Chip
                        size="small"
                        color="secondary"
                        label={finishLabel(card.variant)}
                      />
                    )}
                    {card.where && (
                      <Typography variant="caption" color="text.secondary">
                        {card.where}
                      </Typography>
                    )}
                    {unit.editable && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        sx={{ ml: "auto" }}
                        onClick={() => removePlacement(card.placementid)}
                      >
                        {texts.REMOVE_FROM_CONTAINER}
                      </Button>
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </>
        )}
      </div>
    </div>
  );
}
