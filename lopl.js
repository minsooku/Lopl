const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const {MongoClient, ServerApiVersion} = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const portNumber = Number(process.argv[2]);
require("dotenv").config({path: path.resolve(__dirname, 'credentials/.env')});

const ownPath = path.resolve(__dirname, "templates");
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection:process.env.MONGO_COLLECTION};

const app = express();
app.use(express.static(ownPath));
app.set("views", ownPath);
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));
//app.use(bodyParser.json()); // To parse JSON data from the client

const uri = `mongodb+srv://${userName}:${password}@cluster0.dbibtzp.mongodb.net/`;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const server = app.listen(portNumber, async () => {
  console.log(`Web server started and running at http://localhost:${portNumber}`);
  console.log(`Stop to shutdown the server: `);
  await client.connect();
});

rl.on('line', (input) => {
  if (input.trim().toLowerCase() === 'stop') {
    console.log('Shutting down the server');
    server.close(() => {
      client.close();
      console.log('Server has been shut down.');
      process.exit(0);
    });
  }
});

process.stdin.setEncoding("utf8");

async function main() {
  try {
    const submissions = await client
      .db(databaseAndCollection.db)
      .collection(databaseAndCollection.collection)
      .find({})
      .toArray();

    app.get('/', async (request, response) => {
      response.render('index', { submissions });
    });

    app.get('/formSubmit', (req, res) => {
      res.render('formSubmit',  { portNumber });
    });

    app.post('/formSubmit', async (req, res) => {
      let place = req.body;
      const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(place);
      res.render('submitConfirmation', {favoritePlaces: place} );
    })

    app.post('/savePlace', async (req, res) => {
      let place = req.body;
      const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(place);
      res.json({status: 'success'});
    });

    app.get('/display', async (req, res) => {
      const favoritePlaces = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find({}).toArray();
      res.render('display', { favoritePlaces });
    });    
    app.post('/reset', async (req, res) => {
      await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteMany({});
      res.redirect('/display');
    });
  
  } catch (e) {
    console.error(e);
  }
}

main().catch(console.error);