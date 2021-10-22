const db = require("../db");
const helper = require("../../helper");
const config = require("../../config");
const nodemailer = require("../nodemailer");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const ejs = require("ejs");
const secretToken = config.secret_token;

const login = async (req) => {
  const password = helper.ecryptSHA256(req.body.password);
  const rows = await db.query(
    "select * from user where email=? and password=?",
    [req.body.email, password]
  );
  if (rows) {
    const token = generateToken(rows);
    let tokenize =
      token.substring(0, 40) +
      helper.generateUUID().slice(-15) +
      token.substring(40);
    return {
      message: "Login success",
      token: tokenize,
    };
  }
  return {
    message: "Login failed",
  };
};

const register = async (req) => {
  const checkEmail = await db.query(`select * from user where email=?`, [
    req.body.email,
  ]);
  if (checkEmail.length) {
    return {
      message: "Email already taken",
    };
  }
  const id_user = "U" + helper.generateUUID();
  const password = helper.ecryptSHA256(req.body.password);
  const resultInsert = await db.query(
    `insert into user(id_user, email, password, name, photo_link) values (?,?,?,?,?)`,
    [
      id_user,
      req.body.email,
      password,
      req.body.name,
      req.body.photo_link ?? null,
    ]
  );
  if (!resultInsert.affectedRows) {
    return {
      message: "Register failed",
    };
  }
  const rows = await db.query(
    "select * from user where email=? and password=?",
    [req.body.email, password]
  );
  const token = generateToken(rows);
  let tokenize =
    token.substring(0, 40) +
    helper.generateUUID().slice(-15) +
    token.substring(40);
  return {
    message: "Register success",
    token: tokenize,
  };
};

const userData = (req) => {
  const bearerString = req.headers.authorization;
  const token = bearerString.split(" ")[1];
  var data = null;
  jwt.verify(
    token.substring(0, 40) + token.substring(40 + 15),
    config.secret_token,
    (err, value) => {
      data = value.data[0];
    }
  );
  data = {
    id_user: data.id_user,
    email: data.email,
    name: data.name,
    photo_link: data.photo_link,
    email_verified_date: data.email_verified_date,
    dark_mode: data.dark_mode,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
  return {
    data,
  };
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
  return jwt.sign({ data: user }, secretToken, { expiresIn: "24h" });
};

module.exports = {
  login,
  register,
  userData,
  requestVerification,
};
