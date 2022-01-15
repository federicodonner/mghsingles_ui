import React, { useState, useEffect, useRef } from "react";
import Header from "../header/Header";
import Loader from "../loader/Loader";
import { useNavigate } from "react-router-dom";
import "./account.css";
import { accessAPI, logout } from "../utils/fetchFunctions";
import texts from "../data/texts";

export default function Account() {
  const [loader, setLoader] = useState(true);
  const [userDetails, setUserDetails] = useState(null);

  const newNameRef = useRef(null);
  const newEmailRef = useRef(null);
  const passwordRef = useRef(null);
  const newPasswordRef = useRef(null);

  const navigate = useNavigate();

  // On load, fetch user data
  useEffect(() => {
    accessAPI(
      "GET",
      "user/me",
      null,
      (response) => {
        setUserDetails(response);
        setLoader(false);
      },
      (response) => {
        // If there is a problem with the user, sign them out and navigate to login
        alert(response.message);
        logout();
        navigate("/login");
      }
    );
  }, []);

  function updateDetails() {
    console.log("details");
  }

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      <div className="content">
        {loader && <Loader />}
        {!loader && (
          <>
            <div className="moneyAndStats">Stats</div>
            <div className="editDetails">
              <div className="title">{texts.UPDATE_DETAILS}</div>
              <div className="detailFields">
                <div className="detailField">
                  <div className="label">{texts.NAME_PLACEHOLDER}</div>
                  <input
                    type="text"
                    ref={newNameRef}
                    placeholder={userDetails.name}
                  />
                </div>
                <div className="detailField">
                  <div className="label">{texts.EMAIL_PLACEHOLDER}</div>
                  <input
                    type="text"
                    ref={newEmailRef}
                    placeholder={userDetails.email}
                  />
                </div>
              </div>
              <div className="title">{texts.UPDATE_PASSWORD}</div>
              <div className="detailFields">
                <div className="detailField">
                  <div className="label">{texts.CURRENT_PASSWORD}</div>
                  <input type="password" ref={passwordRef} />
                </div>
                <div className="detailField">
                  <div className="label">{texts.NEW_PASSWORD}</div>
                  <input type="password" ref={newPasswordRef} />
                </div>
              </div>
              <button className="orange updateDetails" onClick={updateDetails}>
                {texts.ACCEPT}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
