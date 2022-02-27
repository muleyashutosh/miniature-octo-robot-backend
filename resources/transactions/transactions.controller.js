import randToken from 'rand-token'


// dummy api.
const getAllTransaction = (req, res) => {
  const sampleData = [
    {
      name: "abcd.jpg",
      timestamp: new Date(),
      hash: randToken.uid(256)
    },
    {
      name: "abcd2.jpg",
      timestamp: new Date(),
      hash: randToken.uid(256)
    },
    {
      name: "saksham.jpg",
      timestamp: new Date(),
      hash: randToken.uid(256)
    },
    {
      name: "ashu.pdf",
      timestamp: new Date(),
      hash: randToken.uid(256)
    },
    {
      name: "monica.jpg",
      timestamp: new Date(),
      hash: randToken.uid(256)
    },
  ]

  res.json(sampleData)
}

export { getAllTransaction };