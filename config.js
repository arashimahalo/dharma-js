const config = {
  development: {
    provider: 'http://localhost:8546',
    contractAddress: '0x7aadb181680c6c8ed7512986b00a5dd12bfac272'
  },
  test: {
    provider: 'http://localhost:8546',
    contractAddress: '0x7aadb181680c6c8ed7512986b00a5dd12bfac272'
  }
}

module.exports = config[process.env.ENV]
