const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleWare
app.use(cors());
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lkdhqkk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const classCollection = client.db("educlamdb").collection("class")
        const instructorCollection = client.db("educlamdb").collection("instractor")
        const reviewCollection = client.db("educlamdb").collection("review")
        const cartsCollection = client.db("educlamdb").collection("carts")

        // all classes side
        app.get('/class', async (req, res) => {
            const result = await classCollection.find().toArray();
            res.send(result);
        })


        // all instructors side
        app.get('/instractor', async (req, res) => {
            const result = await instructorCollection.find().toArray();
            res.send(result);
        })


        //  carts side
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            console.log(email)
            if (!email) {
                res.send([]);
            }
            const query = { email: email };
            const result = await cartsCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/carts', async (req, res) => {
            const item = req.body;
            console.log(item);
            const result = await cartsCollection.insertOne(item);
            res.send(result);
        });


        // all reviews side
        app.get('/review', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Server is running')
})

app.listen(port, () => {
    console.log(`EduClam side is running ${port}`)
})