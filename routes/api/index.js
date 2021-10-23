const express = require("express");
const router = express.Router();

const booksRouter = require("./books");
const authRouter = require("./auth");
const akunRouter = require("./akun");
const phoneRouter = require("./phone");
const transactionRouter = require("./transaction");
const transactionCategoryRouter = require("./transaction_category");
const userRouter = require("./user");
const walletRouter = require("./wallet");

router.use("/books", booksRouter);
router.use("/auth", authRouter);
router.use("/akun", akunRouter);
router.use("/phone", phoneRouter);
router.use("/transaction", transactionRouter);
router.use("/transaction_category", transactionCategoryRouter);
router.use("/user", userRouter);
router.use("/wallet", walletRouter);

router.get("/", (req, res, next) => {
  res.send("Welcome to the api");
});

module.exports = router;
