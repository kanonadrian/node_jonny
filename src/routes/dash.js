const express = require('express');
const router = express.Router();

const pool = require('../database');

router.get('/dash', (req, res) =>{
    res.render('dash/dash');
});

module.exports = router;