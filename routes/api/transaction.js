const express = require("express");
const router = express.Router();
const fs = require("fs");
const { body, validationResult, query } = require("express-validator");
const middleware = require("../../services/middleware");
const upload = require("../../services/multer");
const helper = require("../../helper");

const transaction = require("../../services/api/transaction.services");
const user = require("../../services/api/user.services");
const wallet = require("../../services/api/wallet.services");

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
        data: transactionOne,
      });
    }
  } catch (error) {
    res.status(500).json(helper.errorJson(500, error));
    next(error);
  }
});

router.get(
  "/user-transaction",
  middleware.verifyToken,
  async (req, res, next) => {
    const { id_transaction } = req.query;
    try {
      const userData = user.userDataJWT(req);
      if (!id_transaction) {
        // Fetch all user transaction
        const transactionListUser = await transaction.getAllUserTransaction({
          id_user: userData.id_user,
        });
        res.status(200).json({
          status: "success",
          data: transactionListUser,
        });
      } else {
        // Fetch one user transaction
        const transactionUser = await transaction.getOneUserTransaction({
          id_user: userData.id_user,
          id_transaction,
        });
        res.status(200).json({
          status: "success",
          data: transactionUser,
        });
      }
    } catch (error) {
      res.status(500).json(helper.errorJson(500, error));
      next(error);
    }
  }
);

router.post(
  "/add",
  middleware.verifyToken,
  upload.array("photo_transaction"),
  body("id_transaction_category")
    .notEmpty()
    .withMessage("id_transaction_category field required"),
  body("id_user_wallet")
    .notEmpty()
    .withMessage("id_user_wallet field required"),
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

    const {
      id_transaction_category,
      id_user_wallet,
      title,
      description,
      type,
      amount,
    } = req.body;
    try {
      let photo_transaction_filename;
      if (req.files[0]) {
        photo_transaction_filename =
          helper.generateUUID() + req.files[0].filename;
        fs.rename(
          uploadedPath,
          process.cwd() +
            "/public/data/images/transaction_photo/" +
            photo_transaction_filename,
          () => {}
        );
      } else {
        photo_transaction_filename = null;
      }

      const userData = user.userDataJWT(req);
      const resultInsert = await transaction.create({
        id_user: userData.id_user,
        id_transaction_category,
        id_user_wallet,
        title,
        description,
        type,
        amount,
        photo_transaction: photo_transaction_filename,
      });

      // Adjust Balance Wallet
      let resultAddWallet;
      if (type === "income") {
        resultAddWallet = await wallet.addBalance({
          id_user_wallet,
          balance: amount,
        });
      } else if (type === "expense") {
        resultAddWallet = await wallet.addBalance({
          id_user_wallet,
          balance: -amount,
        });
      }
      if (resultInsert.affectedRows && resultAddWallet.affectedRows) {
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
  middleware.verifyToken,
  upload.array("photo_transaction"),
  body("id_transaction")
    .notEmpty()
    .withMessage("id_transaction field required"),
  body("id_transaction_category")
    .notEmpty()
    .withMessage("id_transaction_category field required"),
  body("id_user_wallet")
    .notEmpty()
    .withMessage("id_user_wallet field required"),
  body("title").notEmpty().withMessage("title field required"),
  body("type").notEmpty().withMessage("type field required"),
  body("amount").notEmpty().withMessage("amount field required"),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      id_transaction,
      id_transaction_category,
      id_user_wallet,
      title,
      description,
      type,
      amount,
    } = req.body;
    const amountInt = parseInt(amount);
    try {
      const transactionData = await transaction.getOne(id_transaction);
      if (transactionData) {
        let photo_transaction_filename;
        if (req.files[0]) {
          photo_transaction_filename =
            helper.generateUUID() + req.files[0].filename;
          fs.rename(
            uploadedPath,
            process.cwd() +
              "/public/data/images/transaction_photo/" +
              photo_transaction_filename,
            () => {}
          );
          // Delete previous photo
          fs.unlink(
            uploadedPath,
            process.cwd() +
              "/public/data/images/transaction_photo/" +
              transactionData.photo_transaction,
            () => {}
          );
        } else {
          photo_transaction_filename = transactionData.photo_transaction;
        }

        const resultUpdateTransaction = await transaction.editWithoutPhoto({
          id_transaction,
          id_transaction_category,
          id_user_wallet,
          title,
          description,
          type,
          amount,
          photo_transaction: photo_transaction_filename,
        });

        let resultAdjustWallet;
        if (transactionData.id_user_wallet !== id_user_wallet) {
          // Change Wallet
          if (transactionData.type === "expense") {
            await wallet.addBalance({
              id_user_wallet: transactionData.id_user_wallet,
              balance: transactionData.amount,
            });
          } else if (transactionData.type === "income") {
            await wallet.addBalance({
              id_user_wallet: transactionData.id_user_wallet,
              balance: -transactionData.amount,
            });
          }
          if (type === "expense") {
            resultAdjustWallet = await wallet.addBalance({
              id_user_wallet,
              balance: -amountInt,
            });
          } else if (type === "income") {
            resultAdjustWallet = await wallet.addBalance({
              id_user_wallet,
              balance: amountInt,
            });
          }
        } else {
          // Adjust Balance Wallet
          if (transactionData.type === "expense" && type === "income") {
            // Type changing from expense to income
            resultAdjustWallet = await wallet.addBalance({
              id_user_wallet,
              balance: amountInt + transactionData.amount,
            });
          } else if (transactionData.type === "income" && type === "expense") {
            // Type changing from income to expense
            resultAdjustWallet = await wallet.addBalance({
              id_user_wallet,
              balance: -(amountInt + transactionData.amount),
            });
          } else if (type === "income") {
            // Type not changing, still income
            resultAdjustWallet = await wallet.addBalance({
              id_user_wallet,
              balance: amountInt - transactionData.amount,
            });
          } else if (type === "expense") {
            // Type not changing, still expense
            resultAdjustWallet = await wallet.addBalance({
              id_user_wallet,
              balance: -(amountInt - transactionData.amount),
            });
          }
        }

        if (
          resultUpdateTransaction.affectedRows &&
          resultAdjustWallet.affectedRows
        ) {
          res.status(200).json({
            status: "success",
          });
        }
      } else {
        res.status(500).json(helper.errorJson(404, "id_transaction not found"));
      }
    } catch (error) {
      res.status(500).json(helper.errorJson(500, error));
      next(error);
    }
  }
);

router.delete(
  "/remove",
  middleware.verifyToken,
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
      const transactionData = await transaction.getOne(id_transaction);
      if (transactionData) {
        fs.unlink(
          process.cwd() +
            "/public/data/images/transaction_photo/" +
            transactionData.photo_transaction,
          () => {}
        );
        const resultDelete = await transaction.remove(id_transaction);

        var resultAdjustWallet;
        if (transactionData.type === "income") {
          // Type not changing, still income
          resultAdjustWallet = await wallet.addBalance({
            id_user_wallet: transactionData.id_user_wallet,
            balance: -transactionData.amount,
          });
        } else if (transactionData.type === "expense") {
          // Type not changing, still expense
          resultAdjustWallet = await wallet.addBalance({
            id_user_wallet: transactionData.id_user_wallet,
            balance: transactionData.amount,
          });
        }

        if (resultDelete.affectedRows && resultAdjustWallet.affectedRows) {
          res.status(200).json({
            status: "success",
          });
        }
      } else {
        res.status(500).json(helper.errorJson(404, "id_transaction not found"));
      }
    } catch (error) {
      res.status(500).json(helper.errorJson(500, error));
      next(error);
    }
  }
);

module.exports = router;
