const db = require("../db");
const helper = require("../../helper");
const config = require("../../config");

const getAll = async () => {
  const result = await db.query(`SELECT 
  tr.*
  from transaction as tr
  `);
  return result;
};

const getOne = async (id_transaction) => {
  const result = await db.query(
    `SELECT 
    tr.*
    from transaction as tr
    where
    tr.id_transaction=?
    `,
    [id_transaction]
  );
  return result;
};

const getAllUserTransaction = async (data) => {
  const result = await db.query(
    `SELECT 
    tr.*
    from transaction as tr
    where
    tr.id_user=?
    order by tr.created_at desc
    `,
    [data.id_user]
  );
  return result;
};

const getOneUserTransaction = async (data) => {
  const result = await db.query(
    `SELECT 
    tr.*
    from transaction as tr
    where
    tr.id_user=? and 
    tr.id_transaction=?
    order by tr.created_at desc
    `,
    [data.id_user, data.id_transaction]
  );
  return result;
};

const create = async (data) => {
  const id_transaction = "TR" + helper.generateUUID();
  const resultCreate = await db.query(
    `INSERT into transaction
    (id_transaction, id_user, id_transaction_category, id_user_wallet, title, description, type, amount, photo_transaction)
    values (?,?,?,?,?,?,?,?,?)
  `,
    [
      id_transaction,
      data.id_user,
      data.id_transaction_category,
      data.id_user_wallet,
      data.title,
      data.description ?? null,
      data.type,
      data.amount,
      data.photo_transaction ?? null,
    ]
  );
  return resultCreate;
};

const edit = async (data) => {
  const resultEdit = await db.query(
    `UPDATE transaction
    set
    id_transaction_category=?,
    id_user_wallet=?,
    title=?,
    description=?,
    type=?,
    amount=?,
    photo_transaction=?,
    updated_at=now()
    where
    id_transaction=?
    `,
    [
      data.id_transaction_category,
      data.id_user_wallet,
      data.title,
      data.description ?? null,
      data.type,
      data.amount,
      data.photo_transaction,
      data.id_transaction,
    ]
  );
  return resultEdit;
};

const remove = async (id_transaction) => {
  const resultDelete = await db.query(
    `DELETE from transaction where id_transaction=?`,
    [id_transaction]
  );
  return resultDelete;
};

module.exports = {
  getAll,
  getOne,
  getAllUserTransaction,
  getOneUserTransaction,
  create,
  edit,
  remove,
};
