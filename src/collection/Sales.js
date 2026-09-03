import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Title from "../elementos/Title";
import Loader from "../loader/Loader";
import { accessAPI, logout } from "../utils/fetchFunctions";
import { useExchangeRate, formatPesos } from "../utils/exchange";
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
  // The customer platform shows everything in pesos, sales included. Sales are
  // stored in dollars (no frozen peso snapshot), so these are converted at
  // TODAY's rate — a display convenience, not a re-statement of the debt. If
  // the shop has no rate configured we fall back to dollars so nothing hides.
  const rate = useExchangeRate();

  let navigate = useNavigate();

  useEffect(() => {
    accessAPI(
      "GET",
      "sale",
      null,
      (collection) => {
        setSales(collection.sales ?? []);
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
  // the columns always sum to the total. When a rate exists the split is done
  // in WHOLE PESOS with the same "commission first, yours is the remainder"
  // rule, so total = commission + yours holds in pesos too.
  function split(sale) {
    const total = Number(sale.price) * sale.quantity;
    const yours = Number(sale.net);
    const commission = total - yours;
    if (rate == null) return { total, commission, yours };
    const pTotal = Math.round(total * rate);
    const pCommission = Math.round(commission * rate);
    return { total: pTotal, commission: pCommission, yours: pTotal - pCommission };
  }

  // Display one figure: pesos when a rate exists, dollars as the fallback. The
  // values from split() are already in the right unit for the mode.
  const show = (value) =>
    rate == null ? money(value) : formatPesos(value);

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      <div className="content">
        {loader && <Loader />}
        {!loader && (
          <>
            {/* No paid/unpaid status here (2026-09-02): a sold card earns the
                consignor store credit at once, and that credit is tracked on
                its own in Mi Cuenta — the card's payment state is not a thing
                this list should carry. */}
            <Title
              title={texts.SOLD_CARDS}
              subtitle={sales.length ? texts.SALES_HINT : undefined}
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
                          <TableCell align="right">{show(total)}</TableCell>
                          <TableCell align="right">
                            {show(commission)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {show(yours)}
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
