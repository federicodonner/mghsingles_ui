import "./cardInCollection.css";
export default function SoldCard(props) {
  const saleDate = new Date(props.sale.date * 1000);
  const formattedDate =
    saleDate.getDate() +
    "/" +
    saleDate.getMonth() +
    1 +
    "/" +
    saleDate.getFullYear();

  // Set the classnames depending on the props
  let containerClassNames = "cardInList";
  if (props.showBorder) {
    containerClassNames = containerClassNames + " border";
  }

  return (
    <div className={containerClassNames}>
      <div className="quantity">{props.sale.quantity}</div>
      <div className="name">{props.sale.name}</div>
      <div className="set">{props.sale.cardset.toUpperCase()}</div>
      <div className="language">{props.sale.language}</div>
      <div className="condition">{props.sale.condition}</div>
      <div className="saleDetails">
        U$S {props.sale.price * props.sale.quantity} (
        {Math.round(
          props.sale.price *
            props.sale.quantity *
            (1 - props.sale.percent) *
            100
        ) / 100}
        {" + "}
        {Math.round(
          props.sale.price * props.sale.quantity * props.sale.percent * 100
        ) / 100}
        ) {" el "}
        {formattedDate}
      </div>
    </div>
  );
}
