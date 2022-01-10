import "./header.css";
import Menu from "./Menu";
import singlesLogo from "../images/mghsinglesLogo.png";
import mghlogo from "../images/mghLogo.png";

export default function Header(props) {
  return (
    <header>
      <div className="flexContainer">
        <div className="logoContainer">
          <img src={singlesLogo} className="singlesLogo" alt="MGH Singles" />
        </div>
        {props.showMenu && <Menu />}
        <div className="mghlogoContainer">
          <span className="by">by</span>
          <img src={mghlogo} className="mghlogo" alt="MGH" />
        </div>
      </div>
    </header>
  );
}
