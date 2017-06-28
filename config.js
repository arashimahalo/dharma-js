const config = {
  development: {
    provider: 'http://localhost:8546',
    contractAddress: '0xc94dde4294727fb9f2a96794b8dda4415a7c96c5'
  },
  test: {
    provider: 'http://localhost:8546',
    contractAddress: '0xc94dde4294727fb9f2a96794b8dda4415a7c96c5'
  }
}

module.exports = config[process.env.ENV]
