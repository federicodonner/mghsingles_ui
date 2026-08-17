import { useState } from "react";
import "./boton.css";
import checkIcono from "../../images/checkIcono.png";
import crossIcono from "../../images/crossIcono.png";

export default function Boton({
  clases,
  uri,
  callback,
  children,
  disabled,
  loader,
  confirmacion,
}) {
  const [confirmando, setConfirmando] = useState(false);

  // Función llamada al presionar el botón, si no se especificó un uri
  function onClick() {
    // Si está cargando, no hace nada
    if (loader) {
      return;
    }

    // Si no tiene confirmación, llama al callback.
    if (!confirmacion) {
      callback();
      return;
    }

    // Si tiene confirmación, cambia el estado
    if (confirmacion && !confirmando) {
      setConfirmando(true);
      return;
    }

    // Si tiene confirmación y ya la mostró, ejecuta el callback
    if (confirmacion && confirmando) {
      setConfirmando(false);
      callback();
      return;
    }
  }

  return (
    <div className={"botonContainer " + clases}>
      {uri && (
        <a href={uri}>
          <button className={clases} disabled={disabled} type="button">
            {children}
          </button>
        </a>
      )}
      {!uri && callback && (
        <button
          className={
            clases +
            (loader ? " loading" : "") +
            (confirmando ? " confirmando" : "")
          }
          onClick={onClick}
          disabled={disabled}
          type="button"
        >
          <span className="etiqueta"> {children}</span>
          {loader && <div className="loader"></div>}
        </button>
      )}
      {confirmando && !loader && (
        <div className="botonesConfirmacion flexContainer">
          <img src={checkIcono} onClick={onClick} alt="confirmar" />
          <img
            src={crossIcono}
            onClick={() => {
              setConfirmando(false);
            }}
            alt="cancelar"
          />
        </div>
      )}
    </div>
  );
}
