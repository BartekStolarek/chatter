var express = require('express');
var router = express.Router();

var nickname;

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/chat', function(req, res, next) {
  if (nickname)
    res.render("chat", {nickname: nickname});
  else
    res.redirect("/");
});
router.get('/users/detail', function(req, res, next) {
  res.send('details!!!!');
});

//POST requests
router.post('/chat', function (req, res) {
  nickname = req.body.nickname;
  res.redirect('/chat');
})

module.exports = router;
