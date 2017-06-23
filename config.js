const config = {
  development: {
    provider: 'http://localhost:8546',
    contractAddress: '0x4727d15967083f34e971d3154a51c8bb8ad73b34'
  },
  test: {
    provider: 'http://localhost:8546',
    contractAddress: '0x4727d15967083f34e971d3154a51c8bb8ad73b34'
  }
}

module.exports = config[process.env.ENV]
