import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./sorter.css";
import Header from "../header/Header";
import Loader from "../loader/Loader";
import SorterPage from "./SorterPage";
import { accessAPI } from "../utils/fetchFunctions";
export default function Sorter() {
  const [loader, setLoader] = useState(true);
  const [collection, setCollection] = useState();

  const { collectionId } = useParams();
  useEffect(() => {
    accessAPI(
      "GET",
      `collection/${collectionId}`,
      null,
      (collection) => {
        console.log(collection);
        setCollection(collection);
        setLoader(false);
      },
      (response) => {
        console.log(response);
      }
    );
  }, [collectionId]);

  return (
    <div>
      <Header showMenu={true} loggedIn={true} />
      {loader && <Loader color="orange" />}
      {!loader && (
        <div className="sorterContainer">
          {/* {for(int i = 1; i++; i< collection.maxPage){return<div>hola</div>}}
      } */}
        </div>
      )}
    </div>
  );
}
