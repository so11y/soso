async function npmLogin(req, res) {
  const username = req.body.name || "any_user";

  res.json({
    token: "npm_any_token_will_work",
    ok: true,
    id: `org.couchdb.user:${username}`, // 这个就是正确的 ID 格式
    username: username,
    rev: "1-simple"
  });
}

module.exports = {
  installLoginRouter(app) {
    // npm 登录 - 任何请求都成功
    app.put("/-/user/org.couchdb.user::username", npmLogin);
  }
};
