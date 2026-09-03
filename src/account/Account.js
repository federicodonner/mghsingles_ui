import React, { useState, useEffect } from "react";
import { toast } from "../utils/toast";
import Header from "../header/Header";
import Title from "../elementos/Title";
import Loader from "../loader/Loader";
import SideForm from "../elementos/SideForm";
import { useNavigate } from "react-router-dom";
import "./account.css";
import { accessAPI, logout } from "../utils/fetchFunctions";
import {
  useExchangeRate,
  formatPesos,
  pesosFrozenOrLive,
} from "../utils/exchange";
import texts from "../data/texts";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

// A store-credit amount (stored in dollars) shown in pesos at today's rate,
// dollars only when the shop has no rate. Same rule the admin uses.
const creditPesos = (dollars, rate) => {
  if (dollars == null) return "—";
  return rate != null
    ? formatPesos(Math.round(Number(dollars) * rate))
    : `U$S ${dollars}`;
};

function histDate(seconds) {
  const d = new Date(seconds * 1000);
  return (
    String(d.getDate()).padStart(2, "0") +
    "/" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "/" +
    d.getFullYear()
  );
}

// The customer's own account: their credit balance (with the same history the
// shop sees for them), and their details, edited through a sidebar.
export default function Account() {
  const [loader, setLoader] = useState(true);
  const [me, setMe] = useState(null);
  const [sidebar, setSidebar] = useState(null); // "history" | "details" | "password"
  const rate = useExchangeRate();
  const navigate = useNavigate();

  function load(after) {
    accessAPI(
      "GET",
      "player/me",
      null,
      (response) => {
        setMe(response);
        setLoader(false);
        if (after) after(response);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      <div className="content">
        {loader && <Loader />}
        {!loader && me && (
          <Box sx={{ maxWidth: 640, mx: "auto" }}>
            <Title title={texts.MY_ACCOUNT} />

            {/* Store credit */}
            {/* Two separate balances: money earned from selling cards (which
                can be cashed out or spent) and store credit loaded by the shop
                (spendable only). */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                gap={2}
              >
                <Stack direction="row" gap={4} flexWrap="wrap" useFlexGap>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      {texts.SALE_MONEY_LABEL}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {creditPesos(me.saleMoney, rate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {texts.SALE_MONEY_HINT}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      {texts.STORE_CREDIT_LABEL}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {creditPesos(me.storeCredit, rate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {texts.STORE_CREDIT_HINT}
                    </Typography>
                  </Box>
                </Stack>
                <Button variant="outlined" onClick={() => setSidebar("history")}>
                  {texts.VIEW_HISTORY}
                </Button>
              </Stack>
            </Paper>

            {/* Details */}
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1.5 }}
              >
                <Typography variant="h6">{texts.MY_DETAILS}</Typography>
                <Button size="small" onClick={() => setSidebar("details")}>
                  {texts.EDIT}
                </Button>
              </Stack>
              <DetailRow label={texts.NAME_PLACEHOLDER} value={me.name} />
              <DetailRow label={texts.EMAIL_PLACEHOLDER} value={me.email} />
              <DetailRow
                label={texts.PHONE_PLACEHOLDER}
                value={me.phone || texts.NOT_SET}
              />
              <Button
                size="small"
                sx={{ mt: 2 }}
                onClick={() => setSidebar("password")}
              >
                {texts.CHANGE_PASSWORD}
              </Button>
            </Paper>
          </Box>
        )}
      </div>

      <SideForm
        open={sidebar === "history"}
        onClose={() => setSidebar(null)}
        title={texts.HISTORY_TITLE}
        width={560}
      >
        {sidebar === "history" && <HistoryList rate={rate} />}
      </SideForm>

      <SideForm
        open={sidebar === "details"}
        onClose={() => setSidebar(null)}
        title={texts.MY_DETAILS}
      >
        {sidebar === "details" && me && (
          <EditDetailsForm
            me={me}
            onSaved={(updated) => {
              setMe((prev) => ({ ...prev, ...updated }));
              setSidebar(null);
              toast(texts.UPDATED_DETAILS, "success");
            }}
            onAuthFail={(msg) => {
              toast(msg);
              logout();
              navigate("/login");
            }}
          />
        )}
      </SideForm>

      <SideForm
        open={sidebar === "password"}
        onClose={() => setSidebar(null)}
        title={texts.CHANGE_PASSWORD}
      >
        {sidebar === "password" && (
          <ChangePasswordForm
            onSaved={() => {
              setSidebar(null);
              toast(texts.PASSWORD_CHANGED, "success");
            }}
            onAuthFail={(msg) => {
              toast(msg);
              logout();
              navigate("/login");
            }}
          />
        )}
      </SideForm>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      gap={2}
      sx={{ py: 0.75 }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right" }}>
        {value}
      </Typography>
    </Stack>
  );
}

// The customer's own activity, fetched from /player/me/history — the same
// events the shop sees under a customer's "Ver historial".
function HistoryList({ rate }) {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    accessAPI(
      "GET",
      "player/me/history",
      null,
      (response) => setEvents(response.events ?? []),
      () => setEvents([])
    );
  }, []);

  if (events === null) {
    return (
      <Box sx={{ textAlign: "center", py: 3 }}>
        <CircularProgress size={22} />
      </Box>
    );
  }
  if (!events.length) {
    return (
      <Typography color="text.secondary">{texts.HISTORY_EMPTY}</Typography>
    );
  }
  return (
    <Stack spacing={1.25} divider={<Divider flexItem />}>
      {events.map((e, i) => (
        <HistoryRow key={i} event={e} rate={rate} />
      ))}
    </Stack>
  );
}

function HistoryRow({ event, rate }) {
  let label;
  let color;
  let description;
  let amount;
  // For a purchase paid partly with store credit: two lines, efectivo + crédito.
  let amountLines = null;

  if (event.type === "purchase") {
    label = texts.HIST_PURCHASE;
    color = "default";
    const items = event.items ?? [];
    const shown = items
      .slice(0, 2)
      .map((it) => `${it.quantity > 1 ? `${it.quantity}× ` : ""}${it.name}`)
      .join(", ");
    const extra =
      items.length > 2 ? ` +${items.length - 2} ${texts.HIST_MORE}` : "";
    description = shown + extra;
    amount = pesosFrozenOrLive(event.total, event.totalpesos, rate);
    // Split cash vs credit when part of the bill was paid with store credit and
    // we can convert to pesos. Total is the frozen sum (or a live conversion);
    // the credit half is converted live and cash is the remainder, so the two
    // lines always add back to the total shown.
    const credit = Number(event.creditused) || 0;
    const totalPesos =
      event.totalpesos != null
        ? Number(event.totalpesos)
        : rate != null
        ? Math.round(Number(event.total) * rate)
        : null;
    if (credit > 0 && rate != null && totalPesos != null) {
      const creditP = Math.min(Math.round(credit * rate), totalPesos);
      const cashP = totalPesos - creditP;
      amountLines = [
        `${formatPesos(cashP)} ${texts.HIST_CASH}`,
        `${formatPesos(creditP)} ${texts.HIST_CREDIT_PART}`,
      ];
    }
  } else if (event.type === "sale") {
    label = texts.HIST_SALE;
    color = "success";
    description = `${event.quantity > 1 ? `${event.quantity}× ` : ""}${event.name}${
      event.cardsetcode ? ` (${event.cardsetcode.toUpperCase()})` : ""
    }`;
    amount = creditPesos(event.net, rate);
  } else if (event.type === "payment") {
    // Cash the shop paid out. (Credit spent on a purchase is not a payment
    // event here — it is the crédito line inside its own Compra.)
    label = texts.HIST_PAYOUT;
    color = "info";
    description = "";
    amount = creditPesos(event.amount, rate);
  } else {
    // credit adjustment (manual grant / deduction by the shop)
    label = texts.HIST_CREDIT;
    const value = Number(event.amount);
    color = value >= 0 ? "primary" : "warning";
    description = event.note || "";
    const sign = value >= 0 ? "+" : "−";
    amount = `${sign}${creditPesos(Math.abs(value), rate)}`;
  }

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Chip size="small" label={label} color={color} />
          <Typography variant="caption" color="text.secondary">
            {histDate(event.date)}
          </Typography>
        </Stack>
        {amountLines ? (
          <Stack alignItems="flex-end">
            {amountLines.map((line, i) => (
              <Typography
                key={i}
                variant="body2"
                sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
              >
                {line}
              </Typography>
            ))}
          </Stack>
        ) : (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
          >
            {amount}
          </Typography>
        )}
      </Stack>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

// Edit name, email and phone. Email is the login identifier, so it is editable
// here (it is the account's own owner) but flagged as such.
function EditDetailsForm({ me, onSaved, onAuthFail }) {
  const [name, setName] = useState(me.name ?? "");
  const [email, setEmail] = useState(me.email ?? "");
  const [phone, setPhone] = useState(me.phone ?? "");
  const [saving, setSaving] = useState(false);

  function save() {
    const data = {};
    if (name.trim() && name.trim() !== me.name) data.name = name.trim();
    if (email.trim() && email.trim() !== me.email) data.email = email.trim();
    // Phone always rides along so clearing it (empty string) is a real change.
    if ((phone ?? "") !== (me.phone ?? "")) data.phone = phone.trim();
    if (!Object.keys(data).length) {
      onSaved({});
      return;
    }
    setSaving(true);
    accessAPI(
      "PUT",
      "player",
      JSON.stringify(data),
      (updated) => {
        setSaving(false);
        onSaved(updated);
      },
      (response) => {
        setSaving(false);
        if (response.status === 400) {
          toast(response.message);
        } else {
          onAuthFail(response.message);
        }
      }
    );
  }

  return (
    <Stack spacing={2}>
      <TextField
        label={texts.NAME_PLACEHOLDER}
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={saving}
        fullWidth
      />
      <TextField
        label={texts.EMAIL_PLACEHOLDER}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        helperText={texts.EMAIL_IS_LOGIN}
        disabled={saving}
        fullWidth
      />
      <TextField
        label={texts.PHONE_PLACEHOLDER}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={saving}
        fullWidth
      />
      <Button variant="contained" onClick={save} disabled={saving}>
        {saving ? <CircularProgress size={22} /> : texts.SAVE}
      </Button>
    </Stack>
  );
}

function ChangePasswordForm({ onSaved, onAuthFail }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [saving, setSaving] = useState(false);

  function save() {
    if (!current || !next) return;
    setSaving(true);
    accessAPI(
      "PUT",
      "player/password",
      JSON.stringify({ password: current, newPassword: next }),
      () => {
        setSaving(false);
        onSaved();
      },
      (response) => {
        setSaving(false);
        if (response.status === 400) {
          toast(response.message);
        } else {
          onAuthFail(response.message);
        }
      }
    );
  }

  return (
    <Stack spacing={2}>
      <TextField
        label={texts.CURRENT_PASSWORD}
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        disabled={saving}
        fullWidth
      />
      <TextField
        label={texts.NEW_PASSWORD}
        type="password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        disabled={saving}
        fullWidth
      />
      <Button
        variant="contained"
        onClick={save}
        disabled={saving || !current || !next}
      >
        {saving ? <CircularProgress size={22} /> : texts.SAVE}
      </Button>
    </Stack>
  );
}
