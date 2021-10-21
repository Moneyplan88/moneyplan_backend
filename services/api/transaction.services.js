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
  const result = await db.query(`SELECT 
  tr.*
  from transaction as tr
  `);
  return result;
};

const create = async (data) => {
  const id_transaction = "TR" + helper.generateUUID();
  const resultCreate = await db.query(
    `INSERT into transaction
    (id_transaction, id_transaction_category, title, description, type, amount, photo_transaction)
    values (?,?,?,?,?,?,?)
  `,
    [
      id_transaction,
      data.id_transaction_category,
      data.title,
      data.description ?? null,
      data.type,
      data.amount,
      data.photo_transaction ?? null,
    ]
  );
  return resultCreate;
};

const editWithoutPhoto = async (data) => {
  const resultEdit = await db.query(
    `UPDATE transaction
    set
    id_transaction_category=?,
    title=?,
    description=?,
    type=?,
    amount=?
    where
    id_transaction=?
    `,
    [
      data.id_transaction_category,
      data.title,
      data.description ?? null,
      data.type,
      data.amount,
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
  create,
  editWithoutPhoto,
  remove,
};
