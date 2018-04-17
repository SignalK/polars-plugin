const Bacon = require('baconjs')

module.exports.mapBaconjs = function (conversion, streambundle, onValue, debug) {
  const unsubscribes = []
  return unsubscribes.concat(
    timeoutingArrayStream(
      conversion.keys,
      conversion.timeouts,
      streambundle,
      unsubscribes,
      debug
    )
      .map(values => conversion.calculation.call(this, ...values))
      .onValue(onValue)
  )
}

function timeoutingArrayStream (
  keys,
  timeouts = [],
  streambundle,
  unsubscribes,
  debug
) {
  debug(`keys:${keys}`)
  debug(`timeouts:${timeouts}`)
  const lastValues = keys.reduce((acc, key) => {
    acc[key] = {
      timestamp: new Date().getTime(),
      value: null
    }
    return acc
  }, {})
  const combinedBus = new Bacon.Bus()
  keys.map(skKey => {
    streambundle.getSelfStream(skKey).onValue(value => {
      lastValues[skKey] = {
        timestamp: new Date().getTime(),
        value
      }
      const now = new Date().getTime()

      combinedBus.push(
        keys.map((key, i) => {
          return notDefined(timeouts[i]) ||
            lastValues[key].timestamp + timeouts[i] > now
            ? lastValues[key].value
            : null
        })
      )
    })
  })
  const result = combinedBus.debounceImmediate(10)
  if (debug.enabled) {
    unsubscribes.push(result.onValue(x => debug(`${keys}:${x}`)))
  }
  return result
}

const notDefined = x => typeof x === 'undefined'
const isDefined = x => typeof x !== 'undefined'
