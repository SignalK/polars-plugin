const assert = require('assert')

const testPolarData = {
  trueWindAngles: [0.9, 1.0, 1.1],
  polarData: [
    {
      trueWindSpeed: 3,
      polarSpeeds: [2, 2.1, 2.15]
    },
    {
      trueWindSpeed: 4,
      polarSpeeds: [2.1, 2.2, 2.25]
    },

    {
      trueWindSpeed: 5,
      polarSpeeds: [3, 3.3, 3.25]
    }
  ]
}

const getTargetSpeed = require(
  '../src/performancecalculations'
).polarSpeedFromPolars(testPolarData)

describe('Target speed calculation', () => {
  it('Out of range values return undefined', () => {
    assert.strictEqual(getTargetSpeed(2.5, 1), undefined)
    assert.strictEqual(getTargetSpeed(5.1, 1), undefined)
    assert.strictEqual(getTargetSpeed(4.2, 0.1), undefined)
    assert.strictEqual(getTargetSpeed(4.2, 1.2), undefined)
  })
  it('Exact combinations return exact values', () => {
    assert.equal(getTargetSpeed(4, 1), 2.2)
    assert.equal(getTargetSpeed(3, 0.9), 2)
  })
  it('Real test cases', () => {
    assert.equal(getTargetSpeed(3, 0.95), 2.05)
    assert(getTargetSpeed(4.5, 0.9) - (2.1 + 0.9 / 2) <.0000001)
  })
})
