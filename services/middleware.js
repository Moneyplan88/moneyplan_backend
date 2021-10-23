const jwt = require("jsonwebtoken");
const config = require("../config");
const tokenSecret = config.secret_token;

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) res.status(403).json({ error: "please provide a token" });
  else {
    const tokenize = token.split(" ")[1];
    jwt.verify(
      tokenize.substring(0, 40) + tokenize.substring(40 + 15),
      tokenSecret,
      (err, value) => {
        if (err)
          res.status(500).json({ error: "failed to authenticate token" });
        req.user = value.data;
        next();
      }
    );
  }
};

module.exports = {
  verifyToken,
};
