const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} = require("../controllers/chatbotController");

// Route utilisée par le chatbot public
router.post("/message", sendMessage);

// Routes utilisées par l'admin
router.get("/faqs", getFaqs);
router.post("/faqs", createFaq);
router.put("/faqs/:id", updateFaq);
router.delete("/faqs/:id", deleteFaq);

module.exports = router;