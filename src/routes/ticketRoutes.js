const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController.js");

router.get("/getAll", ticketController.getAllTickets);
router.get("/get-ticket", ticketController.getTicketByUser);
router.post("/create", ticketController.createTicket);
router.put("/update/:id", ticketController.editTicket);
router.delete("/delete/:id", ticketController.deleteTicket);

module.exports = router;
