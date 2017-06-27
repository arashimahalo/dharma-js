const config = {
  development: {
    provider: 'http://localhost:8546',
    contractAddress: '0xa470eb3ab9db02cf36af36ce68d2089a82cd8962'
  },
  test: {
    provider: 'http://localhost:8546',
    contractAddress: '0xa470eb3ab9db02cf36af36ce68d2089a82cd8962'
  }
}

module.exports = config[process.env.ENV]
