import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) =>{
    res.status(200).json({ message: "Hello from the server" });
});

app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
});
