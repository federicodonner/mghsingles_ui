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
import "./orders.css";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

// A date arrives as unix seconds, not milliseconds.
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

  // Pending orders are the pick-up list; everything else is history.
  const pending = orders.filter((order) => order.status === "pending");
  const closed = orders.filter((order) => order.status !== "pending");

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
                {item.kind === "wishlist_withdrawal_ready"
                  ? texts.NOTIF_withdrawal
                  : texts.NOTIF_purchase}
                : <strong>{item.cardname}</strong>
                {item.cardsetcode && ` (${item.cardsetcode.toUpperCase()})`}
                {item.kind === "wishlist_withdrawal_ready" &&
                  ` — ${texts.NOTIF_NO_CHARGE}`}
              </span>
              <Button size="small"
                onClick={() => dismissNotification(item)}
              >
                {texts.NOTIF_DISMISS}
              </Button>
            </div>
          ))}

          <Title title={texts.TO_PICK_UP} subtitle={texts.PICKUP_EXPLAIN} />
          {!pending.length && (
            <div className="emptyState">{texts.NOTHING_TO_PICK_UP}</div>
          )}
          {pending.map((order) => (
            <div className={`orderCard ${order.status}`} key={order.id}>
              <div className="orderHeader">
                <span className={`orderStatus ${order.status}`}>
                  {texts[`ORDER_STATUS_${order.status}`] ?? order.status}
                </span>
                <span className="orderDate">{formatDate(order.created)}</span>
                {/* Only a live reservation has a deadline worth showing. */}
                {order.status === "pending" && order.expires && (
                  <span className="orderExpires">
                    {texts.ORDER_EXPIRES} {formatDate(order.expires)}
                  </span>
                )}
                <span className="orderTotal">
                  {texts.ORDER_TOTAL} U$S {order.total}
                </span>
                {order.status === "pending" && (
                  <Button variant="outlined" color="error" size="small"
 onClick={() => cancelOrder(order)}
 >
                    {texts.CANCEL_ORDER}
                  </Button>
                )}
              </div>
              <div className="orderLines">
                {order.lines.map((line) => (
                  <div className="orderLine" key={line.id}>
                    <span className="lineQuantity">{line.quantity}</span>
                    <span className="lineName">{line.name}</span>
                    <span className="lineSet">
                      {(line.cardsetcode ?? "").toUpperCase()}
                    </span>
                    <span className="lineMeta">{line.condition}</span>
                    <span className="lineMeta">{line.language}</span>
                    {isFoil(line.variant) && (
                      <span className="lineMeta">{finishLabel(line.variant)}</span>
                    )}
                    <span className="linePrice">
                      {line.kind === "withdrawal"
                        ? texts.LINE_FREE
                        : `U$S ${line.price}`}
                    </span>
                  </div>
                ))}
              </div>

              {order.status === "pending" && (
                <div className="pickupNote">
                  {/* A bag of nothing but the customer's own cards has nothing
                      to pay for, so do not tell them to pay. */}
                  {order.lines.every((line) => line.kind === "withdrawal")
                    ? texts.PICKUP_NOTE_FREE
                    : texts.PICKUP_NOTE}
                </div>
              )}
            </div>
          ))}

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
                      {texts.ORDER_TOTAL} U$S {order.total}
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
                        <span className="linePrice">
                          {line.kind === "withdrawal"
                            ? texts.LINE_FREE
                            : `U$S ${line.price}`}
                        </span>
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
