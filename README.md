# Grocery List Web-based Application

A simple web-based application using Node.js HTTP module to demonstrate an understanding of HTTP requests and responses. It has the following features:

1. Run server through terminal.
2. Connect a client by opening a browser on localhost:3000.
3. Once connection is made, the landing page will display 2 tables:
   1. Client can add items to the grocery list.
      1. If client leaves any form blank, client will:
         1. receive an error message
         2. recieve 400 status code
      2. If client successfully adds an item, client will:
         1. receive a success message
         2. receive 200 status code
   2. Client can search an item by, Aisle, Diet, Aisle and Diet.
      1. If Aisle, Diet, or Aisle and Diet are not successful searches. Client will:
         1. receive appropriate error message with no table displayed
         2. receive status code 400
      2. If Aisle, Diet, or Aisle and Diet are successful searches. Client will:
         1. receive appropriate success message with a table listing the filtered grocery items
         2. receive status code 200
      3. If Aisle and Diet are left blank, client will:
         1. receive appropriate message with a table listing all grocery items
         2. receive status code 400
   3. Client can click Add More: "here" to go back to main page after submitting a form
4. If client enters an invalid URL, client will:
   1. receive a "Page does not exist" message
   2. receive status code 404
5. Grocery items are read from and written to the grocerydata/groceries.json file

## How to use the Project

You can clone the repository and:

```
cd Grocery-List-Node-HTTP
```

### To Run Server

To run the server:

```
node grocery-list.js
```

### To Run Client

To connect the client, open a browser and enter URL:

```
localhost:3000
```
