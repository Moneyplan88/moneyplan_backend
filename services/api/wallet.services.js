const db = require("../db");
const helper = require("../../helper");
const config = require("../../config");

const selfWallet = async (id_user) => {
  const result = await db.query(
    `SELECT * from user_wallet where id_user=?
    ORDER BY created_at asc`,
    [id_user]
  );
  return result;
};

const getWalletById = async (id_user_wallet) => {
  const result = await db.query(
    `SELECT * from user_wallet where id_user_wallet=?`,
    [id_user_wallet]
  );
  return result[0];
};

const create = async (data) => {
  const resultInsert = await db.query(
    `INSERT into user_wallet(id_user_wallet, id_user, wallet_name, balance)
    values (?,?,?,?)`,
    [
      "UW" + helper.generateUUID(),
      data.id_user,
      data.wallet_name,
      data.balance ?? 0,
    ]
  );
  return resultInsert;
};

const edit = async (data) => {
  const resultUpdate = await db.query(
    `UPDATE user_wallet
    set
    wallet_name=?,
    balance=?,
    updated_at=now()
    where
    id_user_wallet=?
    `,
    [data.wallet_name, data.balance, data.id_user_wallet]
  );
  return resultUpdate;
};

const addBalance = async (data) => {
  const resultUpdate = await db.query(
    `UPDATE user_wallet
    set
    balance=balance+?,
    updated_at=now()
    where
    id_user_wallet=?
    `,
    [data.balance ?? 0, data.id_user_wallet]
  );
  return resultUpdate;
};

const remove = async (data) => {
  const resultDelete = await db.query(
    `DELETE from user_wallet where id_user_wallet=? and id_user=?`,
    [data.id_user_wallet, data.id_user]
  );
  return resultDelete;
};

module.exports = {
  selfWallet,
  getWalletById,
  create,
  edit,
  addBalance,
  remove,
};
