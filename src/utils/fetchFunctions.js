import texts from "../data/texts";
var FormData = require("form-data");

// Store data un LS
export function storeInLS(key, data) {
  localStorage.setItem(key, data);
}

// Read from LS
export function readFromLS(key) {
  return localStorage.getItem(key);
}

// Delete from LS
export function deleteFromLS(key) {
  return localStorage.removeItem(key);
}

// Access API
// With timeout specified in .env
export function accessAPI(verb, endpoint, data, callbackSuccess, callbackFail) {
  const url = process.env.REACT_APP_API_URL + "/" + endpoint;
  var formData = new FormData();

  for (const name in data) {
    formData.append(name, data[name]);
  }
  var fetchConfig = {
    method: verb,
    headers: {
      "accept-encoding": "gzip, deflate",
    },
  };
  if (data) {
    fetchConfig.body = formData;
  }
  Promise.race([
    // Generate two promies, one with the fecth and the other with the timeout
    // the one that finishes first resolves
    fetch(url, fetchConfig),
    new Promise(function (resolve, reject) {
      setTimeout(
        () => reject(new Error("request timeout")),
        process.env.REACT_APP_API_TIMEOUT
      );
    }),
  ])
    .then((response) => {
      // When race resolves, it verifies the status of the API response
      // If it's 200 or 201, it was successful, then the success callback is run
      if (response.status >= 200 && response.status < 300) {
        response.json().then((data) => {
          callbackSuccess(data);
        });
      } else {
        response.json().then((data) => {
          data.status = response.status;
          callbackFail(data);
        });
      }
    })
    .catch((e) => {
      var response = {
        status: 500,
        detail: texts.API_ERROR,
      };
      callbackFail(response);
    });
}
