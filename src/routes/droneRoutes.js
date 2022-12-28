import express from 'express'
const router = express.Router()

import { fetchDrones } from '../controllers/dronesController.js'

// Fetch all products
router.route('/').get(fetchDrones)

export default router