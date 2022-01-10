import "./menu.css";
import { NavLink } from "react-router-dom";

export default function Menu(props) {
  return (
    <div className="menuContainer">
      <NavLink
        to="/"
        className={(navData) =>
          navData.isActive ? "selectedButton menuElement" : "menuElement"
        }
      >
        <div className="label">Home</div>
      </NavLink>
      <NavLink
        to="/collection"
        className={(navData) =>
          navData.isActive ? "selectedButton menuElement" : "menuElement"
        }
      >
        <div className="label">Mi colección</div>
      </NavLink>
      <NavLink
        to="/sales"
        className={(navData) =>
          navData.isActive ? "selectedButton menuElement" : "menuElement"
        }
      >
        <div className="label">Mis ventas</div>
      </NavLink>
      <NavLink
        to="/sales"
        className={(navData) =>
          navData.isActive ? "selectedButton menuElement" : "menuElement"
        }
      >
        <div className="label">Comprar cartas</div>
      </NavLink>
    </div>
  );
}
