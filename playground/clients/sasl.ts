import { Base } from '../../src/index.ts'

async function main () {
  const client = new Base({
    clientId: 'clientId',
    groupId: 'groupId',
    bootstrapBrokers: ['localhost:9095'],
    sasl: {
      mechanism: 'SCRAM-SHA-256',
      username: 'admin',
      password: 'admin'
    },
    retries: 0
  })

  console.log(await client.metadata({ topics: [] }))

  await client.close()
}

await main()
