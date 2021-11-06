const db = require("../db");
const helper = require("../../helper");
const config = require("../../config");
const nodemailer = require("../nodemailer");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const ejs = require("ejs");
const secretToken = config.secret_token;

const login = async (req) => {
  try {
    const password = helper.ecryptSHA256(req.body.password);
    const rows = await db.query(
      "select * from user where email=? and password=?",
      [req.body.email, password]
    );
    if (rows.length) {
      const token = generateToken(rows);
      return {
        status: "success",
        message: "Login success",
        token,
      };
    }
    return {
      status: "error",
      message: "Login failed",
    };
  } catch (error) {
    return helper.errorJson(500, error);
  }
};

const register = async (req) => {
  try {
    const checkEmail = await db.query(`select * from user where email=?`, [
      req.body.email,
    ]);
    if (checkEmail.length) {
      return {
        status: "error",
        message: "Email already taken",
      };
    }
    const id_user = "U" + helper.generateUUID();
    const password = helper.ecryptSHA256(req.body.password);
    const resultInsert = await db.query(
      `insert into user(id_user, email, password, name, photo_user) values (?,?,?,?,?)`,
      [
        id_user,
        req.body.email,
        password,
        req.body.name,
        req.body.photo_user ?? null,
      ]
    );
    if (!resultInsert.affectedRows) {
      return {
        status: "error",
        message: "Register failed",
      };
    }
    const rows = await db.query(
      "select * from user where email=? and password=?",
      [req.body.email, password]
    );
    const token = generateToken(rows);
    return {
      status: "success",
      message: "Register success",
      token,
    };
  } catch (error) {
    return helper.errorJson(500, error);
  }
};

const requestVerification = async (req) => {
  const checkEmail = await db.query(`select * from akun where email=?`, [
    req.body.email,
  ]);
  if (!checkEmail.length) {
    return {
      message: "Email not found",
      status: 404,
    };
  }
  // Send email and Create otp
  const kode_verif = helper.generateOTP();
  const data = await ejs.renderFile(
    process.cwd() + "/views/emails/email_verifikasi.email.ejs",
    {
      nama: checkEmail[0].nama,
      kode_verif: kode_verif,
    }
  );

  const mainOptions = {
    from: `Email from ${config.mail.MAIL_FROM_NAME}`,
    to: checkEmail[0].email,
    subject: "Kode Verifikasi",
    html: data,
  };

  try {
    const resultSentEmail = await nodemailer.transporter.sendMail(mainOptions);
    console.log("Message sent: " + resultSentEmail.response);
    return {
      data: {
        verification_code: kode_verif,
      },
      status: 200,
      message: "Request verification success",
    };
  } catch (error) {
    next(error);
    return {
      status: 500,
      message: "Request verification error, server error, plase try again",
    };
  }
};

const generateToken = (user) => {
  const token = jwt.sign({ data: user }, secretToken, { expiresIn: "24h" });
  let tokenize =
    token.substring(0, 40) +
    helper.generateUUID().slice(-15) +
    token.substring(40);
  return tokenize;
};

module.exports = {
  login,
  register,
  requestVerification,
  generateToken,
};
