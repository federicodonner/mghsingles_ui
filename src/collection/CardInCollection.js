import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./cardInCollection.css";
import texts from "../data/texts";
import { accessAPI } from "../utils/fetchFunctions";
import orangeLoader from "../images/orangeLoader.svg";
import foilIcon from "../images/foilIcon.svg";

export default function CardInCollection(props) {
  const [deleteLoader, setDeleteLoader] = useState(false);
  const [containerClassNames, setContainerClassNames] = useState("cardInList");

  let navigate = useNavigate();

  // On the first render, set the classnames depending on the props
  useEffect(() => {
    if (props.showBorder) {
      setContainerClassNames(containerClassNames + " border");
    }
  }, []);

  function deleteCard() {
    if (
      window.confirm(
        texts.CONFIRM_DELETE_CARD_START +
          props.card.name +
          texts.CONFIRM_DELETE_CARD_END
      )
    ) {
      setDeleteLoader(true);
      accessAPI(
        "DELETE",
        "card/" + props.card.id,
        null,
        (response) => {
          setDeleteLoader(false);
          props.removeCard(props.card.id);
        },
        (response) => {
          setDeleteLoader(false);
          alert(response.message);
          navigate("/login");
        }
      );
    }
  }

  return (
    <div className={containerClassNames}>
      <div className="quantity">{props.card.quantity}</div>
      <div className="name">
        <span>
          {props.card.name.indexOf(" // ") === -1
            ? props.card.name
            : props.card.name.split(" // ")[0]}
        </span>
        {props.card.foil == 1 && (
          <span>
            <img src={foilIcon} className="foilIcon" alt="foil" />
          </span>
        )}
      </div>
      <div className="set">{props.card.cardSet.toUpperCase()}</div>
      <div className="language">{props.card.language}</div>
      <div className="condition">{props.card.condition}</div>
      {!deleteLoader && (
        <div className="deleteButton" onClick={deleteCard}>
          {texts.DELETE}
        </div>
      )}
      {deleteLoader && (
        <div className="deleteLoaderContainer">
          <img src={orangeLoader} className="deleteLoader" alt="loader" />
        </div>
      )}
    </div>
  );
}
