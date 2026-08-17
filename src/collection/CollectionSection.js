import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./collection.css";
import Header from "../header/Header";
import Loader from "../loader/Loader";
import { accessAPI, logout } from "../utils/fetchFunctions";
import Collection from "./Collection";

export default function CollectionSection(props) {
  const [loader, setLoader] = useState(true);
  const [collections, setCollections] = useState(null);

  let navigate = useNavigate();
  // When the page loads, get the user's collection
  useEffect(() => {
    accessAPI(
      "GET",
      "collection",
      null,
      (collections) => {
        setCollections(collections);
      },
      (response) => {
        logout();
        navigate("/login");
      }
    );
  }, [navigate]);

  // When both lists are loaded, turn off the loader
  // MISSING, THE LIST IS EMPTY
  useEffect(() => {
    if (collections) {
      setLoader(false);
    }
  }, [collections]);

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      <div className="content">
        {loader && <Loader color="orange" />}
        {!loader && (
          <div className="collectionsContainer">
            {collections.map((collection, index) => {
              return <Collection collection={collection} key={index} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
