const asyncHandler = require('express-async-handler');
const express = require('express');
const { startScan } = require('../controller/noble');
const { connectToDevice } = require('../controller/noble');

const router = express.Router();

// POST login
router.post(
    '/login',
    asyncHandler(async (req, res, next) => {
        if (req.body.password === process.env.CONTROLLER_PASSWORD) {
            req.session.isAuthenticated = true;
            res.status(201).json({
                success: true,
                status: 201,
                message: 'User logged in successfully',
            });
        }
    }),
);
// Post connect
router.post(
    '/connectDevice',
    asyncHandler(async (req, res, next) => {
        if (req.session.isAuthenticated) {
            const connectResult = await connectToDevice(req.body.deviceId);
            res.json(connectResult);
        }
    }),
);
// GET start scan
router.get(
    '/startScan',
    asyncHandler(async (req, res, next) => {
        if (req.session.isAuthenticated) {
            const devices = startScan();
            devices
                .then((result) => {
                    res.status(200).json({
                        success: true,
                        status: 200,
                        message: result,
                    });
                })
                .catch((error) => {
                    console.error(error);
                });
        }
    }),
);
module.exports = router;
