const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;

// middleWare
app.use(cors());
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

        const usersCollection = client.db("educlamdb").collection("users")
        const classCollection = client.db("educlamdb").collection("class")
        const instructorCollection = client.db("educlamdb").collection("instractor")
        const reviewCollection = client.db("educlamdb").collection("review")
        const cartsCollection = client.db("educlamdb").collection("carts")
        const enroedllCollection = client.db("educlamdb").collection("enrolled")


        // users side api
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })


        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })


        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = {
                admin: user?.role === "admin",
            };
            res.send(result);
        });
        app.get('/users/instructo/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = {
                admin: user?.role === "instructor",
            };
            res.send(result);
        });

        app.patch('/users/instructo/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'instructor',
                },
            };
            const result = await usersCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin',
                },
            };
            const result = await usersCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });



        // all classes side
        app.get('/class', async (req, res) => {
            const result = await classCollection.find().toArray();
            res.send(result);
        })
        app.post('/class', async (req, res) => {
            const newClass = req.body;
            const result = await classCollection.insertOne(newClass)
            res.send(result);
        })

        app.get('/class/email/:email', async (req, res) => {
            const email = req.params.email;
            const result = await classCollection.find({ email }).sort({ price: -1, category: 1 }).toArray();
            res.send(result);
        });




        app.patch('/class/approved/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'approved',
                },
            };
            const result = await classCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });

        app.patch('/class/denied/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'denied',
                },
            };
            const result = await classCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });

        app.delete('/class/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await classCollection.deleteOne(query);
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

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartsCollection.deleteOne(query);
            res.send(result);
        })
        // all enrolled side 
        app.post('/enrolled', async (req, res) => {
            const item = req.body;
            console.log(item);
            const result = await enroedllCollection.insertOne(item);
            res.send(result);

        })
        app.get('/enrolled/email/:email', async (req, res) => {
            const email = req.params.email;
            const result = await enroedllCollection.find({ email }).sort({ price: -1, category: 1 }).toArray();
            res.send(result);
        });
        app.delete('/enrolled/email/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const result = await enroedllCollection.deleteOne({ email });
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });


        // all reviews side
        app.get('/review', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        })

        // stripe payment api
        app.post('create-payment-intent', async (req, res) => {
            const { price } = req.body;

            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            })
            res.send({
                clientSecret: paymentIntent.client_secret
            })
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