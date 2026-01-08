const express = require('express')
const router = express.Router()

router.get("/" , function(req , res){
    res.send("Heyyy its all done")
})

module.exports = router;