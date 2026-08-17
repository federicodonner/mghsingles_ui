import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import Loader from "../loader/Loader";
import { useNavigate } from "react-router-dom";
import texts from "../data/texts";
import { accessAPI, logout } from "../utils/fetchFunctions";
import { isFoil, finishLabel } from "../utils/finishes";
import "./orders.css";

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
        alert(response.message);
        logout();
        navigate("/login");
      }
    );
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cancelOrder(order) {
    if (!window.confirm(texts.CONFIRM_CANCEL_ORDER)) return;
    accessAPI(
      "DELETE",
      `order/${order.id}`,
      null,
      () => load(),
      (response) => alert(response.message)
    );
  }

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      {loader && <Loader color="orange" />}
      {!loader && (
        <div className="ordersContainer">
          <div className="title">{texts.MY_ORDERS}</div>
          {!orders.length && <div className="emptyState">{texts.NO_ORDERS}</div>}

          {orders.map((order) => (
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
                  <button
                    className="orange small"
                    onClick={() => cancelOrder(order)}
                  >
                    {texts.CANCEL_ORDER}
                  </button>
                )}
              </div>

              {order.note && <div className="orderNote">{order.note}</div>}

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
                    <span className="linePrice">U$S {line.price}</span>
                  </div>
                ))}
              </div>

              {order.status === "pending" && (
                <div className="pickupNote">{texts.PICKUP_NOTE}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
