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
    tr.id_transaction, tr.id_transaction, tr.id_transaction_category, tr.id_user_wallet,
    tr.title, tr.description, tr.type, tr.amount, tr.photo_transaction,
    trca.category_name as transaction_category,
    uswa.wallet_name,
    tr.created_at, tr.updated_at
    from transaction as tr
    inner join transaction_category as trca on trca.id_transaction_category = tr.id_transaction_category
    inner join user_wallet as uswa on uswa.id_user_wallet = tr.id_user_wallet
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
    tr.id_transaction, tr.id_transaction, tr.id_transaction_category, tr.id_user_wallet,
    tr.title, tr.description, tr.type, tr.amount, tr.photo_transaction,
    trca.category_name as transaction_category,
    uswa.wallet_name,
    tr.created_at, tr.updated_at
    from transaction as tr
    inner join transaction_category as trca on trca.id_transaction_category = tr.id_transaction_category
    inner join user_wallet as uswa on uswa.id_user_wallet = tr.id_user_wallet
    where
    tr.id_user=? and 
    tr.id_transaction=?
    order by tr.created_at desc
    `,
    [data.id_user, data.id_transaction]
  );
  return result;
};

const getAllUserTransactionByIdWallet = async (data) => {
  const result = await db.query(
    `SELECT 
    tr.id_transaction, tr.id_transaction, tr.id_transaction_category, tr.id_user_wallet,
    tr.title, tr.description, tr.type, tr.amount, tr.photo_transaction,
    trca.category_name as transaction_category,
    uswa.wallet_name,
    tr.created_at, tr.updated_at
    from transaction as tr
    inner join transaction_category as trca on trca.id_transaction_category = tr.id_transaction_category
    inner join user_wallet as uswa on uswa.id_user_wallet = tr.id_user_wallet
    where
    tr.id_user=? AND
    uswa.id_user_wallet=?
    order by tr.created_at desc
    `,
    [data.id_user, data.id_user_wallet]
  );
  return result;
};

const getAllUserTransactionTopSpending = async (data) => {
  var params_data = [];
  params_data.push(data.id_user);
  params_data.push(data.year);

  var where_month = "";
  if (data.month) {
    where_month = " and month(tr.created_at)=? ";
    params_data.push(data.month);
  }
  const result = await db.query(
    `SELECT 
    tr.id_transaction, tr.id_transaction, tr.id_transaction_category, tr.id_user_wallet,
    tr.title, tr.description, tr.type, tr.amount, tr.photo_transaction,
    trca.category_name as transaction_category,
    uswa.wallet_name,
    tr.created_at, tr.updated_at
    from transaction as tr
    inner join transaction_category as trca on trca.id_transaction_category = tr.id_transaction_category
    inner join user_wallet as uswa on uswa.id_user_wallet = tr.id_user_wallet
    where
    tr.id_user=? and
    year(tr.created_at)=?
    ${where_month}
    order by tr.amount desc
    `,
    params_data
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
  getAllUserTransactionByIdWallet,
  getAllUserTransactionTopSpending,
  create,
  edit,
  remove,
};
