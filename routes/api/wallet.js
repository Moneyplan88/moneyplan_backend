const express = require("express");
const router = express.Router();
const { body, validationResult, query } = require("express-validator");
const middleware = require("../../services/middleware");
const upload = require("../../services/multer");
const helper = require("../../helper");
const wallet = require("../../services/api/wallet.services");
const user = require("../../services/api/user.services");

router.get("/self-wallet", middleware.verifyToken, async (req, res, next) => {
  try {
    const userData = user.userDataJWT(req);
    const selfWallet = await wallet.selfWallet(userData.id_user);
    res.status(200).json(
      helper.responseCustom({
        success: true,
        data: selfWallet,
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
});

router.get("/total-balance", middleware.verifyToken, async (req, res, next) => {
  try {
    const userData = user.userDataJWT(req);
    const selfWallet = await wallet.selfWallet(userData.id_user);
    let total_balance = 0;
    let wallet_list = [];
    selfWallet.forEach((item) => {
      total_balance += item.balance;
      wallet_list.push(item.wallet_name);
    });
    res.status(200).json(
      helper.responseCustom({
        success: true,
        data: {
          total_balance,
          wallet_list,
        },
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
});

router.get(
  "/info",
  middleware.verifyToken,
  query("id_user_wallet")
    .notEmpty()
    .withMessage("id_user_wallet query required"),
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

    const { id_user_wallet } = req.query;
    try {
      const walletData = await wallet.getWalletById(id_user_wallet);
      if (walletData.length) {
        res.status(200).json({
          status: "success",
          data: walletData[0],
        });
      } else {
        res.status(404).json(
          helper.responseCustom({
            success: false,
            errors: {
              message: "wallet not found",
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

router.post(
  "/add",
  upload.array(),
  middleware.verifyToken,
  body("wallet_name").notEmpty().withMessage("wallet_name field required"),
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

    const { wallet_name, balance } = req.body;
    try {
      const userData = user.userDataJWT(req);
      const resultInsert = await wallet.create({
        id_user: userData.id_user,
        wallet_name,
        balance,
      });
      if (resultInsert.affectedRows) {
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
      f;
      next(error);
    }
  }
);

router.put(
  "/edit",
  upload.array(),
  middleware.verifyToken,
  body("id_user_wallet")
    .notEmpty()
    .withMessage("id_user_wallet field required"),
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

    const { id_user_wallet, wallet_name, balance } = req.body;
    try {
      const dataWalletOriginal = await wallet.getWalletById(id_user_wallet);
      const resultUpdate = await wallet.edit({
        id_user_wallet,
        wallet_name: wallet_name ?? dataWalletOriginal.wallet_name,
        balance: balance ?? dataWalletOriginal.balance,
      });
      if (resultUpdate.affectedRows) {
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
  "/add-balance",
  upload.array(),
  middleware.verifyToken,
  body("id_user_wallet")
    .notEmpty()
    .withMessage("id_user_wallet field required"),
  body("balance").notEmpty().withMessage("balance field required"),
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

    const { id_user_wallet, balance } = req.body;
    try {
      const resultAddBalance = await wallet.addBalance({
        id_user_wallet,
        balance,
      });
      if (resultAddBalance.affectedRows) {
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

router.delete(
  "/remove",
  middleware.verifyToken,
  query("id_user_wallet")
    .notEmpty()
    .withMessage("id_user_wallet query required"),
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

    const { id_user_wallet } = req.query;
    try {
      const userData = user.userDataJWT(req);
      const resultRemove = await wallet.remove({
        id_user_wallet,
        id_user: userData.id_user,
      });
      if (resultRemove.affectedRows) {
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

module.exports = router;
