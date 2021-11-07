const express = require("express");
const router = express.Router();
const { body, validationResult, header } = require("express-validator");
const auth = require("../../services/api/auth.services");
const upload = require("../../services/multer");
const helper = require("../../helper");

router.post(
  "/login",
  upload.array(),
  body("email")
    .notEmpty()
    .withMessage("email field required")
    .isEmail()
    .withMessage("email field must be an email"),
  body("password").notEmpty().withMessage("password field required"),
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

    const { email, password } = req.body;
    try {
      const resultLogin = await auth.login({ email, password });
      const token = auth.generateToken(resultLogin);
      if (resultLogin.length) {
        res.status(200).json(
          helper.responseCustom({
            success: true,
            data: {
              token,
            },
          })
        );
      } else {
        res.status(500).json(
          helper.responseCustom({
            success: false,
            errors: {
              message: "Login failed",
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
  "/register",
  upload.array(),
  body("email")
    .notEmpty()
    .withMessage("email field required")
    .isEmail()
    .withMessage("email field must be and email"),
  body("password").notEmpty().withMessage("password field required"),
  body("name").notEmpty().withMessage("name field required"),
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

    const { email, name, password } = req.body;
    try {
      const checkEmail = await auth.checkEmail(email);
      if (checkEmail.length) {
        res.status(200).json(
          helper.responseCustom({
            success: false,
            errors: {
              message: "Email already in use",
            },
          })
        );
        return;
      }
      const resultRegister = await auth.register({ email, name, password });
      if (resultRegister.affectedRows) {
        const resultLogin = await auth.login({ email, password });
        const token = auth.generateToken(resultLogin);
        if (resultLogin.length) {
          res.status(200).json(
            helper.responseCustom({
              success: true,
              data: {
                token,
              },
            })
          );
        }
      } else {
        res.status(500).json(
          helper.responseCustom({
            success: false,
            errors: {
              message: "Register failed",
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
  "/request_email_verification",
  upload.array(),
  body("email")
    .notEmpty()
    .withMessage("Email field required")
    .isEmail()
    .withMessage("Email field must be an email"),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      res.json(await auth.requestVerification(req));
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
