// include http, url, querystring
var http = require("http");
var url = require("url");
var q = require("querystring");

// Status Code
var statusCode = 200;

const fs = require("fs");

/* createServer creates a server and connects to localhost and port 3000. When a
 * GET request is sent to the server, the server will return a response letting
 * the client know whether or not their filtered search is valid. If it's valid,
 * The client's browser will display a table showing their filtered search. When
 * the client sends a POST request, the server will respond letting the client know
 * whether a required field is missing information or let the client know if there
 * item was added to the grocerty list.
 */
http
  .createServer(async function (req, res) {
    // Use resBody and resMsg to create response message sent back to the client
    var resBody = "";
    var resMsg = "";

    // parse the url
    let urlObj = url.parse(req.url, true, false);
    // qstr will hold the query
    let qstr = urlObj.query;

    // display the query to the console
    // console.log(qstr);

    // create the start of the html response
    resBody =
      resBody +
      `<html><head><title>Simple HTTP Server</title>
      <style>
        html,body {
          height: 100%;
        }

        html {
          display: table;
          margin: auto;
        }
        
        body {
            display: table-cell;
            vertical-align: middle;
            font-size: 36px;
            text-align: center;
            color: #081f37;
        }

        .row {
          display: flex;
          margin-left:-5px;
          margin-right:-5px;
        }
        
        .column {
          flex: 50%;
          padding: 0px 40px;
        }

        input {
          width: 100%;
        }

        .button {
          background-color: #5fc9f3;
          color: #1D438A;
          width: 50%;
          font-size: 0.7em;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 25px 0;
          font-size: 0.7em;
          font-family: sans-serif;
          min-width: 400px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
          border: 1px solid #081f37;
        }

        table thead tr {
          background-color: #5fc9f3;
          color: #081f37;
          text-align: left;
        }

        table th, table td {
          padding: 12px 15px;
          text-align: center;
        }

        table tbody tr {
          border-bottom: 1px solid #dddddd;
        }
        
        table tbody tr:nth-of-type(even) {
            background-color: #f3f3f3;
        }

        table tbody tr:last-of-type {
          border-bottom: 1px solid #081f37;
      }
      </style></head>`;

    // if the request is a method POST
    if (req.method === "POST") {
      var reqData = "";
      // variable reqData will hold the chunk data
      req.on("data", function (chunk) {
        reqData += chunk;
      });

      // when the end is reached
      req.on("end", function () {
        // parse reqData and hold in postParams
        var postParams = q.parse(reqData);

        // Notify client that the name field is empty and it's required
        if (postParams.name === "") {
          resMsg = '"name"';
          addDisplay(res, resBody, resMsg, false);
          // Notify client that the brand field is empty and it's required
        } else if (postParams.brand === "") {
          resMsg = '"brand"';
          addDisplay(res, resBody, resMsg, false);
          // Notify client that the quantity field is empty and it's required
        } else if (postParams.quantity === "") {
          resMsg = '"quantity"';
          addDisplay(res, resBody, resMsg, false);
          // Notify client that the aisle field is empty and it's required
        } else if (postParams.aisle === "") {
          resMsg = '"aisle"';
          addDisplay(res, resBody, resMsg, false);
          // Notify client that the custom field is empty and it's required
        } else if (postParams.custom === "") {
          resMsg = '"custom"';
          addDisplay(res, resBody, resMsg, false);
          // Notify client that the information provided was added to list
        } else {
          resMsg = {
            quantity: postParams.quantity,
            custom: postParams.custom,
            name: postParams.name,
            aisle: postParams.aisle,
            brand: postParams.brand,
          };
          addDisplay(res, resBody, resMsg, true);
        }
      });
      // if request method is GET
    } else if (req.method === "GET") {
      // Check for valid URL
      if (
        urlObj.path === "" ||
        urlObj.path === "/" ||
        urlObj.path.includes("my_groceries")
      ) {
        // At start, display the forms to client
        resMsg = forms;

        // Initialize status code to 200
        statusCode = 200;

        // check if aisle and custom have filters
        if (
          urlObj.path.includes("my_groceries") ||
          qstr.aisle === "" ||
          qstr.custom === "" ||
          qstr.aisle ||
          qstr.custom
        ) {
          // if groceries.json file exists, check the filters
          if ((await exists("./grocerydata/groceries.json")) === true) {
            // if application/json is accepted, create and send json
            if (
              req.headers.accept.includes("application/json") ||
              req.headers.accept.includes("application/xml")
            ) {
              resMsg = await checkFilters(qstr.aisle, qstr.custom, "json");
              // resBody = "This JSON is used for Postman testing:<br>";
              // for (let i = 0; i < resMsg.length; i++) {
              //   resBody += JSON.stringify(resMsg[i]);
              // }
              // resBody += "<br><hr>";
              // set Content-Type to application/json
              res.setHeader("Content-Type", "application/json");
            }

            // pass empty query for my_groceries
            if (qstr.aisle === undefined && qstr.custom === undefined) {
              resMsg = await checkFilters("", "");

              statusCode = 400;
            } else {
              resMsg = await checkFilters(qstr.aisle, qstr.custom);
            }

            // if custom is banned set status code to 400
            if (qstr.custom === "banned") {
              statusCode = 400;
            }

            // else notify the client that a grocery list does not exist
          } else {
            resMsg = `<h2>A grocery list does not exist at the moment.</h2><span>Add More: <a href="./">here</a></span>`;

            // Status code is 400 for no grocery list available
            statusCode = 400;
          }
        }
      } else {
        resMsg = `<h2>Page does not exist.</h2>`;

        // Status code is 404 for invalid URL
        statusCode = 404;
      }

      // if text/html is accepted, send html
      if (req.headers.accept.includes("text/html")) {
        // if the url path include "favorites"
        if (urlObj.path.includes("favorites")) {
          // notify client if there are no favorites available
          if (req.headers.cookie === undefined) {
            resMsg = `<h3>You do not have any favorites at the moment!<h3>`;
          } else {
            // set data to readFile()
            var data = await readFile();

            // reset resMsg to display favorites table
            resMsg = `<h2>Your favorites:</h2><br><table border="1" cols="5"><tbody><thead><tr><th>Product Name</th><th>Brand Name</th><th>Aisle Number</th><th>Quantity</th><th>Diet Type</th></tr></thead>`;

            // replace characters in the headers.cookie for easier comparisons
            var current = req.headers.cookie.replace(/'/g, "");
            current = current.replace(/,/g, "");
            current = current.replace(/; /g, "");
            current = current.split("=on");

            // if the current cookies match items in groceries.json, add to favorites table
            for (let i = 0; i < data.length; i++) {
              for (let j = 0; j < current.length; j++) {
                if (data[i].name.split(" ").join("") === current[j]) {
                  resMsg +=
                    `</td><td>` +
                    data[i].name +
                    `</td><td>` +
                    data[i].brand +
                    `</td><td>` +
                    data[i].aisle +
                    `</td><td>` +
                    data[i].quantity +
                    `</td><td>` +
                    data[i].custom +
                    `</td></tr>`;
                }
              }
            }
          }
          // close favorites table
          resMsg += `</tbody></table><br><span>Add More: <a href="./">here</a></span>`;
        }
        // setHeader Content-Type to text/html
        res.setHeader("Content-Type", "text/html");
        // end HTML response
        resBody = resBody + "<body>" + resMsg + "\n</body></html>";
        // if text/plain is accepted create and send plain text
      } else if (req.headers.accept.includes("text/plain")) {
        resBody = resMsg.replace(/<br>/g, "\n");
        resBody = resBody.replace(/<\/tr>/g, "\n");
        resBody = resBody.replace(/<\/th>/g, "\t");
        resBody = resBody.replace(/<\/td>/g, "\t\t\t");
        resBody = resBody.replace(/<[^>]+>/g, "");
        res.setHeader("Content-Type", "text/plain");
        // since application/xml is not accepted, notify client
      } else if (req.headers.accept.includes("application/xml")) {
        resMsg =
          "<span>This application understands text/html, text/plain, or application/json</span>";
        res.setHeader("Content-Type", "text/html");
        // end HTML response
        resBody = resBody + "<body>" + resMsg + "\n</body></html>";
        statusCode = 406;
      }

      // check url path to see if a cookie has been added
      if (urlObj.path.includes("addCookies")) {
        var cook = "";
        let i = 1;

        // add cookie queries to cook variable
        for (const [key, value] of Object.entries(qstr)) {
          cook += `${key}=${value}`;

          // add a comma separator between each cookie
          if (i < Object.entries(qstr).length) {
            cook += `,`;
          }
          i++;
        }

        // add a 5 minute expiration per cookie set
        cook += `;Expires=${new Date(Date.now() + 5 * 60 * 1000).toString()}'`;

        // set status code and cookies to send to client
        res.writeHead(statusCode, { "Set-Cookie": cook });

        // end response
        res.end(resBody);
      } else {
        // only set status code if no favorites/cookies are added
        res.writeHead(statusCode);
        res.end(resBody);
      }
    }
  })
  .listen(3000);

/* addDisplay will display the HTML response for when an item is added to the
 * grocery list.
 */
async function addDisplay(res, resBody, resMsg, input) {
  var data;

  // Notify client if a required field was not entered
  if (input === false) {
    resMsg =
      "<h2>Required Key: " + resMsg + " not present in sent blueprint</h2>";
    statusCode = 400;
  } else {
    // if groceries.json file exists read the file
    if ((await exists("./grocerydata/groceries.json")) === true) {
      data = await readFile();
      // else create an empty array
    } else {
      data = [];
    }

    // push resMsg to data variable
    data.push(resMsg);
    // create succesful message
    resMsg =
      `<p>Successfully added: ` +
      resMsg.name +
      `!</p><p>Total items in grocery list: ` +
      data.length +
      `</p>`;
    statusCode = 201;
    // write data to groceries.json file
    await writeFile(data);
  }

  // end of HTML response
  resBody = resBody + "<body>" + resMsg;
  res.setHeader("Content-Type", "text/html");
  res.writeHead(statusCode);
  res.end(resBody + '\n<a href="./">Add More</a><br></body></html>');
}

/* checkFilters() will check the aisle and custom fields and respond accordingly
 */
async function checkFilters(aisle, custom, type) {
  // set data to readFile()
  var data = await readFile();
  // span is the html spanMsg
  var span = "";
  // spanMsg is a string message
  var spanMsg = "";
  // jsonObject will be used to create json
  var jsonObject = [];
  var dataTable = [];

  statusCode = 200;

  // start creating the table
  var table = `<table border="1" cols="5"><tbody><thead><tr><th>Product Name</th><th>Brand Name</th><th>Aisle Number</th><th>Quantity</th><th>Diet Type</th></tr></thead>`;

  // when favorites gets added:
  //   var table = `<table><tbody><thead><tr><th>Favorites</th><th>Product Name</th><th>Brand Name</th><th>Aisle Number</th><th>Quantity</th><th>Diet Type</th></tr></thead>`;

  // if aisle and custom are empty, display the table with no filters
  if (aisle === "" && custom === "") {
    statusCode = 400;
    spanMsg = "No filters applied on grocery list.";
    span = `<br><span>` + spanMsg + `</span><br><br>`;
    jsonObject.push(spanMsg);
    for (let i = 0; i < data.length; i++) {
      dataTable.push(data[i].name);
      table +=
        `<tr><td>` +
        data[i].name +
        `</td><td>` +
        data[i].brand +
        `</td><td>` +
        data[i].aisle +
        `</td><td>` +
        data[i].quantity +
        `</td><td>` +
        data[i].custom +
        `</td></tr>`;

      // push data to jsonObject
      jsonObject.push({
        quantity: data[i].quantity,
        custom: data[i].custom,
        name: data[i].name,
        aisle: data[i].aisle,
        brand: data[i].brand,
      });
    }
    // else if aisle is not empty and custom is empty, display table with aisle filters
  } else if (aisle !== "" && custom === "") {
    spanMsg = `Successfully filtered on aisle for value: ` + aisle;
    span = `<span>` + spanMsg + `</span><br><br>`;
    jsonObject.push(spanMsg);
    for (let i = 0; i < data.length; i++) {
      if (parseInt(aisle) === parseInt(data[i].aisle)) {
        dataTable.push(data[i].name);
        table +=
          `<tr>` +
          //   <td><input type="checkbox" id=` +
          //   data[i].name +
          //   ` name=` +
          //   data[i].name.split(" ").join("") +
          //   `></td>
          `<td>` +
          data[i].name +
          `</td><td>` +
          data[i].brand +
          `</td><td>` +
          data[i].aisle +
          `</td><td>` +
          data[i].quantity +
          `</td><td>` +
          data[i].custom +
          `</td></tr>`;

        // push data to jsonObject
        jsonObject.push({
          quantity: data[i].quantity,
          custom: data[i].custom,
          name: data[i].name,
          aisle: data[i].aisle,
          brand: data[i].brand,
        });
      }
    }
    if (dataTable.length === 0) {
      statusCode = 400;
      jsonObject.pop();
      spanMsg = `There are no items that match your filter of aisle: ${aisle}!`;
      span = `<span>` + spanMsg + `</span><br><br>`;
      jsonObject.push({ "No items: ": spanMsg });
    }
    // else if aisle is empty and custom is not empty, display table with custom filters
  } else if (aisle === "" && custom !== "" && custom !== "banned") {
    spanMsg = `Successfully filtered on custom for value: ` + custom;
    span = `<span>` + spanMsg + `</span><br><br>`;
    jsonObject.push(spanMsg);
    for (let i = 0; i < data.length; i++) {
      if (custom === data[i].custom) {
        dataTable.push(data[i].name);
        table +=
          `<tr>` +
          //   <td><input type="checkbox" id=` +
          //   data[i].name +
          //   ` name=` +
          //   data[i].name.split(" ").join("") +
          //   `></td>
          `<td>` +
          data[i].name +
          `</td><td>` +
          data[i].brand +
          `</td><td>` +
          data[i].aisle +
          `</td><td>` +
          data[i].quantity +
          `</td><td>` +
          data[i].custom +
          `</td></tr>`;

        // push data to jsonObject
        jsonObject.push({
          quantity: data[i].quantity,
          custom: data[i].custom,
          name: data[i].name,
          aisle: data[i].aisle,
          brand: data[i].brand,
        });
      }
    }
    if (dataTable.length === 0) {
      statusCode = 400;
      jsonObject.pop();
      spanMsg = `There are no items that match your filter of custom value: ${custom}!`;
      span = `<span>` + spanMsg + `</span><br><br>`;
      jsonObject.push({ "No items: ": spanMsg });
    }
    // else if both aisle and custom are not empty, display table with both filters being used
  } else if (aisle !== "" && custom !== "" && custom !== "banned") {
    spanMsg = `Successfully filtered on aisle for value: ${aisle} and on custom for value: ${custom}!`;
    span = `<span>` + spanMsg + `</span><br><br>`;
    jsonObject.push(spanMsg);

    for (let i = 0; i < data.length; i++) {
      if (
        parseInt(aisle) === parseInt(data[i].aisle) &&
        custom === data[i].custom
      ) {
        dataTable.push(data[i].name);
        table +=
          `<tr>` +
          //   <td><input type="checkbox" id=` +
          //   data[i].name +
          //   ` name=` +
          //   data[i].name.split(" ").join("") +
          //   `></td>
          `<td>` +
          data[i].name +
          `</td><td>` +
          data[i].brand +
          `</td><td>` +
          data[i].aisle +
          `</td><td>` +
          data[i].quantity +
          `</td><td>` +
          data[i].custom +
          `</td></tr>`;

        // push data to jsonObject
        jsonObject.push({
          quantity: data[i].quantity,
          custom: data[i].custom,
          name: data[i].name,
          aisle: data[i].aisle,
          brand: data[i].brand,
        });
      }
    }
    if (dataTable.length === 0) {
      statusCode = 400;
      jsonObject.pop();
      spanMsg = `There are no items that match your filter of aisle ${aisle} and custom value of ${custom}!`;
      span = `<span>` + spanMsg + `</span><br><br>`;
      jsonObject.push({ "No items: ": spanMsg });
    }
  }

  // if custom is banned, set return string/json objects
  if (custom === "banned") {
    dataTable.push("banned");
    spanMsg = "No filters applied on grocery list.";
    span = `<br><h3>` + spanMsg + `</h3>`;
    jsonObject.push(spanMsg);

    var tableToJSON = "Banned diets are not acceptable diets.";

    table = "<span>" + tableToJSON + "</span><br><br>";

    jsonObject.push({ "Banned message": tableToJSON });
  }

  // finish creating HTML table
  table =
    // `<form action="./addCookies">` +
    span +
    table +
    `</tbody></table>` +
    // <input type ="submit" value="Submit"></form>
    `<br><span>Add More: <a href="./">here</a></span>`;

  if (dataTable.length === 0) {
    table = span + `<span>Add More: <a href="./">here</a></span>`;
  }

  // return json object
  if (type === "json") {
    return jsonObject;
  }

  // return HTML table
  return table;
}

/* check if groceries.json exists. resolve(false) is it does not exist and
 * resolve(true) if it does exist
 */
async function exists(data) {
  return new Promise((resolve) => {
    fs.access("./grocerydata/groceries.json", fs.F_OK, (err) => {
      if (err) {
        resolve(false);
        console.log("File does not exist");
      } else {
        resolve(true);
      }
    });
  });
}

/* writeFile will write JSON to groceries.json and create the file if it does not exist
 */
async function writeFile(data) {
  await fs.writeFile(
    "./grocerydata/groceries.json",
    JSON.stringify(data, null, 4),
    { flag: "w+" },
    (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    }
  );
}

/* readFile will read the groceries.json file
 */
function readFile() {
  return new Promise((resolve) => {
    fs.readFile("./grocerydata/groceries.json", function (err, data) {
      if (err) {
        console.log("Unable to read file");
      }
      resolve(JSON.parse(data.toString()));
    });
  });
}

// used to generate the main Grocery List HTML page
var forms = `<h2>Grocery List</h2>
	  <div class="row">
      <div class="column">
        <form action="groceries" method="post">
          <table border="1" cols="2">
            <thead>
              <tr>
                <th>Field Name</th>
                <th>Field Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Product Name</td>
                <td>
                  <input type="text" name="name">
                </td>
              </tr>
              <tr>
                <td>Product Brand</td>
                <td><input type="text" name="brand"></td>
              </tr>
              <tr>
                <td>Quantity</td>
                <td><input type="text" name="quantity"></td>
              </tr>
              <tr>
                <td>Aisle</td>
                <td><input type="text" name="aisle"></td>
              </tr>
              <tr>
                <td>Diet</td>
                <td><input type="text" name="custom"></td>
              </tr>
            </tbody>
          </table>
          <input class="button" type="submit" value="Add">
        </form>
      </div>
      <div class="column">
        <form action="my_groceries" method="get">
          <table border="1" cols="2">
            <thead>
              <tr>
                <th>Field Name</th>
                <th>Field Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Aisle</td>
                <td><input type="text" name="aisle"></td>
              </tr>
              <tr>
                <td>Diet</td>
                <td><input type="text" name="custom"></td>
              </tr>
            </tbody>
          </table>
          <input class="button" type="submit" value="Search">
        </form>
      </div>
    </div>`;
