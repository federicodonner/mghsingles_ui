import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./login/Login";
import AddCard from "./collection/AddCard";
import Store from "./store/Store";
import Sales from "./collection/Sales";
import Account from "./account/Account";
import Orders from "./orders/Orders";
import Wishlist from "./orders/Wishlist";
import MyStorage from "./storage/MyStorage";
import MyStorageDetail from "./storage/MyStorageDetail";

class Router extends React.Component {
  render() {
    return (
      <Routes>
        <Route path="/" element={<Store />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mystorage/:storageId/add" element={<AddCard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/account" element={<Account />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/mystorage" element={<MyStorage />} />
        <Route path="/mystorage/:storageId" element={<MyStorageDetail />} />
        <Route path="*" element={<Store />} />
      </Routes>
    );
  }
}

export default Router;
