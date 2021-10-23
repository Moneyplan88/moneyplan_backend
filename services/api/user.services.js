const db = require("../db");
const helper = require("../../helper");
const config = require("../../config");
const jwt = require("jsonwebtoken");

const userDataJWT = (req) => {
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
    photo_user: data.photo_user,
    email_verified_date: data.email_verified_date,
    dark_mode: data.dark_mode,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
  return data;
};

const userDataById = async (id_user) => {
  const userData = await db.query(`SELECT * from user where id_user=?`, [
    id_user,
  ]);
  return userData;
};

const edit = async (userOriginalData, data) => {
  const resultEdit = await db.query(
    `UPDATE user
    set
    email=?,
    password=?,
    name=?,
    photo_user=?,
    email_verified_date=?,
    dark_mode=?,
    updated_at=now()
    where
    id_user=?
    `,
    [
      data.email ?? userOriginalData.email,
      helper.ecryptSHA256(data.password),
      data.name ?? userOriginalData.name,
      data.photo_user ?? userOriginalData.photo_user,
      data.email_verified_date ?? userOriginalData.email_verified_date,
      ["on", "off"].includes(data.dark_mode)
        ? data.dark_mode
        : userOriginalData.dark_mode ?? null,
      userOriginalData.id_user,
    ]
  );
  return resultEdit;
};

module.exports = {
  userDataJWT,
  userDataById,
  edit,
};
