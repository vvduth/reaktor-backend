import express from "express";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import convert from "xml-js";

export const DRONE_URL = "http://assignments.reaktor.com/birdnest/drones";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

function push1(array, item) {
  if (!array.find(({ pilotId }) => pilotId === item.pilotId)) {
    array.push(item);
  }
}

function push2(array, item) {
  if (!array.find((pilotId) => pilotId === item)) {
    array.push(item);
  }
}

export const violateCheckDrone = (x_pos, y_pos) => {
  let a = (x_pos - 250000) * (x_pos - 250000);
  let b = (y_pos - 250000) * (y_pos - 250000);
  return Math.sqrt(a + b) >= 100000;
};

export let violdatedDronesSerialNumbers = [];
export let violatedPilot = [];

const PORT = 5000 || process.env.PORT;

export const fetchDrones2 = async () => {
  const response = await axios.get(DRONE_URL, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
  let convertToJsondata = convert.xml2json(response.data, {
    compact: true,
    space: 4,
  });
  let allDronesInfo = JSON.parse(convertToJsondata);
  return allDronesInfo.report.capture.drone;
};

export const fecthViolatedPilot = async (serialNum) => {
  try {
    const res = await axios.get(
      `http://assignments.reaktor.com/birdnest/pilots/` + serialNum
    );
    return res.data;
  } catch (e) {
    console.log(e);
    return e.response.data;
  }
};

export const fetchDrones3 = async () => {
  const response = await axios.get(DRONE_URL, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
  let convertToJsondata = convert.xml2json(response.data, {
    compact: true,
    space: 4,
  });
  let allDronesInfo = JSON.parse(convertToJsondata);
  for (let drone of allDronesInfo.report.capture.drone) {
    if (
      violateCheckDrone(
        Number(drone.positionY._text),
        Number(drone.positionX._text)
      )
    ) {
      push2(violdatedDronesSerialNumbers, drone.serialNumber._text);
      let pilotInfo = await fecthViolatedPilot(drone.serialNumber._text);
      push1(violatedPilot, pilotInfo);
    }
  }
  return violatedPilot;
};

app.get("/", (req, res) => {
  res.send("<p>Hello and welcome</p>");
});

io.on("connection", (socket) => {
  console.log("a user connected");

  // socket.emit('sayhi', pilot)

  const interval = setInterval(async () => {
    let dronesDataToSendBack = await fetchDrones2();

    socket.emit("sayhi", dronesDataToSendBack);
  }, 2000);

  socket.on("disconnect", () => {
    console.log("🔥: A user disconnected");
  });
});

server.listen(PORT, () => {
  const interval = setInterval(async () => {
    const restest = await fetchDrones3();
    console.log(restest.length);
  }, 2000);
  console.log(`Server is listening on port 123 ${PORT}`);
});
