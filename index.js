const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// middlewares 
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@gadgetscluster.bkpdl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const productsCollection = client.db("GadgetDB").collection("products");
    const ordersCollection = client.db("GadgetDB").collection("orders");

    console.log('connected to gadget DB');

    // upload a product by post
    app.post('/product', async (req, res) => {

      // get the token info from post headers 
      const tokenInfo = req.headers.authorization;
      // console.log(tokenInfo);
      if (!tokenInfo) {
        res.send({ message: 'unauthorized access' })
      }
      else {
        const [email, accessToken] = tokenInfo.split(' ');

        const decoded = verifyToken(accessToken);
        if (email === decoded.email) {
          const newProduct = req.body;
          const result = await productsCollection.insertOne(newProduct);
          res.send(result);
        } else {
          res.send({ message: 'Unauthorized Access' })
        }
      }

      // upload the product 

    })

    // get all the products 
    app.get('/products', async (req, res) => {
      const query = {};
      const cursor = productsCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    })

    //post the orders 
    app.post('/order', async (req, res) => {
      const newOrder = req.body;
      console.log(newOrder);
      const result = await ordersCollection.insertOne(newOrder);
      res.send(result);
    })

    // get the orders 
    app.get('/orders', async (req, res) => {

      const tokenInfo = req.headers.authorization;
      if (!tokenInfo) {
        res.send({ message: 'unauthorized access' })
      }

      else {
        const [email, accessToken] = tokenInfo.split(' ');
        const decoded = verifyToken(accessToken);

        if (email === decoded.email) {
          const cursor = ordersCollection.find({ email });
          const orders = await cursor.toArray();
          res.send(orders);
        } else {
          res.send({ message: 'Unauthorized Access!' });
        }

      }
    })
    // jwt token apis 
    app.post('/login', async (req, res) => {
      const email = req.body;
      // console.log(email);
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
      res.send({ token });
    })
  } finally {

  }
}

run().catch(console.dir);

// testing connection 
app.get('/', (req, res) => {
  res.send('connected to gadget server');
})

app.listen(port, () => {
  console.log('listening to port', port);
})

function verifyToken(token) {
  let decodedEmail;
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {

    if (err) {
      decodedEmail = 'invalid email';
    }

    if (decoded) {
      // console.log('decoded', decoded);
      decodedEmail = decoded;
    }
  });

  return decodedEmail;
}