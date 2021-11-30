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
      res.status(200).json(
        helper.responseCustom({
          success: true,
          data: transactionList,
        })
      );
    } else {
      // Fetch one by id
      const transactionOne = await transaction.getOne(id_transaction);
      if (transactionOne.length) {
        res.status(200).json(
          helper.responseCustom({
            success: true,
            data: transactionOne[0],
          })
        );
      } else {
        res.status(404).json(
          helper.responseCustom({
            success: false,
            errors: {
              message: "transaction not found",
            },
          })
        );
      }
    }
  } catch (error) {
    res.status(500).json(
      helper.responseCustom({
        success: false,
        errors: error,
      })
    );
    next(error);
  }
});

router.get(
  "/user-transaction",
  middleware.verifyToken,
  async (req, res, next) => {
    const { id_transaction, id_user_wallet } = req.query;
    try {
      const userData = user.userDataJWT(req);
      if (!id_transaction) {
        if (!id_user_wallet) {
          // Fetch all user transaction
          const transactionListUser = await transaction.getAllUserTransaction({
            id_user: userData.id_user,
          });
          res.status(200).json(
            helper.responseCustom({
              success: true,
              data: transactionListUser,
            })
          );
        } else {
          // Fetch all user transaction by wallet
          const transactionListUserByWallet =
            await transaction.getAllUserTransactionByIdWallet({
              id_user: userData.id_user,
              id_user_wallet,
            });
          res.status(200).json(
            helper.responseCustom({
              success: true,
              data: transactionListUserByWallet,
            })
          );
        }
      } else {
        // Fetch one user transaction
        const transactionUser = await transaction.getOneUserTransaction({
          id_user: userData.id_user,
          id_transaction,
        });
        if (transactionUser.length) {
          res.status(200).json(
            helper.responseCustom({
              success: true,
              data: transactionUser[0],
            })
          );
        } else {
          res.status(404).json(
            helper.responseCustom({
              success: false,
              errors: {
                message: "transaction not found",
              },
            })
          );
        }
      }
    } catch (error) {
      res.status(500).json(
        helper.responseCustom({
          success: false,
          errors: error,
        })
      );
      next(error);
    }
  }
);

router.get(
  "/user-transaction-top-spending",
  middleware.verifyToken,
  query("year").notEmpty().withMessage("year required"),
  async (req, res, next) => {
    // Validation handler
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        helper.responseCustom({
          success: false,
          errors: errors.array(),
        })
      );
    }

    const { month, year } = req.query;
    try {
      const userData = user.userDataJWT(req);
      const transactionListTopSpending =
        await transaction.getAllUserTransactionTopSpending({
          id_user: userData.id_user,
          year,
          month,
        });

      res.status(200).json(
        helper.responseCustom({
          success: true,
          data: transactionListTopSpending,
        })
      );
    } catch (error) {
      res.status(500).json(
        helper.responseCustom({
          success: false,
          errors: error,
        })
      );
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
      return res.status(400).json(
        helper.responseCustom({
          success: false,
          errors: errors.array(),
        })
      );
    }

    // Get uploaded path
    var uploadedPath;
    if (req.files[0]) uploadedPath = "./" + req.files[0].path;

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
          "./public/data/images/transaction_photo/" +
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
        photo_transaction: photo_transaction_filename
          ? "data/images/transaction_photo/" + photo_transaction_filename
          : null,
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
        res.status(200).json(
          helper.responseCustom({
            success: true,
          })
        );
      }
    } catch (error) {
      res.status(500).json(
        helper.responseCustom({
          success: false,
          errors: error,
        })
      );
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
      return res.status(400).json(
        helper.responseCustom({
          success: false,
          errors: errors.array(),
        })
      );
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
      if (transactionData.length) {
        let photo_transaction_filename;
        if (req.files[0]) {
          photo_transaction_filename =
            helper.generateUUID() + req.files[0].filename;
          fs.rename(
            uploadedPath,
            "./public/data/images/transaction_photo/" +
              photo_transaction_filename,
            () => {}
          );
          // Delete previous photo
          fs.unlink(
            uploadedPath,
            "./public/" + transactionData[0].photo_transaction,
            () => {}
          );
        } else {
          photo_transaction_filename = transactionData[0].photo_transaction;
        }

        const resultUpdateTransaction = await transaction.edit({
          id_transaction,
          id_transaction_category,
          id_user_wallet,
          title,
          description,
          type,
          amount,
          photo_transaction: photo_transaction_filename
            ? "data/images/transaction_photo/" + photo_transaction_filename
            : null,
        });

        let resultAdjustWallet;
        if (transactionData[0].id_user_wallet !== id_user_wallet) {
          // Change Wallet
          if (transactionData[0].type === "expense") {
            await wallet.addBalance({
              id_user_wallet: transactionData[0].id_user_wallet,
              balance: transactionData[0].amount,
            });
          } else if (transactionData[0].type === "income") {
            await wallet.addBalance({
              id_user_wallet: transactionData[0].id_user_wallet,
              balance: -transactionData[0].amount,
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
          if (transactionData[0].type === "expense" && type === "income") {
            // Type changing from expense to income
            resultAdjustWallet = await wallet.addBalance({
              id_user_wallet,
              balance: amountInt + transactionData[0].amount,
            });
          } else if (
            transactionData[0].type === "income" &&
            type === "expense"
          ) {
            // Type changing from income to expense
            resultAdjustWallet = await wallet.addBalance({
              id_user_wallet,
              balance: -(amountInt + transactionData[0].amount),
            });
          } else if (type === "income") {
            // Type not changing, still income
            resultAdjustWallet = await wallet.addBalance({
              id_user_wallet,
              balance: amountInt - transactionData[0].amount,
            });
          } else if (type === "expense") {
            // Type not changing, still expense
            resultAdjustWallet = await wallet.addBalance({
              id_user_wallet,
              balance: -(amountInt - transactionData[0].amount),
            });
          }
        }

        if (
          resultUpdateTransaction.affectedRows &&
          resultAdjustWallet.affectedRows
        ) {
          res.status(200).json(
            helper.responseCustom({
              success: true,
            })
          );
        }
      } else {
        res.status(404).json(
          helper.responseCustom({
            success: false,
            errors: {
              message: "transaction not found",
            },
          })
        );
      }
    } catch (error) {
      res.status(500).json(
        helper.responseCustom({
          success: false,
          errors: error,
        })
      );
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
      return res.status(400).json(
        helper.responseCustom({
          success: false,
          errors: errors.array(),
        })
      );
    }
    const { id_transaction } = req.query;
    try {
      const transactionData = await transaction.getOne(id_transaction);
      if (transactionData.length) {
        fs.unlink("./public/" + transactionData[0].photo_transaction, () => {});
        const resultDelete = await transaction.remove(id_transaction);

        var resultAdjustWallet;
        if (transactionData[0].type === "income") {
          // Type not changing, still income
          resultAdjustWallet = await wallet.addBalance({
            id_user_wallet: transactionData[0].id_user_wallet,
            balance: -transactionData[0].amount,
          });
        } else if (transactionData[0].type === "expense") {
          // Type not changing, still expense
          resultAdjustWallet = await wallet.addBalance({
            id_user_wallet: transactionData[0].id_user_wallet,
            balance: transactionData[0].amount,
          });
        }

        if (resultDelete.affectedRows && resultAdjustWallet.affectedRows) {
          res.status(200).json(
            helper.responseCustom({
              success: true,
            })
          );
        }
      } else {
        res.status(404).json(
          helper.responseCustom({
            success: false,
            errors: {
              message: "transaction not found",
            },
          })
        );
      }
    } catch (error) {
      res.status(500).json(
        helper.responseCustom({
          success: false,
          errors: error,
        })
      );
      next(error);
    }
  }
);

module.exports = router;
