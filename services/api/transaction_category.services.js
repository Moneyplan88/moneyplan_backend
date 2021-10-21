const db = require("../db");
const helper = require("../../helper");
const config = require("../../config");

const getAll = async () => {
  const result = await db.query(`select * from transaction_category`);
  return result;
};

const getOne = async (id_transaction_category) => {
  const result = await db.query(
    `select * from transaction_category where id_transaction_category=?`,
    [id_transaction_category]
  );
  return result;
};

const create = async (data) => {
  const id_transaction_category = "TRCT" + helper.generateUUID();
  const resultInsert = await db.query(
    `INSERT into transaction_category (id_transaction_category, category_name)
    values (?,?)`,
    [id_transaction_category, data.category_name]
  );
  return resultInsert;
};

const edit = async (data) => {
  const resultEdit = await db.query(
    `UPDATE transaction_category
    set
    category_name=?,
    updated_at=now()
    where
    id_transaction_category=?
    `,
    [data.category_name, data.id_transaction_category]
  );
  return resultEdit;
};

const remove = async (id_transaction_category) => {
  const resultDelete = await db.query(
    `DELETE from transaction_category
    where id_transaction_category=?`,
    [id_transaction_category]
  );
  return resultDelete;
};

module.exports = {
  getAll,
  getOne,
  create,
  edit,
  remove,
};
