import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Title from "../elementos/Title";
import Loader from "../loader/Loader";
import { accessAPI, logout } from "../utils/fetchFunctions";
import texts from "../data/texts";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

// Money is stored to the cent; the arithmetic below multiplies floats, and an
// unformatted product renders artifacts like 160.47000000000003. Everything
// shown passes through here.
const money = (value) => `U$S ${Number(value).toFixed(2)}`;

function formatDate(seconds) {
  const date = new Date(seconds * 1000);
  return (
    String(date.getDate()).padStart(2, "0") +
    "/" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "/" +
    date.getFullYear()
  );
}

// The customer's sales: what sold, when, and how the money splits.
//
// The commission is rounded first and the customer's share is the remainder,
// so the two always add up to the total exactly — rounding each side
// separately could disagree with the total by a cent.
export default function Sales() {
  const [loader, setLoader] = useState(true);
  const [sales, setSales] = useState([]);
  // What the store still owes across every sale — also the credit that can be
  // spent on a purchase at the counter.
  const [pending, setPending] = useState(0);

  let navigate = useNavigate();

  useEffect(() => {
    accessAPI(
      "GET",
      "sale",
      null,
      (collection) => {
        setSales(collection.sales ?? []);
        setPending(Number(collection.pending ?? 0));
        setLoader(false);
      },
      (response) => {
        logout();
        navigate("/login");
      }
    );
  }, [navigate]);

  // The API settles the money server-side (`net` is the customer's share with
  // the commission rounded first); the commission shown is the difference so
  // the columns always sum to the total.
  function split(sale) {
    const total = Number(sale.price) * sale.quantity;
    const yours = Number(sale.net);
    return { total, commission: total - yours, yours };
  }

  // Paid in full, untouched, or partially consumed as store credit.
  function statusChip(sale) {
    if (sale.paid) {
      return <Chip size="small" color="success" label={texts.SALE_PAID} />;
    }
    const partial = Number(sale.remaining) < Number(sale.net);
    return (
      <Chip
        size="small"
        color={partial ? "warning" : "default"}
        variant="outlined"
        label={partial ? texts.SALE_PARTIAL : texts.SALE_PENDING}
      />
    );
  }

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      <div className="content">
        {loader && <Loader />}
        {!loader && (
          <>
            <Title
              title={texts.SOLD_CARDS}
              subtitle={sales.length ? texts.SALES_HINT : undefined}
              tags={
                pending > 0
                  ? [
                      {
                        label: `${texts.SALES_PENDING_TOTAL} ${money(pending)}`,
                        color: "warning",
                      },
                    ]
                  : []
              }
            />

            {!sales.length && (
              <Typography color="text.secondary">{texts.NO_SALES}</Typography>
            )}
            {sales.length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 100 }}>
                        {texts.SALE_DATE}
                      </TableCell>
                      <TableCell />
                      <TableCell align="right" sx={{ width: 110 }}>
                        {texts.SALE_TOTAL}
                      </TableCell>
                      <TableCell align="right" sx={{ width: 110 }}>
                        {texts.SALE_COMMISSION}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ width: 140, whiteSpace: "nowrap" }}
                      >
                        {texts.SALE_YOURS}
                      </TableCell>
                      <TableCell align="center" sx={{ width: 110 }}>
                        {texts.SALE_STATUS}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sales.map((sale, index) => {
                      const { total, commission, yours } = split(sale);
                      return (
                        <TableRow key={index} hover>
                          <TableCell>{formatDate(sale.date)}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              {sale.image && (
                                <Box
                                  component="img"
                                  src={sale.image}
                                  alt={sale.name}
                                  loading="lazy"
                                  sx={{ width: 32, height: 45, borderRadius: 0.5 }}
                                />
                              )}
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {sale.quantity > 1 && `${sale.quantity}× `}
                                  {sale.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {sale.cardsetname}
                                </Typography>
                                {sale.foil && (
                                  <Chip
                                    size="small"
                                    color="secondary"
                                    label={texts.VARIANT_foil}
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{money(total)}</TableCell>
                          <TableCell align="right">
                            {money(commission)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {money(yours)}
                          </TableCell>
                          <TableCell align="center">
                            {statusChip(sale)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </div>
    </div>
  );
}
