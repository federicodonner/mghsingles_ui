import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

// A form that slides in from the right edge, instead of sitting permanently in
// the page. The page stays about its content; the form appears when asked for
// and takes the whole viewport height while it is.
//
// This only provides the surface — title bar, close affordance, consistent
// width and padding. Whatever form it is goes in as children, so every sidebar
// form in the app opens and closes the same way. `width` widens the default
// 360px surface for content that is a workbench rather than a form — the
// add-card panel's version rows carry controls that need the room.
//
// `actions` is for forms that commit explicitly (Aceptar / Cancelar): they sit
// in the title bar where the X would be, and that bar is pinned to the top of
// the drawer so it stays reachable however long the content scrolls. They
// replace the X — a form with a Cancel button should not also have a second
// way out that skips it. Clicking away or Escape still calls `onClose`, which
// such a form points at its own cancel. `notice` (an error, say) shows under
// the title bar, pinned with it, so it is seen right next to the buttons.
export default function SideForm({
  open,
  onClose,
  title,
  width = 360,
  actions = null,
  notice = null,
  children,
}) {
  return (
    // Above dialogs on purpose: changing a card's version from an open
    // pocket popup slides this in, and a form nobody can reach behind the
    // popup is a dead end. The stacking order across the app is: dialogs,
    // then this, then the card-zoom popup, then the confirm prompt.
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
    >
      <Box
        sx={{
          width: { xs: "94vw", sm: `min(${width}px, 94vw)` },
          px: 3,
          pb: 3,
          pt: actions ? 0 : 5,
        }}
      >
        <Box
          sx={
            actions
              ? {
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                  bgcolor: "background.paper",
                  pt: 5,
                  pb: 2,
                  mb: 3,
                  borderBottom: 1,
                  borderColor: "divider",
                }
              : { mb: 4 }
          }
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
            {actions ?? (
              <IconButton onClick={onClose} aria-label="close">
                <CloseIcon />
              </IconButton>
            )}
          </Stack>
          {notice && <Box sx={{ mt: 2 }}>{notice}</Box>}
        </Box>
        {children}
      </Box>
    </Drawer>
  );
}
