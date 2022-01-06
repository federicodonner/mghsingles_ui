import "./App.css";
import { BrowserRouter } from "react-router-dom";
import Router from "./Router";

export default function App() {
  return (
    <div className="app">
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </div>
  );
}
