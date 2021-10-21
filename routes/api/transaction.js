const express = require("express");
const router = express.Router();
const fs = require("fs");
const { body, validationResult, query } = require("express-validator");
const upload = require("../../services/multer");
const helper = require("../../helper");

const transaction = require("../../services/api/transaction.services");

router.get("/", async (req, res, next) => {
  const { id_transaction } = req.query;
  try {
    if (!id_transaction) {
      // Fetch all transaction
      const transactionList = await transaction.getAll();
      res.status(200).json({
        status: "success",
        data: transactionList,
      });
    } else {
      // Fetch one by id
      const transactionOne = await transaction.getOne(id_transaction);
      res.status(200).json({
        status: "success",
        data: transactionOne[0],
      });
    }
  } catch (error) {
    res.status(500).json(helper.errorJson(500, error));
    next(error);
  }
});

router.post(
  "/add",
  upload.array("photo_transaction"),
  body("id_transaction_category")
    .notEmpty()
    .withMessage("id_transaction_category field required"),
  body("title").notEmpty().withMessage("title field required"),
  body("type").notEmpty().withMessage("type field required"),
  body("amount").notEmpty().withMessage("amount field required"),
  async (req, res, next) => {
    // Validation handler
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get uploaded path
    var uploadedPath;
    if (req.files[0]) uploadedPath = process.cwd() + "/" + req.files[0].path;

    const { id_transaction_category, title, description, type, amount } =
      req.body;
    try {
      let photo_transaction_filename =
        helper.generateUUID() + req.files[0].filename;
      fs.rename(
        uploadedPath,
        process.cwd() +
          "/public/data/images/transaction_photo/" +
          photo_transaction_filename,
        () => {}
      );
      const resultInsert = await transaction.create({
        id_transaction_category,
        title,
        description,
        type,
        amount,
        photo_transaction: photo_transaction_filename,
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
  query("id_transaction")
    .notEmpty()
    .withMessage("id_transaction query required"),
  body("id_transaction_category")
    .notEmpty()
    .withMessage("id_transaction_category field required"),
  body("title").notEmpty().withMessage("title field required"),
  body("type").notEmpty().withMessage("type field required"),
  body("amount").notEmpty().withMessage("amount field required"),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id_transaction } = req.query;
    const { id_transaction_category, title, description, type, amount } =
      req.body;
    try {
      const checkTransactionAvailable = await transaction.getOne(
        id_transaction
      );
      if (checkTransactionAvailable.length > 0) {
        const resultUpdateTransaction = await transaction.editWithoutPhoto({
          id_transaction,
          id_transaction_category,
          title,
          description,
          type,
          amount,
        });
        if (resultUpdateTransaction.affectedRows) {
          res.status(200).json({
            status: "success",
          });
        }
      }
    } catch (error) {
      res.status(500).json(helper.errorJson(500, error));
      next(error);
    }
  }
);

router.delete(
  "/remove",
  query("id_transaction")
    .notEmpty()
    .withMessage("id_transaction query required"),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id_transaction } = req.query;
    try {
      const target = await transaction.getOne(id_transaction);
      fs.unlink(
        process.cwd() +
          "/public/data/images/transaction_photo/" +
          target[0].photo_transaction,
        () => {}
      );
      const resultDelete = await transaction.remove(id_transaction);
      if (resultDelete.affectedRows) {
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

module.exports = router;
