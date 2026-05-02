function getHello(req, res) {
  res.json({ message: 'backend ok' });
}

module.exports = {
  getHello
};
