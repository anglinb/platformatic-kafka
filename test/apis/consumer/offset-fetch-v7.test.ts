import { deepStrictEqual, ok, throws } from 'node:assert'
import test from 'node:test'
import { offsetFetchV7, Reader, ResponseError, Writer } from '../../../src/index.ts'

const { createRequest, parseResponse } = offsetFetchV7

test('createRequest serializes basic parameters correctly', () => {
  const groups = [
    {
      groupId: 'test-group',
      memberId: null,
      memberEpoch: -1,
      topics: [
        {
          name: 'test-topic',
          partitionIndexes: [0, 1]
        }
      ]
    }
  ]
  const requireStable = false

  const writer = createRequest(groups, requireStable)

  // Verify it returns a Writer
  ok(writer instanceof Writer)

  // Read the serialized data to verify correctness
  const reader = Reader.from(writer)

  // Read groups array (non-compact)
  const groupsArray = reader.readArray(() => {
    const groupId = reader.readString(false)

    // Read topics array (non-compact)
    const topics = reader.readArray(() => {
      const topicName = reader.readString(false)

      // Read partition indexes array (non-compact)
      const partitionIndexes = reader.readArray(() => reader.readInt32(), false, false)

      return { topicName, partitionIndexes }
    }, false, false)

    return { groupId, topics }
  }, false, false)

  // Verify array length
  deepStrictEqual(groupsArray.length, 1)

  // Verify group data
  deepStrictEqual(groupsArray[0].groupId, 'test-group')

  // Verify topics array
  deepStrictEqual(groupsArray[0].topics.length, 1)
  deepStrictEqual(groupsArray[0].topics[0].topicName, 'test-topic')

  // Verify partition indexes
  deepStrictEqual(groupsArray[0].topics[0].partitionIndexes, [0, 1])

  // Verify requireStable flag
  const requireStableFlag = reader.readBoolean()
  deepStrictEqual(requireStableFlag, false)
})

test('createRequest with requireStable flag set to true', () => {
  const groupId = 'test-group'
  const topics = [
    {
      name: 'test-topic',
      partitionIndexes: [0]
    }
  ]

  // Create a request with requireStable=true
  const groups1 = [
    {
      groupId,
      memberId: null,
      memberEpoch: -1,
      topics
    }
  ]
  const writer1 = createRequest(groups1, true)

  // Create a second request with requireStable=false for comparison
  const groups2 = [
    {
      groupId,
      memberId: null,
      memberEpoch: -1,
      topics
    }
  ]
  const writer2 = createRequest(groups2, false)

  // Verify both return Writer instances
  ok(writer1 instanceof Writer, 'Should return a Writer instance')
  ok(writer2 instanceof Writer, 'Should return a Writer instance')

  // The data should be identical except for the last boolean
  const buf1 = writer1.buffer
  const buf2 = writer2.buffer

  // All bytes except the last should be the same
  deepStrictEqual(buf1.slice(0, -1), buf2.slice(0, -1))

  // The last byte should be different (true vs false)
  deepStrictEqual(buf1[buf1.length - 1], 1) // true
  deepStrictEqual(buf2[buf2.length - 1], 0) // false
})

test('createRequest with multiple groups and topics', () => {
  const groups = [
    {
      groupId: 'group-1',
      memberId: null,
      memberEpoch: -1,
      topics: [
        {
          name: 'topic-1',
          partitionIndexes: [0, 1, 2]
        },
        {
          name: 'topic-2',
          partitionIndexes: [3, 4]
        }
      ]
    },
    {
      groupId: 'group-2',
      memberId: null,
      memberEpoch: -1,
      topics: [
        {
          name: 'topic-3',
          partitionIndexes: [5]
        }
      ]
    }
  ]

  const writer = createRequest(groups, false)
  ok(writer instanceof Writer)

  // Read back the data to verify
  const reader = Reader.from(writer)

  const groupsArray = reader.readArray(() => {
    const groupId = reader.readString(false)
    const topics = reader.readArray(() => {
      const topicName = reader.readString(false)
      const partitionIndexes = reader.readArray(() => reader.readInt32(), false, false)
      return { topicName, partitionIndexes }
    }, false, false)
    return { groupId, topics }
  }, false, false)

  deepStrictEqual(groupsArray.length, 2)

  // Verify first group
  deepStrictEqual(groupsArray[0].groupId, 'group-1')
  deepStrictEqual(groupsArray[0].topics.length, 2)
  deepStrictEqual(groupsArray[0].topics[0].topicName, 'topic-1')
  deepStrictEqual(groupsArray[0].topics[0].partitionIndexes, [0, 1, 2])
  deepStrictEqual(groupsArray[0].topics[1].topicName, 'topic-2')
  deepStrictEqual(groupsArray[0].topics[1].partitionIndexes, [3, 4])

  // Verify second group
  deepStrictEqual(groupsArray[1].groupId, 'group-2')
  deepStrictEqual(groupsArray[1].topics.length, 1)
  deepStrictEqual(groupsArray[1].topics[0].topicName, 'topic-3')
  deepStrictEqual(groupsArray[1].topics[0].partitionIndexes, [5])
})

test('parseResponse with successful response', () => {
  const writer = Writer.create()

  // Write throttle time
  writer.appendInt32(100)

  // Write groups array (non-compact)
  writer.appendInt32(1) // array length

  // Group 1
  writer.appendInt16('test-group'.length) // string length
  writer.appendString('test-group', false)

  // Topics array
  writer.appendInt32(1) // array length

  // Topic 1
  writer.appendInt16('test-topic'.length) // string length
  writer.appendString('test-topic', false)

  // Partitions array
  writer.appendInt32(2) // array length

  // Partition 0
  writer
    .appendInt32(0) // partitionIndex
    .appendInt64(100n) // committedOffset
    .appendInt32(5) // committedLeaderEpoch
    .appendString('metadata-0', false) // metadata
    .appendInt16(0) // errorCode

  // Partition 1
  writer
    .appendInt32(1) // partitionIndex
    .appendInt64(200n) // committedOffset
    .appendInt32(6) // committedLeaderEpoch
    .appendString(null, false) // metadata (null)
    .appendInt16(0) // errorCode

  // Group error code
  writer.appendInt16(0) // errorCode

  const reader = Reader.from(writer.buffer)
  const response = parseResponse(1, 9, 7, reader)

  deepStrictEqual(response.throttleTimeMs, 100)
  deepStrictEqual(response.groups.length, 1)

  const group = response.groups[0]
  deepStrictEqual(group.groupId, 'test-group')
  deepStrictEqual(group.errorCode, 0)
  deepStrictEqual(group.topics.length, 1)

  const topic = group.topics[0]
  deepStrictEqual(topic.name, 'test-topic')
  deepStrictEqual(topic.partitions.length, 2)

  deepStrictEqual(topic.partitions[0], {
    partitionIndex: 0,
    committedOffset: 100n,
    committedLeaderEpoch: 5,
    metadata: 'metadata-0',
    errorCode: 0
  })

  deepStrictEqual(topic.partitions[1], {
    partitionIndex: 1,
    committedOffset: 200n,
    committedLeaderEpoch: 6,
    metadata: null,
    errorCode: 0
  })
})

test('parseResponse with group error throws ResponseError', () => {
  const writer = Writer.create()

  writer.appendInt32(0) // throttleTimeMs
  writer.appendInt32(1) // groups array length

  // Group with error
  writer.appendInt16('error-group'.length)
  writer.appendString('error-group', false)
  writer.appendInt32(0) // topics array (empty)
  writer.appendInt16(25) // GROUP_AUTHORIZATION_FAILED

  const reader = Reader.from(writer.buffer)

  throws(
    () => parseResponse(1, 9, 7, reader),
    (err: ResponseError) => {
      ok(err instanceof ResponseError)
      deepStrictEqual(err.apiKey, 9)
      deepStrictEqual(err.apiVersion, 7)
      deepStrictEqual(err.errors, { '/groups/0': 25 })
      return true
    }
  )
})

test('parseResponse with partition error throws ResponseError', () => {
  const writer = Writer.create()

  writer.appendInt32(0) // throttleTimeMs
  writer.appendInt32(1) // groups array length

  // Group
  writer.appendInt16('test-group'.length)
  writer.appendString('test-group', false)

  // Topics array
  writer.appendInt32(1) // array length

  // Topic
  writer.appendInt16('test-topic'.length)
  writer.appendString('test-topic', false)

  // Partitions array
  writer.appendInt32(1) // array length

  // Partition with error
  writer
    .appendInt32(0) // partitionIndex
    .appendInt64(-1n) // committedOffset
    .appendInt32(-1) // committedLeaderEpoch
    .appendString(null, false) // metadata
    .appendInt16(3) // UNKNOWN_TOPIC_OR_PARTITION

  // Group error code
  writer.appendInt16(0) // no error

  const reader = Reader.from(writer.buffer)

  throws(
    () => parseResponse(1, 9, 7, reader),
    (err: ResponseError) => {
      ok(err instanceof ResponseError)
      deepStrictEqual(err.apiKey, 9)
      deepStrictEqual(err.apiVersion, 7)
      deepStrictEqual(err.errors, { '/groups/0/topics/0/partitions/0': 3 })
      return true
    }
  )
})
