import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./login/Login";
import Home from "./home/Home";
import Collection from "./collection/Collection";

class Router extends React.Component {
  render() {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/Collection" element={<Collection />} />
        <Route path="*" element={<Home />} />
      </Routes>
    );
  }
}

export default Router;
