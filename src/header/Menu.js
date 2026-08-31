import React, { useState, useEffect } from "react";
import "./menu.css";
import { NavLink, useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import texts from "../data/texts";
import { logout, accessAPI, readFromLS } from "../utils/fetchFunctions";

// The routes in the bar, in order. Keeping them as data rather than seven
// near-identical JSX blocks is what stops one of them quietly drifting out of
// step with the others — which is how the old menu ended up with each link
// carrying its own copy of the active-class expression. The same list feeds
// both the desktop bar and the phone drawer, for the same reason.
const LINKS = [
  { to: "/home", label: texts.STORE },
  { to: "/cart", label: texts.CART, badge: "cart" },
  { to: "/wishlist", label: texts.WISHLIST },
  { to: "/mystorage", label: texts.MY_STORAGE },
  { to: "/orders", label: texts.ORDERS, badge: "unread" },
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

  // The single compact-layout breakpoint, shared with header.css: below it
  // the bar becomes a burger AND the header sheds the partner logo — the two
  // must flip together or the burger floats mid-header next to a logo that
  // no longer has room for it.
  const phone = useMediaQuery("(max-width:800px)");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Pages report loggedIn only after the session check answers, which left
  // the bar showing "Ingresar" for a beat on every navigation. A stored token
  // is a session until the server says otherwise (a 401 logs out and brings
  // us back here without one), so trust it optimistically.
  const loggedIn =
    props.loggedIn || Boolean(readFromLS(process.env.REACT_APP_LS_LOGIN_TOKEN));

  // Unread count for the Pedidos badge. Fetched here because the menu is on
  // every page, so the customer learns about a set-aside card wherever they are.
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!loggedIn) return;
    accessAPI(
      "GET",
      "notification",
      null,
      (response) => setUnread(response.unread ?? 0),
      () => setUnread(0)
    );
  }, [loggedIn]);

  // How many copies sit in the cart, for the Carrito badge. Add buttons all
  // over the site fire a `cartchange` event after the API answers, so the
  // number follows the clicks without any page telling the menu directly.
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    if (!loggedIn) {
      setCartCount(0);
      return;
    }
    const refresh = () =>
      accessAPI(
        "GET",
        "cart",
        null,
        (response) =>
          setCartCount(
            (response?.items ?? []).reduce((sum, i) => sum + i.quantity, 0)
          ),
        () => setCartCount(0)
      );
    refresh();
    window.addEventListener("cartchange", refresh);
    return () => window.removeEventListener("cartchange", refresh);
  }, [loggedIn]);

  function doLogout() {
    logout();
    navigate("/");
    if (props.logOutHideMenu) props.logOutHideMenu();
  }

  const badgeCounts = { unread, cart: cartCount };
  const withBadge = (link, label) =>
    link.badge && badgeCounts[link.badge] > 0 ? (
      <Badge badgeContent={badgeCounts[link.badge]} color="secondary">
        {label}
      </Badge>
    ) : (
      label
    );

  // Phones get a burger and a drawer: seven links do not fit beside a logo on
  // a 375px strip, and the wrapped three-row bar they used to form ate half
  // the screen. Signed out there is only "Ingresar", which fits as it is.
  if (phone && loggedIn) {
    return (
      <>
        <IconButton
          aria-label={texts.MENU}
          onClick={() => setDrawerOpen(true)}
          sx={{ color: "#fff", ml: "auto" }}
        >
          <Badge variant="dot" color="secondary" invisible={unread === 0}>
            <MenuIcon />
          </Badge>
        </IconButton>
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <List sx={{ width: 230, pt: 2 }}>
            {LINKS.map((link) => (
              <ListItemButton
                key={link.to}
                component={NavLink}
                to={link.to}
                onClick={() => setDrawerOpen(false)}
                sx={{ "&.active .MuiListItemText-primary": { fontWeight: 700 } }}
              >
                <ListItemText primary={withBadge(link, link.label)} />
              </ListItemButton>
            ))}
            <Divider sx={{ my: 1 }} />
            <ListItemButton onClick={doLogout}>
              <ListItemText primary={texts.LOGOUT} />
            </ListItemButton>
          </List>
        </Drawer>
      </>
    );
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      className="menuContainer"
      spacing={0.5}
    >
      {loggedIn &&
        LINKS.map((link) => (
          <Button
            key={link.to}
            component={NavLink}
            to={link.to}
            variant="text"
            disableRipple
            sx={itemSx}
          >
            {withBadge(link, <span className="label">{link.label}</span>)}
          </Button>
        ))}

      {loggedIn ? (
        <Button
          variant="text"
          disableRipple
          className="logoutButton"
          sx={itemSx}
          onClick={doLogout}
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
