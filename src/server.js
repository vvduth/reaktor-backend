import express from "express";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import convert from "xml-js";

export const DRONE_URL = "http://assignments.reaktor.com/birdnest/drones";

export let violdatedDronesSerialNumbers = [];
export let violatedPilot = [];
let filterPilotsArray = [];
let closestDistance = null;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

function push1(array, item, x, y) {
  if (!array.find(({ pilotId }) => pilotId === item.pilotId)) {
    array.push({ ...item, validUntil: Date.now() + 60000 * 10, x: x, y: y });
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

export const distance = (x_pos, y_pos) => {
  let a = (x_pos - 250000) * (x_pos - 250000);
  let b = (y_pos - 250000) * (y_pos - 250000);
  return Math.sqrt(a + b);
};

const PORT = 5000 || process.env.PORT;

export const fecthViolatedPilot = async (serialNum) => {
  try {
    const res = await axios.get(
      `http://assignments.reaktor.com/birdnest/pilots/` + serialNum
    );
    return res.data;
  } catch (e) {
    console.log(e);
    return e;
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
    if (closestDistance === null) {
      closestDistance = distance(
        Number(drone.positionY._text),
        Number(drone.positionX._text)
      );
    } else {
      if (
        distance(Number(drone.positionY._text), Number(drone.positionX._text)) <
        closestDistance
      ) {
        closestDistance = distance(
          Number(drone.positionY._text),
          Number(drone.positionX._text)
        );
      }
    }
    if (
      !violateCheckDrone(
        Number(drone.positionY._text),
        Number(drone.positionX._text)
      )
    ) {
      let pilotInfo = await fecthViolatedPilot(drone.serialNumber._text);
      push1(
        violatedPilot,
        pilotInfo,
        drone.positionX._text,
        drone.positionY._text
      );
      filterPilotsArray = violatedPilot.filter(
        (pilot) => Number(pilot.validUntil) - Number(Date.now()) > 1
      );
    }
  }

  return filterPilotsArray;
};

app.get("/", (req, res) => {
  res.send("<p>Hello and welcome</p>");
});

io.on("connection", (socket) => {
  console.log("a user connected");

  const interval = setInterval(async () => {
    socket.emit("sayhi", filterPilotsArray);
    socket.emit("closetDistance", closestDistance);
  }, 2000);

  socket.on("disconnect", () => {
    console.log("🔥: A user disconnected");
  });

  return () => clearInterval(interval);
});

server.listen(PORT, () => {
  const updateEvery2Secs = async () => {
    try {
      await fetchDrones3();
    } catch (e) {
      console.log("overload");
    } finally {
      // do it again in 2 seconds
      setTimeout(updateEvery2Secs, 2000);
    }
  };
  updateEvery2Secs();
  console.log(`Server is listening on port ${PORT}`);
});
