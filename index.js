const express = require('express');
const app = express();
const cors = require('cors');
const port = 4000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// middlewares 
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@gadgetscluster.bkpdl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
/* client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  console.log('connected to gadget DB')
  client.close();
}); */

async function run() {
  try {
    await client.connect();
    const productsCollection = client.db("GadgetDB").collection("products");
    console.log('connected to gadget DB');

    // upload a product by post
    app.post('/product', async (req, res) => {

      // get the token info from post headers 
      const tokenInfo = req.headers.authorization;
      // console.log(tokenInfo);
      const [email, accessToken] = tokenInfo?.split(' ');
      // console.log(`email: ${email}, token: ${accessToken}`);
      // verify the token to allow access of upload 
      const decoded = verifyToken(accessToken);
      if (email === decoded.email) {
        const newProduct = req.body;
        const result = await productsCollection.insertOne(newProduct);
        res.send(result);
      } else {
        res.send({ message: 'Unauthorized Access' })
      }

      // upload the product 


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
      decodedEmail = 'invalid email'
    }

    if (decoded) {
      // console.log('decoded', decoded);
      decodedEmail = decoded;
    }
  });

  return decodedEmail;
}