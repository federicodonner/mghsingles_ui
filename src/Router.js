import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./login/Login";
import Store from "./store/Store";
import BrowseUnits from "./store/BrowseUnits";
import BrowseUnitDetail from "./store/BrowseUnitDetail";
import Cart from "./store/Cart";
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
        <Route path="/browse" element={<BrowseUnits />} />
        <Route path="/browse/:storageId" element={<BrowseUnitDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
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
