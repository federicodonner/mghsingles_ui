import React, { useState, useEffect } from "react";
import Header from "../header/Header";
import { accessAPI } from "../utils/fetchFunctions";

export default function Store() {
  const [loggedIn, setLoggedIn] = useState(false);

  // When the component loads, verify if the user is loaded
  useEffect(() => {
    accessAPI(
      "GET",
      "user/me",
      null,
      (response) => {
        // If the response is 200, means the user is logged in
        setLoggedIn(true);
      },
      (response) => {
        // If the user is not logged in, turn off the loader
        setLoggedIn(false);
      }
    );
  }, []);

  return (
    <div>
      <Header showMenu={true} loggedIn={loggedIn} />
      Store
    </div>
  );
}
