import React, { useState } from "react";
export default function Paginator(props) {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="paginator">
      {currentPage !== 1 && (
        <span
          className="pageLink"
          onClick={() => {
            props.loadPage(currentPage - 1);
            setCurrentPage(currentPage - 1);
          }}
        >
          {"<"}
        </span>
      )}
      {props.pages.map((page) => {
        return (
          <span
            key={page}
            className={page !== currentPage ? "pageLink" : "currentPage"}
            onClick={() => {
              if (page !== currentPage) {
                setCurrentPage(page);
                props.loadPage(page);
              }
            }}
          >
            {page}
          </span>
        );
      })}
      {currentPage !== props.pages.length && (
        <span
          className="pageLink"
          onClick={() => {
            props.loadPage(currentPage + 1);
            setCurrentPage(currentPage + 1);
          }}
        >
          {">"}
        </span>
      )}
    </div>
  );
}
