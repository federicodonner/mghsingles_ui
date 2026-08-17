import "./cardInCollection.css";
export default function SoldCard(props) {
  const saleDate = new Date(props.sale.date * 1000);
  // getMonth() is zero-based. The +1 must be parenthesised: inside a string
  // concatenation chain it otherwise appends "1" rather than adding, which
  // rendered July as month 71.
  const formattedDate =
    String(saleDate.getDate()).padStart(2, "0") +
    "/" +
    String(saleDate.getMonth() + 1).padStart(2, "0") +
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
      {/* The set code column is `cardsetcode`; `cardset` is the relation. */}
      <div className="set">{(props.sale.cardsetcode ?? "").toUpperCase()}</div>
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
