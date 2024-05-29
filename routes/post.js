const asyncHandler = require('express-async-handler');
const express = require('express');
const { startScan } = require('../controller/nobleTest');

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
// GET start scan
router.get(
    '/startScan',
    asyncHandler(async (req, res, next) => {
        if (req.session.isAuthenticated) {
            const result = startScan();
            console.log(result);
        }
    }),
);
module.exports = router;
