const express = require("express");
const router = express.Router();
const { body, validationResult, header } = require("express-validator");
const fs = require("fs");
const auth = require("../../services/api/auth.services");
const user = require("../../services/api/user.services");
const upload = require("../../services/multer");
const middleware = require("../../services/middleware");
const helper = require("../../helper");

router.get("/info", middleware.verifyToken, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(
      helper.responseCustom({
        success: false,
        errors: errors.array(),
      })
    );
  }
  try {
    const userData = user.userDataJWT(req);
    res.status(200).json(
      helper.responseCustom({
        success: true,
        data: userData,
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

router.post(
  "/edit",
  upload.array("photo_user"),
  middleware.verifyToken,
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

    // Get uploaded path
    var uploadedPath;
    if (req.files[0]) uploadedPath = "./" + req.files[0].path;

    const { email, password, name, email_verified_date, dark_mode } = req.body;
    try {
      const userData = user.userDataJWT(req);

      let photo_user_filename;
      if (req.files[0]) {
        photo_user_filename =
          helper.generateUUID() + "." + req.files[0].filename.split(".").pop();
        fs.rename(
          uploadedPath,
          "./public/data/images/user_photo/" + photo_user_filename,
          () => {}
        );
      } else {
        photo_user_filename = null;
      }

      const resultEdit = await user.edit(userData, {
        email,
        password,
        name,
        photo_user: photo_user_filename
          ? "data/images/user_photo/" + photo_user_filename
          : null,
        email_verified_date,
        dark_mode,
      });
      if (resultEdit.affectedRows) {
        const currentUserData = await user.userDataById(userData.id_user);
        const newToken = auth.generateToken(currentUserData);
        res.status(200).json(
          helper.responseCustom({
            success: true,
            data: {
              message: "Please use this new token after user update",
              token: newToken,
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
