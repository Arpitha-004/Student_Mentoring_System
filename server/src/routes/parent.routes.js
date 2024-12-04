const express = require("express");
const router = express.Router();
const parentController = require("../controller/parent.controller");

router.post("/create", parentController.createParent);
router.put("/update-notifications", parentController.updateNotificationPreferences);
router.get("/all", parentController.getAllParents);

module.exports = router;
