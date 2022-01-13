import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./login/Login";
import Collection from "./collection/Collection";
import AddCard from "./collection/AddCard";
import Store from "./store/Store";
import Sales from "./collection/Sales";

class Router extends React.Component {
  render() {
    return (
      <Routes>
        <Route path="/" element={<Store />} />
        <Route path="/login" element={<Login />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/collection/add" element={<AddCard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="*" element={<Store />} />
      </Routes>
    );
  }
}

export default Router;
