import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./login/Login";
import CollectionSection from "./collection/CollectionSection";
import AddCard from "./collection/AddCard";
import Store from "./store/Store";
import Sales from "./collection/Sales";
import Account from "./account/Account";

class Router extends React.Component {
  render() {
    return (
      <Routes>
        <Route path="/" element={<Store />} />
        <Route path="/login" element={<Login />} />
        <Route path="/collection" element={<CollectionSection />} />
        <Route path="/collection/add/:collectionId" element={<AddCard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/account" element={<Account />} />
        <Route path="*" element={<Store />} />
      </Routes>
    );
  }
}

export default Router;
