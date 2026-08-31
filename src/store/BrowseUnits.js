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
};

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
          {units.map((unit) => (
            <Card variant="outlined" key={unit.id}>
              <CardActionArea
                onClick={() => navigate(`/browse/${unit.id}`)}
                sx={{ p: 2 }}
              >
                <Stack spacing={1}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {unit.name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={TYPE_LABELS[unit.type]} />
                    <Typography variant="body2" color="text.secondary">
                      {unit.cardcount} {texts.CARDS}
                    </Typography>
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
