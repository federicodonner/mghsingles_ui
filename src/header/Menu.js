import React from "react";
import "./menu.css";
import { NavLink, useNavigate } from "react-router-dom";
import texts from "../data/texts";
import { logout } from "../utils/fetchFunctions";

export default function Menu(props) {
  const navigate = useNavigate();

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
