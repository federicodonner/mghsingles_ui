import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./login/Login";
import Home from "./Home";

class Router extends React.Component {
  render() {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route element={<Home />} />
      </Routes>
    );
  }
}

export default Router;
