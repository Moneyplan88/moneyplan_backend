const express = require("express");
const router = express.Router();
const { body, validationResult, query } = require("express-validator");
const upload = require("../../services/multer");
const helper = require("../../helper");

const transactionCategory = require("../../services/api/transaction_category.services");

router.get("/", async (req, res, next) => {
  const { id_transaction_category } = req.query;
  try {
    if (!id_transaction_category) {
      // Show All Categori
      const categoryList = await transactionCategory.getAll();
      res.status(200).json({
        status: "success",
        data: categoryList,
      });
    } else {
      // Get one only
      const categoryOne = await transactionCategory.getOne(
        id_transaction_category
      );
      res.status(200).json({
        status: "success",
        data: categoryOne[0],
      });
    }
  } catch (error) {
    res.status(500).json(helper.errorJson(500, error));
    next(error);
  }
});

router.post(
  "/add",
  upload.array(),
  body("category_name").notEmpty().withMessage("category_name field required"),
  async (req, res, next) => {
    // Validation handler
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category_name } = req.body;
    try {
      const resultInsert = await transactionCategory.create({
        category_name,
      });
      if (resultInsert.affectedRows) {
        res.status(200).json({
          status: "success",
        });
      }
    } catch (error) {
      res.status(500).json(helper.errorJson(500, error));
      next(error);
    }
  }
);

router.put(
  "/edit",
  upload.array(),
  body("id_transaction_category")
    .notEmpty()
    .withMessage("id_transaction_category field required"),
  body("category_name").notEmpty().withMessage("category_name field required"),
  async (req, res, next) => {
    // Validation handler
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_transaction_category, category_name } = req.body;
    try {
      const checkTransactionCategoryAvailable =
        await transactionCategory.getOne(id_transaction_category);

      if (checkTransactionCategoryAvailable.length > 0) {
        const resultUpdate = await transactionCategory.edit({
          id_transaction_category,
          category_name,
        });
        if (resultUpdate.affectedRows) {
          res.status(200).json({
            status: "success",
          });
        }
      } else {
        res
          .status(500)
          .json(helper.errorJson(404, "id_transaction_category not found"));
      }
    } catch (error) {
      res.status(500).json(helper.errorJson(500, error));
      next(error);
    }
  }
);

router.delete(
  "/remove",
  query("id_transaction_category")
    .notEmpty()
    .withMessage("id_transaction_category query required"),
  async (req, res, next) => {
    // Validation handler
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_transaction_category } = req.query;
    try {
      const checkTransactionCategoryAvailable =
        await transactionCategory.getOne(id_transaction_category);

      if (checkTransactionCategoryAvailable.length > 0) {
        const resultRemove = await transactionCategory.remove(
          id_transaction_category
        );
        if (resultRemove.affectedRows) {
          res.status(200).json({
            status: "success",
          });
        }
      } else {
        res
          .status(500)
          .json(helper.errorJson(404, "id_transaction_category not found"));
      }
    } catch (error) {
      res.status(500).json(helper.errorJson(500, error));
      next(error);
    }
  }
);

module.exports = router;
