require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const academixDB = client.db("academixDB");
    const userCollection = academixDB.collection("userCollection");
    const courseCollection = academixDB.collection("courseCollection");
    const instructorCollection = academixDB.collection("instructorCollection");
    const studentCollection = academixDB.collection("studentCollection");
    const paymentCollection = academixDB.collection("paymentCollection");

    //user

    app.post("/user", async (req, res) => {
      const user = req.body;

      console.log(user);

      const isUserExist = await userCollection.findOne({ email: user.email });

      if (isUserExist?._id) {
        return res.send({
          status: "Success",
          message: "Login success",
        });
      }
      const result = await userCollection.insertOne(user);
      console.log(result);
      res.json(result);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to the academix domain!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
