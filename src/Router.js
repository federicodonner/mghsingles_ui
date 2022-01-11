import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./login/Login";
import Home from "./home/Home";
import Collection from "./collection/Collection";
import AddCard from "./collection/AddCard";
import Store from "./store/Store";

class Router extends React.Component {
  render() {
    return (
      <Routes>
        <Route path="/" element={<Store />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/Collection" element={<Collection />} />
        <Route path="/Collection/add" element={<AddCard />} />
        <Route path="*" element={<Store />} />
      </Routes>
    );
  }
}

export default Router;
