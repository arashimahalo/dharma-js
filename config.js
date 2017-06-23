const config = {
  development: {
    provider: 'http://localhost:8546',
    contractAddress: '0xd39b476776f3d0a05bd7f6e19e3570bc89bedb34'
  },
  test: {
    provider: 'http://localhost:8546',
    contractAddress: '0xd39b476776f3d0a05bd7f6e19e3570bc89bedb34'
  }
}

module.exports = config[process.env.ENV]
