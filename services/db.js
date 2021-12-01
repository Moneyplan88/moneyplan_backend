const mysql = require("mysql2/promise");
const config = require("../config");

const query = async (sql, params) => {
  const connection = await mysql.createConnection({
    ...config.db,
    connectionLimit: 1,
  });
  const [results] = await connection.execute(sql, params);
  return results;
};

const escape = (text) => mysql.escape(text);

module.exports = {
  query,
  escape,
};
