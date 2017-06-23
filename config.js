const config = {
  development: {
    provider: 'http://localhost:8546',
    contractAddress: '0x311abeb9236f69b22084dc82e3b789ec8ac5cd2b'
  },
  test: {
    provider: 'http://localhost:8546',
    contractAddress: '0x311abeb9236f69b22084dc82e3b789ec8ac5cd2b'
  }
}

module.exports = config[process.env.ENV]
