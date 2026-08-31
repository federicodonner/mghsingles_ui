import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../utils/toast";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Header from "../header/Header";
import Title from "../elementos/Title";
import Loader from "../loader/Loader";
import texts from "../data/texts";
import { accessAPI, logout } from "../utils/fetchFunctions";
import { isFoil, finishLabel } from "../utils/finishes";
import { useExchangeRate, formatPesos } from "../utils/exchange";

// The cart: the pause between wanting cards and asking the shop for them.
//
// Nothing here is reserved. Confirming is the moment the shop is told to set
// the cards aside — each row becomes the same request the old instant buy
// fired per click, so everything after (the shop's queue, the notification
// when a card is bagged, the Pedidos page) behaves exactly as before.
export default function Cart() {
  const navigate = useNavigate();
  const rate = useExchangeRate();
  const [loader, setLoader] = useState(true);
  const [cart, setCart] = useState({ items: [], total: "0.00" });
  const [working, setWorking] = useState(false);
  // What the last confirmation did, shown in place: which cards the shop is
  // now setting aside, and which went out of stock and stayed in the cart.
  const [outcome, setOutcome] = useState(null);

  const load = useCallback(() => {
    accessAPI(
      "GET",
      "cart",
      null,
      (response) => {
        setCart(response ?? { items: [], total: "0.00" });
        setLoader(false);
        window.dispatchEvent(new Event("cartchange"));
      },
      (response) => {
        if (response.status === 401) {
          logout();
          navigate("/login");
        } else {
          toast(response.message);
          setLoader(false);
        }
      }
    );
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const setQuantity = (item, quantity) => {
    setWorking(true);
    accessAPI(
      "PUT",
      `cart/${item.id}`,
      { quantity },
      () => {
        setWorking(false);
        load();
      },
      (response) => {
        setWorking(false);
        toast(response.message);
      }
    );
  };

  const removeItem = (item) => {
    setWorking(true);
    accessAPI(
      "DELETE",
      `cart/${item.id}`,
      null,
      () => {
        setWorking(false);
        load();
      },
      (response) => {
        setWorking(false);
        toast(response.message);
      }
    );
  };

  const confirm = () => {
    setWorking(true);
    setOutcome(null);
    accessAPI(
      "POST",
      "cart/confirm",
      null,
      (response) => {
        setWorking(false);
        setOutcome(response);
        if (response.confirmed?.length) {
          toast(response.message, "success");
        }
        if (response.unavailable?.length) {
          toast(texts.CART_PARTIAL);
        }
        load();
      },
      (response) => {
        setWorking(false);
        toast(response.message);
      }
    );
  };

  // The peso total is the sum of each line's rounded peso price — the same
  // per-card rounding the frozen snapshot will use at bagging — rather than
  // the dollar total converted in one go, so the two never disagree.
  const totalPesos =
    rate == null
      ? null
      : cart.items.reduce(
          (sum, i) =>
            sum + Math.round(Number(i.price ?? 0) * rate) * i.quantity,
          0
        );

  const anyShort = cart.items.some((i) => i.available < i.quantity);

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      <div className="content">
        <Title onBack={() => navigate("/")} title={texts.CART} />

        {loader && <Loader />}
        {!loader && (
          <>
            {outcome?.confirmed?.length > 0 && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {outcome.message} —{" "}
                {outcome.confirmed
                  .map((c) =>
                    c.quantity > 1 ? `${c.name} ×${c.quantity}` : c.name
                  )
                  .join(", ")}
              </Alert>
            )}
            {outcome?.unavailable?.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {texts.CART_PARTIAL} —{" "}
                {outcome.unavailable.map((u) => u.name).join(", ")}
              </Alert>
            )}

            {!cart.items.length && (
              <Stack spacing={2} alignItems="flex-start">
                <Alert severity="info">{texts.CART_EMPTY_PAGE}</Alert>
                <Button variant="outlined" onClick={() => navigate("/")}>
                  {texts.GO_TO_STORE}
                </Button>
              </Stack>
            )}

            {cart.items.length > 0 && (
              <>
                <Stack spacing={1}>
                  {cart.items.map((item) => {
                    const short = item.available < item.quantity;
                    return (
                      <Stack
                        key={item.id}
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{
                          p: 1,
                          border: "1px solid #e0e0e0",
                          borderRadius: 2,
                        }}
                      >
                        <Box
                          component="img"
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          sx={{
                            width: 44,
                            height: 61,
                            borderRadius: 1,
                            objectFit: "cover",
                          }}
                        />
                        <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.cardsetname}
                            {item.cardsetcode &&
                              ` (${item.cardsetcode.toUpperCase()})`}
                          </Typography>
                          {short && (
                            <Typography
                              variant="caption"
                              color="error"
                              display="block"
                            >
                              {texts.CART_OUT_OF_STOCK} ({texts.AVAILABLE_NOW}:{" "}
                              {item.available})
                            </Typography>
                          )}
                        </Box>
                        {isFoil(item.variant) && (
                          <Chip
                            size="small"
                            color="secondary"
                            label={finishLabel(item.variant)}
                          />
                        )}
                        {/* Quantity as minus / count / plus: the same row
                            handles one copy or four without a popup. */}
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconButton
                            size="small"
                            disabled={working}
                            onClick={() => setQuantity(item, item.quantity - 1)}
                          >
                            –
                          </IconButton>
                          <Typography variant="body2" sx={{ minWidth: 18, textAlign: "center" }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            disabled={working || item.quantity >= item.available}
                            onClick={() => setQuantity(item, item.quantity + 1)}
                          >
                            +
                          </IconButton>
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
                        >
                          {/* Pesos round per copy, as the frozen snapshot
                              will, so a line never disagrees with the total
                              below by a peso. */}
                          {texts.CURRENCY}{" "}
                          {(Number(item.price ?? 0) * item.quantity).toFixed(2)}
                          {rate != null &&
                            item.price != null &&
                            ` · ${formatPesos(
                              Math.round(Number(item.price) * rate) *
                                item.quantity
                            )}`}
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          disabled={working}
                          onClick={() => removeItem(item)}
                        >
                          {texts.CART_REMOVE_ITEM}
                        </Button>
                      </Stack>
                    );
                  })}
                </Stack>

                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}
                >
                  <Typography variant="h6">
                    {texts.CART_TOTAL}: {texts.CURRENCY} {cart.total}
                    {totalPesos != null && ` · ${formatPesos(totalPesos)}`}
                  </Typography>
                  <Button
                    variant="contained"
                    disabled={working || anyShort}
                    onClick={confirm}
                  >
                    {texts.CART_CONFIRM}
                  </Button>
                </Stack>

                <Alert severity="info" sx={{ mt: 2 }}>
                  {texts.CART_HINT}
                </Alert>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
