import "./cardInCollection.css";
import texts from "../data/texts";
export default function CardInCollection(props) {
  // Set the classnames depending on the props
  let containerClassNames = "cardInList";
  if (props.showBorder) {
    containerClassNames = containerClassNames + " border";
  }

  return (
    <div className={containerClassNames}>
      <div className="quantity">{props.card.quantity}</div>
      <div className="name">{props.card.name}</div>
      <div className="set">{props.card.cardSet.toUpperCase()}</div>
      <div className="language">{props.card.language}</div>
      <div className="condition">{props.card.condition}</div>
      <div className="deleteButton">{texts.DELETE}</div>
    </div>
  );
}
