const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const {MongoClient, ServerApiVersion} = require('mongodb');

const portNumber = Number(process.argv[2]);
const app = express();

require("dotenv").config({path: path.resolve(__dirname, 'credentials/.env')});
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection:process.env.MONGO_COLLECTION};

const ownPath = path.resolve(__dirname, "templates");
app.use(express.static(ownPath));
app.set("views", ownPath);
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json()); // To parse JSON data from the client

let client;
const uri = `mongodb+srv://${userName}:${password}@cluster0.dbibtzp.mongodb.net/`;
client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});

let server = app.listen(portNumber, async () => {
    console.log(`Web server started and running at http://localhost:${portNumber}`);
    console.log(`Stop to shutdown the server: `);
    await client.connect();
});

process.stdin.setEncoding("utf8");

process.stdin.on("readable", () => {
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
        let command = dataInput.trim();
        if (isNaN(Number(command)) && command.toLowerCase() === "stop") {
            console.log("Shutting down the server");
            server.close(() => {
                client.close();
                process.exit(0);
            });
        }
    }
});

app.get("/", (request, response) => {
    response.render("index.ejs");
});

app.post('/savePlace', async (req, res) => {
  let place = req.body;
  const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(place);
  res.json({status: 'success'});
});
