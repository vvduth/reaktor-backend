import asyncHandler from 'express-async-handler'
import axios from 'axios';
import convert from 'xml-js'

export const DRONE_URL = "http://assignments.reaktor.com/birdnest/drones";
export const PILOT_URL = "http://assignments.reaktor.com/birdnest/pilots/";

export const fetchDrones = asyncHandler(async (req,res) => {
    const response = await axios.get(DRONE_URL, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
        },
      });
    let convertToJsondata = convert.xml2json(response.data, {
        compact: true, 
        space: 4
    })
    let allDronesInfo = JSON.parse(convertToJsondata)
    res.status(200).json(allDronesInfo.report.capture.drone)
})
