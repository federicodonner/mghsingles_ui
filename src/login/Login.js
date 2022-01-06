import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import Header from "../header/Header";
import texts from "../data/texts";
import whiteLoader from "../images/whiteLoader.svg";
import { storeInLS, accessAPI } from "../utils/fetchFunctions";

export default function Login() {
  const [loginLoader, setLoginLoader] = useState(false);

  // Variables used for highlighting the field if there's an error
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const loginUsername = useRef(null);
  const loginPassword = useRef(null);

  let navigate = useNavigate();

  // Function for logging in the user
  function loginUser() {
    // Verifies that the user enterd their username and password
    if (!loginUsername.current.value) {
      setUsernameError(true);
    }
    if (!loginPassword.current.value) {
      setPasswordError(true);
    }
    var enteredLoginUsername = loginUsername.current.value;
    if (!loginUsername.current.value || !loginPassword.current.value) {
      return false;
    }
    // If there is a username and a password, send it to the API
    setLoginLoader(true);
    accessAPI(
      "POST",
      "oauth",
      {
        username: loginUsername.current.value,
        password: loginPassword.current.value,
      },
      (response) => {
        // If the login is successful, store the token in LS and navigate
        storeInLS(process.env.REACT_APP_LS_LOGIN_TOKEN, response.token);
        navigate("/home");
      },
      (response) => {
        setLoginLoader(false);
        loginUsername.current.value = enteredLoginUsername;
        alert(response.message);
      }
    );
  }

  return (
    <div>
      <Header />
      <div className={loginLoader ? "loginContainer loader" : "loginContainer"}>
        {loginLoader && (
          <div className="loaderContainer">
            <img src={whiteLoader} className="loader" alt="Loading" />
          </div>
        )}
        {!loginLoader && (
          <div className="loginForm">
            <input
              type="text"
              placeholder={texts.USER_PLACEHOLDER}
              className={usernameError ? "error" : ""}
              onChange={() => {
                setUsernameError(false);
              }}
              ref={loginUsername}
            />
            <input
              type="password"
              placeholder={texts.PASSWORD_PLACEHOLDER}
              className={passwordError ? "error" : ""}
              onChange={() => {
                setPasswordError(false);
              }}
              ref={loginPassword}
            />
            <button className="dark" onClick={loginUser}>
              {texts.ENTER}
            </button>
            <div className="textButton dark">{texts.FORGOT_PASSWORD}</div>
            <div className="divider light"></div>
            <button className="light">{texts.CREATE_ACCOUNT}</button>
          </div>
        )}
      </div>
    </div>
  );
}
