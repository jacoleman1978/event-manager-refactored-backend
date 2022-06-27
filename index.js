import app from "./server.js";
import { config } from "dotenv";
import pkg from 'mongoose';
const { connect } = pkg;

const main = () => {
    config();

    // Set PORT from .env or 4100 if not assigned
    const PORT = process.env.PORT || 4100;

    // Connect to MongoDB
    connect(process.env.ATLAS_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
        .then(() => console.log(`Connnected to MongoDB: ${process.env.DB_NAME}`))
        .catch(console.error)

    // Add a port listener to the app
    app.listen(PORT, () => {
        console.log(`Connected through port: ${PORT}`)
    })
}

// Run the main function and catch any errors that were generated
main();