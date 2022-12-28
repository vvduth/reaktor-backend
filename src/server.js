import express from "express";
import http from "http"
import droneRoutes from './routes/droneRoutes.js'
const app = express();
const server = http.createServer(app);

const PORT = 5000 || process.env.PORT;

app.get("/", (req, res) => {
  res.send("<p>Hello and welcome</p>");
});

app.use('/api/drones',droneRoutes )

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
