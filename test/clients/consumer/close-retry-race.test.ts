import assert from 'node:assert'
import { test } from 'node:test'
import { Consumer } from '../../../src/clients/consumer/consumer.ts'
import { type BaseOptions } from '../../../src/clients/base/types.ts'

test('Consumer - should not create new connections after close during retry', async () => {
  const bootstrapBrokers = [`localhost:${process.env.KAFKA_BROKER_PORT ?? 9092}`]

  const consumerOptions: BaseOptions = {
    clientId: 'test-close-retry-race',
    bootstrapBrokers,
    strict: true,
    retries: 3,
    retryDelay: 100
  }

  const consumer = new Consumer({
    ...consumerOptions,
    groupId: 'test-close-retry-race-group'
  })

  let connectionsAfterClose = 0
  let fetchAttempts = 0

  // Track new connections after close
  consumer.on('client:broker:connect', () => {
    if (consumer.closed) {
      connectionsAfterClose++
    }
  })

  // Track fetch attempts
  consumer.on('client:performWithRetry', (operationId: string) => {
    if (operationId === 'fetch') {
      fetchAttempts++
    }
  })

  try {
    // Use consume to join group and setup topics
    const stream = await consumer.consume({
      topics: ['test-topic']
    })

    // Close the stream
    await stream.close()

    // Start a fetch that will retry
    const fetchPromise = consumer.fetch({
      node: 999, // Non-existent node to force retry
      topics: [{
        topicId: 'test-topic-id',
        partitions: [{
          partition: 0,
          fetchOffset: 0n,
          partitionMaxBytes: 1024,
          currentLeaderEpoch: -1,
          lastFetchedEpoch: -1
        }]
      }]
    }).catch(() => {
      // Expected to fail
    })

    // Wait for first fetch attempt
    await new Promise(resolve => setTimeout(resolve, 50))

    // Close consumer while fetch is retrying
    await consumer.close()

    // Wait for any pending retries to execute
    await new Promise(resolve => setTimeout(resolve, 500))

    // The fetch should have failed
    await fetchPromise

    // Verify no new connections were created after close
    assert.strictEqual(connectionsAfterClose, 0, 'Should not create new connections after close')

    // Verify fetch was attempted but retries stopped after close
    assert.ok(fetchAttempts >= 1, 'Should have attempted at least one fetch')
  } finally {
    // Ensure consumer is closed
    if (!consumer.closed) {
      await consumer.close()
    }
  }
})

test('Consumer - should cancel pending retries on close', async () => {
  const bootstrapBrokers = [`localhost:${process.env.KAFKA_BROKER_PORT ?? 9092}`]

  const consumerOptions: BaseOptions = {
    clientId: 'test-cancel-retries',
    bootstrapBrokers,
    strict: true,
    retries: 10, // Many retries
    retryDelay: 1000 // Long delay
  }

  const consumer = new Consumer({
    ...consumerOptions,
    groupId: 'test-cancel-retries-group'
  })

  let retryCount = 0

  // Track retry attempts
  consumer.on('client:performWithRetry', (operationId: string, attempt: number) => {
    if (operationId === 'fetch' && attempt > 0) {
      retryCount++
    }
  })

  try {
    // Use consume to join group and setup topics
    const stream = await consumer.consume({
      topics: ['test-topic']
    })

    // Close the stream
    await stream.close()

    // Start a fetch that will retry
    const fetchPromise = consumer.fetch({
      node: 999, // Non-existent node to force retry
      topics: [{
        topicId: 'test-topic-id',
        partitions: [{
          partition: 0,
          fetchOffset: 0n,
          partitionMaxBytes: 1024,
          currentLeaderEpoch: -1,
          lastFetchedEpoch: -1
        }]
      }]
    }).catch(() => {
      // Expected to fail
    })

    // Wait for first attempt
    await new Promise(resolve => setTimeout(resolve, 50))

    // Close consumer - this should cancel pending retries
    const closeStart = Date.now()
    await consumer.close()
    const closeTime = Date.now() - closeStart

    // The fetch should have failed quickly
    await fetchPromise

    // Close should be fast (not waiting for retries)
    assert.ok(closeTime < 500, `Close should be fast, took ${closeTime}ms`)

    // Should not have many retries
    assert.ok(retryCount <= 1, `Should have at most 1 retry, got ${retryCount}`)
  } finally {
    // Ensure consumer is closed
    if (!consumer.closed) {
      await consumer.close()
    }
  }
})