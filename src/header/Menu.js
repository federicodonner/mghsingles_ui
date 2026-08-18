import React, { useState, useEffect } from "react";
import "./menu.css";
import { NavLink, useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import Stack from "@mui/material/Stack";
import texts from "../data/texts";
import { logout, accessAPI } from "../utils/fetchFunctions";

// The routes in the bar, in order. Keeping them as data rather than seven
// near-identical JSX blocks is what stops one of them quietly drifting out of
// step with the others — which is how the old menu ended up with each link
// carrying its own copy of the active-class expression.
const LINKS = [
  { to: "/collection", label: texts.MY_COLLECTION },
  { to: "/orders", label: texts.ORDERS, badge: "unread" },
  { to: "/wishlist", label: texts.WISHLIST },
  { to: "/mystorage", label: texts.MY_STORAGE },
  { to: "/sales", label: texts.MY_SALES },
  { to: "/account", label: texts.MY_ACCOUNT },
];

// One shared look for every item in the bar: white text on the brand strip,
// bold when it is the page you are on.
const itemSx = {
  color: "#fff",
  fontWeight: 400,
  px: 1.5,
  minWidth: "auto",
  "&:hover": { backgroundColor: "rgba(255,255,255,0.14)" },
  "&.active": { fontWeight: 700 },
};

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
    <Stack
      direction="row"
      alignItems="center"
      className="menuContainer"
      spacing={0.5}
    >
      {props.loggedIn &&
        LINKS.map((link) => (
          <Button
            key={link.to}
            component={NavLink}
            to={link.to}
            variant="text"
            disableRipple
            sx={itemSx}
          >
            {link.badge === "unread" && unread > 0 ? (
              <Badge badgeContent={unread} color="secondary">
                <span className="label">{link.label}</span>
              </Badge>
            ) : (
              <span className="label">{link.label}</span>
            )}
          </Button>
        ))}

      {props.loggedIn ? (
        <Button
          variant="text"
          disableRipple
          className="logoutButton"
          sx={itemSx}
          onClick={() => {
            logout();
            navigate("/");
            if (props.logOutHideMenu) props.logOutHideMenu();
          }}
        >
          {texts.LOGOUT}
        </Button>
      ) : (
        <Button
          component={NavLink}
          to="/login"
          variant="text"
          disableRipple
          sx={itemSx}
        >
          {texts.LOGIN}
        </Button>
      )}
    </Stack>
  );
}
