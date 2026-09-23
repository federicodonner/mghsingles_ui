import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Header from "../header/Header";
import Title from "../elementos/Title";
import Loader from "../loader/Loader";
import texts from "../data/texts";
import { accessAPI, readFromLS } from "../utils/fetchFunctions";
import "./browse.css";

const TYPE_LABELS = {
  binder: texts.BINDER,
  sorted_box: texts.SORTED_BOX,
  unsorted_box: texts.UNSORTED_BOX,
  // The shop's own; a customer never makes one, but its cards are on the
  // shelf like any other's.
  edition_box: texts.EDITION_BOX,
};

// Where each card of the fan sits, by how many the container gave us: an
// x-offset in fan-widths, a tilt, and who is in front. The API sends them
// dearest first, so index 0 is always the one on top in the middle — the card
// worth stopping for is the card you see.
const FANS = {
  1: [{ x: 0, rot: 0, z: 3 }],
  2: [
    { x: 0.14, rot: 5, z: 3 },
    { x: -0.14, rot: -5, z: 2 },
  ],
  3: [
    { x: 0, rot: 0, z: 3 },
    { x: -0.3, rot: -9, z: 2 },
    { x: 0.3, rot: 9, z: 1 },
  ],
};

// The three dearest cards in a container, spread like a hand held up.
//
// Decoration, but honest decoration: these are cards actually in this
// container and actually for sale, so the tile is a real sample of what is
// inside rather than a stock illustration.
function Fan({ cards }) {
  // Always rendered, even with nothing to show: the empty box keeps a tile
  // whose cards have no price yet lined up with the ones beside it.
  const layout = FANS[Math.min(cards.length, 3)] ?? [];
  return (
    <div className="browseFan">
      {cards.slice(0, 3).map((card, i) => (
        <img
          key={card.image}
          src={card.image}
          alt={card.name ?? ""}
          loading="lazy"
          style={{
            "--x": layout[i].x,
            "--rot": `${layout[i].rot}deg`,
            zIndex: layout[i].z,
          }}
        />
      ))}
    </div>
  );
}

// The shop's shelf, as a page: every for-sale binder and box, to be leafed
// through instead of searched. Public like the rest of the storefront —
// walking into the shop and looking at the binders never needed an account.
export default function BrowseUnits() {
  const navigate = useNavigate();
  const [loader, setLoader] = useState(true);
  const [units, setUnits] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    accessAPI(
      "GET",
      "store/units",
      null,
      (response) => {
        setUnits(response ?? []);
        setLoader(false);
      },
      (response) => {
        setError(response.message ?? texts.API_ERROR);
        setLoader(false);
      }
    );
  }, []);

  return (
    <div>
      <Header
        showMenu={true}
        loggedIn={Boolean(readFromLS(process.env.REACT_APP_LS_LOGIN_TOKEN))}
      />
      <div className="content">
        <Title
          onBack={() => navigate("/")}
          title={texts.BROWSE_UNITS}
          subtitle={texts.BROWSE_SUBTITLE}
        />

        {loader && <Loader />}
        {!loader && error && <Alert severity="info">{error}</Alert>}
        {!loader && !error && !units.length && (
          <Alert severity="info">{texts.BROWSE_EMPTY}</Alert>
        )}

        <Box className="browseUnits">
          {/* `overflow: visible` has to come through sx, not the stylesheet:
              MUI's own emotion class sets `overflow: hidden` on both Card and
              ButtonBase at the same specificity and is injected after our CSS,
              so a plain class rule loses and the fan gets sliced flat at the
              tile's edge. */}
          {units.map((unit) => (
            <Card
              variant="outlined"
              key={unit.id}
              className="browseUnitCard"
              sx={{
                overflow: "visible",
                transition:
                  "border-color 160ms ease-out, box-shadow 160ms ease-out",
                // The action area's own hover is a barely-there wash over a
                // tile that is mostly white space. The border is the edge of
                // the thing being pointed at, so that is what lights up.
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: "0 2px 12px rgba(241, 110, 49, 0.22)",
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(`/browse/${unit.id}`)}
                sx={{ p: 1.25, overflow: "visible" }}
              >
                <Fan cards={unit.topcards ?? []} />
                {/* Centred under the fan: the art is the middle of the tile,
                    and a left-aligned name hanging off it read as two
                    unrelated things sharing a box. */}
                <Stack spacing={0.75} alignItems="center" sx={{ textAlign: "center" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {unit.name}
                  </Typography>
                  {/* No card count: the fan already says "there are good
                      cards in here", which is the thing a number was standing
                      in for and never said well. */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    flexWrap="wrap"
                    useFlexGap
                    spacing={0.5}
                  >
                    <Chip size="small" label={TYPE_LABELS[unit.type]} />
                    {unit.mine && (
                      <Chip size="small" color="success" label={texts.CONTAINER_MINE} />
                    )}
                  </Stack>
                </Stack>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </div>
    </div>
  );
}
