const pool = require("../config/database");

/* =====================================================
   PUBLIC : envoyer un message au chatbot
   POST /api/chatbot/message
===================================================== */

const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        error: "Le message est obligatoire",
      });
    }

    const cleanMessage = message.toLowerCase();

    const result = await pool.query(
      "SELECT * FROM chatbot_faq WHERE actif = true"
    );

    const faqs = result.rows;

    let bestFaq = null;
    let bestScore = 0;

    for (const faq of faqs) {
      let score = 0;

      const question = faq.question ? faq.question.toLowerCase() : "";
      const keywords = faq.keywords ? faq.keywords.toLowerCase() : "";
      const categorie = faq.categorie ? faq.categorie.toLowerCase() : "";

      const words = cleanMessage
        .split(" ")
        .map((word) => word.trim())
        .filter((word) => word.length > 2);

      for (const word of words) {
        if (question.includes(word)) score += 2;
        if (keywords.includes(word)) score += 3;
        if (categorie.includes(word)) score += 1;
      }

      if (score > bestScore) {
        bestScore = score;
        bestFaq = faq;
      }
    }

    if (!bestFaq || bestScore === 0) {
      return res.json({
        reply:
          "Je n’ai pas encore la réponse exacte à cette question. Vous pouvez nous contacter directement sur WhatsApp au +212 600 368 626.",
      });
    }

    res.json({
      reply: bestFaq.reponse,
    });
  } catch (err) {
    console.error("Erreur chatbot message :", err);
    res.status(500).json({
      error: "Erreur serveur chatbot",
    });
  }
};

/* =====================================================
   ADMIN : récupérer toutes les FAQ
   GET /api/chatbot/faqs
===================================================== */

const getFaqs = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM chatbot_faq ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Erreur récupération FAQ :", err);
    res.status(500).json({
      error: "Erreur serveur",
    });
  }
};

/* =====================================================
   ADMIN : ajouter une FAQ
   POST /api/chatbot/faqs
===================================================== */

const createFaq = async (req, res) => {
  try {
    const { question, reponse, keywords, categorie } = req.body;

    if (!question || !reponse) {
      return res.status(400).json({
        error: "La question et la réponse sont obligatoires",
      });
    }

    const result = await pool.query(
      `INSERT INTO chatbot_faq (question, reponse, keywords, categorie)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [question, reponse, keywords || "", categorie || "general"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erreur ajout FAQ :", err);
    res.status(500).json({
      error: "Erreur serveur",
    });
  }
};

/* =====================================================
   ADMIN : modifier une FAQ
   PUT /api/chatbot/faqs/:id
===================================================== */

const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, reponse, keywords, categorie, actif } = req.body;

    const result = await pool.query(
      `UPDATE chatbot_faq
       SET question = $1,
           reponse = $2,
           keywords = $3,
           categorie = $4,
           actif = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        question,
        reponse,
        keywords || "",
        categorie || "general",
        actif === undefined ? true : actif,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "FAQ introuvable",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erreur modification FAQ :", err);
    res.status(500).json({
      error: "Erreur serveur",
    });
  }
};

/* =====================================================
   ADMIN : supprimer une FAQ
   DELETE /api/chatbot/faqs/:id
===================================================== */

const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM chatbot_faq WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "FAQ introuvable",
      });
    }

    res.json({
      message: "FAQ supprimée avec succès",
      faq: result.rows[0],
    });
  } catch (err) {
    console.error("Erreur suppression FAQ :", err);
    res.status(500).json({
      error: "Erreur serveur",
    });
  }
};

module.exports = {
  sendMessage,
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
};