import { randomUUID } from 'node:crypto'
import { Consumer } from '../src/clients/consumer'
import { stringDeserializers } from '../src/clients/serde'

const main = async () => {
  const consumer = new Consumer({
    groupId: randomUUID(),
    clientId: randomUUID(),
    bootstrapBrokers: ['serverless.warpstream.com:9092'],
    tls: {
      enableTrace: true
    },
    sasl: {
      mechanism: 'PLAIN',
      username: process.env.KAFKA_SASL_OPS_USERNAME!,
      password: process.env.KAFKA_SASL_OPS_PASSWORD!
    },
    deserializers: stringDeserializers
  })

  const stream = await consumer.consume({
    topics: ['com.superwall.events.IntegrationEvents.v1.AppStoreConnect.OpenRevenue.Errored'],
    mode: 'earliest'
  })

  stream.on('data', message => {
    console.log('!!! data', message.value)
  })

  stream.on('error', error => {
    console.error('!!! error', error)
  })

  await new Promise(resolve => setTimeout(resolve, 60000))

  await stream.close()
  await consumer.close()
}

main()
