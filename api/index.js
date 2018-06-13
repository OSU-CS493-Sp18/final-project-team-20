const router = module.exports = require('express').Router();

router.use('/users', require('./users').router);

router.use('/ecu', require('./ecu').router);
router.use('/gps', require('./gps').router);
router.use('/accelerometer', require('./accelerometer').router);