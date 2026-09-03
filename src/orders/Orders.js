import React, { useState, useEffect } from "react";
import { toast } from "../utils/toast";
import { confirmDialog } from "../utils/confirm";
import Header from "../header/Header";
import Title from "../elementos/Title";
import Loader from "../loader/Loader";
import { useNavigate } from "react-router-dom";
import texts from "../data/texts";
import { accessAPI, logout } from "../utils/fetchFunctions";
import { isFoil, finishLabel } from "../utils/finishes";
import { useExchangeRate, pesosFrozenOrLive } from "../utils/exchange";
import "./orders.css";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

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
      () => load(),
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
          color="error"
          size="small"
          onClick={() => cancelOrder(order)}
        >
          {texts.CANCEL_ORDER}
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

          {preparing.length > 0 && (
            <>
              <Title
                title={texts.PREPARING_TITLE}
                subtitle={texts.PREPARING_EXPLAIN}
              />
              {preparing.map(pendingCard)}
            </>
          )}

          <Title title={texts.TO_PICK_UP} subtitle={texts.PICKUP_EXPLAIN} />
          {!ready.length && (
            <div className="emptyState">{texts.NOTHING_TO_PICK_UP}</div>
          )}
          {ready.map(pendingCard)}

          {/* Closed orders are history, not something to act on. */}
          {closed.length > 0 && (
            <>
              <Box className="historyTitle">
                <Title title={texts.ORDER_HISTORY} />
              </Box>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
