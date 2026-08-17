import React, { useState, useEffect } from "react";
import "./menu.css";
import { NavLink, useNavigate } from "react-router-dom";
import texts from "../data/texts";
import { logout, accessAPI } from "../utils/fetchFunctions";

export default function Menu(props) {
  const navigate = useNavigate();

  // Unread count for the Pedidos badge. Fetched here because the menu is on
  // every page, so the customer learns about a set-aside card wherever they are.
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!props.loggedIn) return;
    accessAPI(
      "GET",
      "notification",
      null,
      (response) => setUnread(response.unread ?? 0),
      () => setUnread(0)
    );
  }, [props.loggedIn]);

  return (
    <>
      {props.loggedIn && (
        <div className="menuContainer">
          <NavLink
            to="/collection"
            className={(navData) =>
              navData.isActive ? "selectedButton menuElement" : "menuElement"
            }
          >
            <div className="label">{texts.MY_COLLECTION}</div>
          </NavLink>
          <NavLink
            to="/orders"
            className={(navData) =>
              navData.isActive ? "selectedButton menuElement" : "menuElement"
            }
          >
            <div className="label">
              {texts.ORDERS}
              {unread > 0 && <span className="menuBadge">{unread}</span>}
            </div>
          </NavLink>
          <NavLink
            to="/wishlist"
            className={(navData) =>
              navData.isActive ? "selectedButton menuElement" : "menuElement"
            }
          >
            <div className="label">{texts.WISHLIST}</div>
          </NavLink>
          <NavLink
            to="/sales"
            className={(navData) =>
              navData.isActive ? "selectedButton menuElement" : "menuElement"
            }
          >
            <div className="label">{texts.MY_SALES}</div>
          </NavLink>
          <NavLink
            to="/account"
            className={(navData) =>
              navData.isActive ? "selectedButton menuElement" : "menuElement"
            }
          >
            <div className="label">{texts.MY_ACCOUNT}</div>
          </NavLink>
          <div className="menuElement logoutButton">
            <div
              onClick={() => {
                logout();
                navigate("/");
                if (props.logOutHideMenu) {
                  props.logOutHideMenu();
                }
              }}
            >
              {texts.LOGOUT}
            </div>
          </div>
        </div>
      )}
      {!props.loggedIn && (
        <div className="menuContainer">
          <div className="separator"></div>
          <div className="separator"></div>
          <div className="separator"></div>
          <NavLink to="/login" className="menuElement">
            <div className="label">{texts.LOGIN}</div>
          </NavLink>
        </div>
      )}
    </>
  );
}
