import React, { useState, useEffect } from "react";
import { toast } from "../utils/toast";
import { confirmDialog } from "../utils/confirm";
import Header from "../header/Header";
import Title from "../elementos/Title";
import SideForm from "../elementos/SideForm";
import PreviewCarta from "../elementos/PreviewCarta";
import Loader from "../loader/Loader";
import { useNavigate } from "react-router-dom";
import texts from "../data/texts";
import { accessAPI, logout } from "../utils/fetchFunctions";
import { isFoil, finishLabel } from "../utils/finishes";
import { useExchangeRate, pesosFrozenOrLive } from "../utils/exchange";
import "./orders.css";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

// A date arrives as unix seconds, not milliseconds.
// The dollar price with its frozen peso twin, when the line has one. Both
// come off the order line — snapshots from the day the copy was bagged —
// never from the card's live price.
function lineAmount(line, rate) {
  if (line.kind === "withdrawal") return texts.LINE_FREE;
  return pesosFrozenOrLive(line.price, line.pricepesos, rate);
}

function formatDate(seconds) {
  if (!seconds) return "";
  const date = new Date(seconds * 1000);
  return (
    String(date.getDate()).padStart(2, "0") +
    "/" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "/" +
    date.getFullYear()
  );
}

export default function Orders() {
  const [loader, setLoader] = useState(true);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  // Orders show their FROZEN peso amount when they have one; older orders are
  // converted at today's rate so everything reads in pesos.
  const rate = useExchangeRate();

  const navigate = useNavigate();

  function load() {
    accessAPI(
      "GET",
      "order",
      null,
      (response) => {
        setOrders(response);
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
    accessAPI(
      "GET",
      "notification",
      null,
      (response) => {
        setNotifications(response.items ?? []);
        // Opening this page IS reading them: everything they announce is on
        // the screen underneath.
        if (response.unread > 0) accessAPI("POST", "notification/read", null, () => {}, () => {});
      },
      () => setNotifications([])
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismissNotification(item) {
    accessAPI(
      "DELETE",
      `notification/${item.id}`,
      null,
      () => setNotifications((list) => list.filter((n) => n.id !== item.id)),
      (response) => toast(response.message)
    );
  }

  async function cancelOrder(order) {
    if (!(await confirmDialog(texts.CONFIRM_CANCEL_ORDER))) return;
    accessAPI(
      "DELETE",
      `order/${order.id}`,
      null,
      () => {
        setEditingId(null);
        load();
      },
      (response) => toast(response.message)
    );
  }

  // The order being edited in the sidebar — derived from the list, so every
  // reload refreshes its lines, and it closes itself when the order stops
  // being pending (cancelled here, or completed under our feet).
  const [editingId, setEditingId] = useState(null);
  const editingOrder =
    orders.find((o) => o.id === editingId && o.status === "pending") ?? null;

  // Take ONE copy off the order. Only the removal that would cancel the whole
  // order asks first — that is the moment this stops being an edit.
  async function removeLine(order, line) {
    const lastCopy = order.lines.length === 1 && line.quantity === 1;
    if (lastCopy && !(await confirmDialog(texts.CONFIRM_CANCEL_ORDER))) return;
    accessAPI(
      "DELETE",
      `order/${order.id}/line/${line.id}`,
      null,
      (response) => {
        if (response.ordercancelled) setEditingId(null);
        toast(response.message, "success");
        load();
      },
      (response) => toast(response.message)
    );
  }

  // Pending orders split into what the shop is still assembling and what is
  // ready to pick up; everything else is history.
  const pending = orders.filter((order) => order.status === "pending");
  const preparing = pending.filter((order) => order.preparing);
  const ready = pending.filter((order) => !order.preparing);
  const closed = orders.filter((order) => order.status !== "pending");

  // One pending-order card, shared by both sections. A preparing order shows a
  // "being prepared" status and note instead of the pick-up note.
  const pendingCard = (order) => (
    <div className={`orderCard ${order.status}`} key={order.id}>
      <div className="orderHeader">
        <span
          className={`orderStatus ${order.preparing ? "preparing" : order.status}`}
        >
          {order.preparing
            ? texts.ORDER_STATUS_preparing
            : texts[`ORDER_STATUS_${order.status}`] ?? order.status}
        </span>
        <span className="orderDate">{formatDate(order.created)}</span>
        {order.expires && (
          <span className="orderExpires">
            {texts.ORDER_EXPIRES} {formatDate(order.expires)}
          </span>
        )}
        <span className="orderTotal">
          {texts.ORDER_TOTAL}{" "}
          {pesosFrozenOrLive(order.total, order.totalpesos, rate)}
        </span>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setEditingId(order.id)}
        >
          {texts.EDIT_ORDER}
        </Button>
      </div>
      <div className="orderLines">
        {order.lines.map((line) => (
          <div className="orderLine" key={line.id}>
            <span className="lineQuantity">{line.quantity}</span>
            <span className="lineName">{line.name}</span>
            <span className="lineSet">
              {(line.cardsetcode ?? "").toUpperCase()}
            </span>
            {isFoil(line.variant) && (
              <span className="lineMeta">{finishLabel(line.variant)}</span>
            )}
            <span className="linePrice">{lineAmount(line, rate)}</span>
          </div>
        ))}
      </div>
      <div className="pickupNote">
        {order.preparing
          ? texts.PREPARING_NOTE
          : order.lines.every((line) => line.kind === "withdrawal")
          ? texts.PICKUP_NOTE_FREE
          : texts.PICKUP_NOTE}
      </div>
    </div>
  );

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      {loader && <Loader color="orange" />}
      {!loader && (
        <div className="ordersContainer">
          {/* Anything the shop set aside is announced here, because the
              customer has no other way to find out. */}
          {notifications.map((item) => (
            <div className="notice" key={item.id}>
              <span className="noticeText">
                {item.kind === "order_ready" ? (
                  texts.NOTIF_order_ready
                ) : (
                  <>
                    {item.kind === "wishlist_withdrawal_ready"
                      ? texts.NOTIF_withdrawal
                      : texts.NOTIF_purchase}
                    : <strong>{item.cardname}</strong>
                    {item.cardsetcode && ` (${item.cardsetcode.toUpperCase()})`}
                    {item.kind === "wishlist_withdrawal_ready" &&
                      ` — ${texts.NOTIF_NO_CHARGE}`}
                  </>
                )}
              </span>
              <Button size="small"
                onClick={() => dismissNotification(item)}
              >
                {texts.NOTIF_DISMISS}
              </Button>
            </div>
          ))}

          {/* Each state is its own panel with a divider between, so the three
              read as distinct stages, not one long list. */}
          {preparing.length > 0 && (
            <section className="ordersSection">
              <Title
                title={texts.PREPARING_TITLE}
                subtitle={texts.PREPARING_EXPLAIN}
              />
              {preparing.map(pendingCard)}
            </section>
          )}

          <section className="ordersSection">
            <Title title={texts.TO_PICK_UP} subtitle={texts.PICKUP_EXPLAIN} />
            {!ready.length && (
              <div className="emptyState">{texts.NOTHING_TO_PICK_UP}</div>
            )}
            {ready.map(pendingCard)}
          </section>

          {/* Closed orders are history, not something to act on. */}
          {closed.length > 0 && (
            <section className="ordersSection">
              <Title title={texts.ORDER_HISTORY} />
              {closed.map((order) => (
                <div className={`orderCard ${order.status}`} key={order.id}>
                  <div className="orderHeader">
                    <span className={`orderStatus ${order.status}`}>
                      {texts[`ORDER_STATUS_${order.status}`] ?? order.status}
                    </span>
                    <span className="orderDate">{formatDate(order.created)}</span>
                    <span className="orderTotal">
                      {texts.ORDER_TOTAL}{" "}
                      {pesosFrozenOrLive(order.total, order.totalpesos, rate)}
                    </span>
                  </div>
                  <div className="orderLines">
                    {order.lines.map((line) => (
                      <div className="orderLine" key={line.id}>
                        <span className="lineQuantity">{line.quantity}</span>
                        <span className="lineName">{line.name}</span>
                        <span className="lineSet">
                          {(line.cardsetcode ?? "").toUpperCase()}
                        </span>
                        <span className="linePrice">{lineAmount(line, rate)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      {/* Editing a pending order: one row per card with its own "quitar".
          Emptying the order cancels it — said in the hint, and confirmed on
          the removal that would do it. */}
      <SideForm
        open={Boolean(editingOrder)}
        onClose={() => setEditingId(null)}
        title={texts.EDIT_ORDER_TITLE}
        width={480}
      >
        {editingOrder && (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              {texts.EDIT_ORDER_HINT}
            </Typography>
            {editingOrder.lines.map((line) => (
              <Stack
                key={line.id}
                direction="row"
                spacing={1.5}
                alignItems="center"
              >
                <PreviewCarta
                  image={line.image}
                  name={line.name}
                  small
                  sx={{ width: 40, height: 56, borderRadius: 0.5 }}
                />
                <Typography sx={{ flex: 1, fontWeight: 600, minWidth: 0 }}>
                  {line.quantity > 1 && `${line.quantity} × `}
                  {line.name}
                </Typography>
                {isFoil(line.variant) && (
                  <Chip
                    size="small"
                    color="secondary"
                    label={finishLabel(line.variant)}
                  />
                )}
                <Typography variant="caption" color="text.secondary">
                  {(line.cardsetcode ?? "").toUpperCase()}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                  {lineAmount(line, rate)}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => removeLine(editingOrder, line)}
                >
                  {texts.REMOVE_FROM_ORDER}
                </Button>
              </Stack>
            ))}
            <Typography variant="subtitle2" sx={{ textAlign: "right" }}>
              {texts.ORDER_TOTAL}{" "}
              {pesosFrozenOrLive(editingOrder.total, editingOrder.totalpesos, rate)}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={() => cancelOrder(editingOrder)}
            >
              {texts.CANCEL_ORDER_FULL}
            </Button>
          </Stack>
        )}
      </SideForm>
    </div>
  );
}
