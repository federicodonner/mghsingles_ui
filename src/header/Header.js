import "./header.css";
import singlesLogo from "../images/mghsinglesLogo.png";
import mghlogo from "../images/mghLogo.png";

export default function Header(props) {
  return (
    <header>
      <div className="barraSuperior">
        <div className="flexContainer">
          <div className="logoContainer">
            <img src={singlesLogo} className="singlesLogo" alt="MGH Singles" />
          </div>
          {props.showMenu && <div className="menuContainer"></div>}
          <div className="mghlogoContainer">
            <span className="by">by</span>
            <img src={mghlogo} className="mghlogo" alt="MGH" />
          </div>
        </div>
      </div>
    </header>
  );
}
