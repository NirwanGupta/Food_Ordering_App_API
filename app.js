require(`dotenv`).config();
require(`express-async-errors`);

const express = require(`express`);
const app = express();

const connectDB = require(`./db/connect`);

const authRoutes = require(`./routes/authRoutes`);

const errorHandlerMiddleware = require(`./middleware/error-handler`);
const notFoundMiddleware = require(`./middleware/not-found`);

const cookieParser = require(`cookie-parser`);
const morgan = require(`morgan`);

app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(morgan(`tiny`));

app.get(`/`, (req, res) => {
    res.send(`food ordering app`);
})

app.use(`/api/auth`, authRoutes);

const port = process.env.PORT || 5000;

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const start = async() => {
    try {
        await connectDB(process.env.MONGO_URI);
        console.log("Connection established");
        app.listen(port, console.log(`Server listening on port ${port}`));
    } catch (error) {
        console.log(error);
    }
}

start();