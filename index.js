require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var jwt = require("jsonwebtoken");

const port = process.env.PORT || 8000;

const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;

//database uri
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

function createToken(user) {
  const token = jwt.sign(
    {
      data: user?.email,
    },
    jwtSecret,
    { expiresIn: "7d" }
  );
  return token;
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("Authorization header missing");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send("Token missing");
  }

  try {
    const verify = jwt.verify(token, jwtSecret);
    req.user = verify.data;
    next();
  } catch (error) {
    return res.status(401).send("Invalid token");
  }
}

app.get("/", async (req, res) => {
  await res.send("Welcome to BookHive Server");
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

    // courses collection
    app.get("/courses", async (req, res) => {
      const result = await courseCollection.find().toArray();
      res.send(result);
    });

    app.get("/course/:id", async (req, res) => {
      const id = req.params.id;
      const result = await courseCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.delete("/course/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      const result = await courseCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.post("/courses", verifyToken, async (req, res) => {
      const courseData = req.body;
      const result = await courseCollection.insertOne(courseData);
      res.send(result);
    });

    app.patch("/course/edit/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      const courseData = req.body;

      const result = await courseCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: courseData },
        { upsert: true }
      );
      res.send(result);
    });

    app.get("/course/edit/:id", async (req, res) => {
      const id = req.params.id;

      const ObjectId = require("mongodb").ObjectId;

      const result = await courseCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    //user

    app.get("/user/:email", async (req, res) => {
      const userEmail = req.params;

      const result = await userCollection.findOne(userEmail);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.post("/user", verifyToken, async (req, res) => {
      const user = req.body;

      const token = createToken(user);
      console.log(token);

      const isUserExist = await userCollection.findOne({ email: user.email });

      if (isUserExist?._id) {
        return res.send({
          status: "Success",
          message: "Login success",
          token: token,
        });
      }
      const result = await userCollection.insertOne(user);
      res.json({
        status: "Success",
        message: "User created successfully",
        token: token,
      });
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
