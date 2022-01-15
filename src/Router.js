import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./login/Login";
import Collection from "./collection/Collection";
import AddCard from "./collection/AddCard";
import Store from "./store/Store";
import Sales from "./collection/Sales";
import Sell from "./sell/Sell";
import Account from "./account/Account";
import Payment from "./payment/Payment";

class Router extends React.Component {
  render() {
    return (
      <Routes>
        <Route path="/" element={<Store />} />
        <Route path="/login" element={<Login />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/collection/add" element={<AddCard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/account" element={<Account />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="*" element={<Store />} />
      </Routes>
    );
  }
}

export default Router;
