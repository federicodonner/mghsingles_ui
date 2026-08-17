import React, { useState } from "react";
import { Link } from "react-router-dom";
import CardInCollection from "./CardInCollection";
import texts from "../data/texts";

export default function Collection(props) {
  const [collection, setCollection] = useState(props.collection);

  // Function called by the cardInCollection component to remove a card from the list
  function removeCard(cardId) {
    // The array is `card`, not `cards` — the old code spliced a field that does
    // not exist, so the row stayed on screen after a successful delete. Build a
    // new array rather than splicing, or React sees the same reference and
    // skips the re-render.
    setCollection((current) => ({
      ...current,
      card: (current.card ?? []).filter((card) => card.id !== cardId),
    }));
  }

  return (
    <>
      <div className="cardListContainer cardsInStock">
        <div className="title">
          {collection.name}

          <Link to={`add/${collection.id}`}>
            <button className="orange ">{texts.ADD_CARD}</button>
          </Link>
        </div>

        {collection.card &&
          collection.card.map((card, index) => {
            return (
              <CardInCollection
                card={card}
                showBorder={index !== collection.card.length - 1}
                removeCard={removeCard}
                // Keyed by id, not index: with an index key React reuses the
                // wrong row's state after a delete.
                key={card.id}
              />
            );
          })}
      </div>
    </>
  );
}
