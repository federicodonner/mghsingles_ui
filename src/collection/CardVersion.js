import React, { useState } from "react";
import "./cardVersion.css";

export default function CardVersion(props) {
  // Load the version details in state
  const [version] = useState(props.version);

  return (
    <div
      className="version"
      onClick={() => {
        props.selectVersion(version);
      }}
    >
      <img src={version.image} alt="version" />
      <div className="set">{version.cardSetName}</div>
    </div>
  );
}
