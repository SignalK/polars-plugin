const debug = require('debug')('signalk:performance')

module.exports.polarSpeedFromPolars = function ({ trueWindAngles, polarData }) {
  return (tws, twa) => {
    if (
      twa < trueWindAngles[0] ||
      twa > trueWindAngles[trueWindAngles.length - 1] ||
      tws < polarData[0].trueWindSpeed ||
      tws > polarData[polarData.length - 1].trueWindSpeed
    ) {
      return undefined
    }

    const twaIndex = Math.max(0, trueWindAngles.findIndex(ttwa => ttwa > twa) - 1)
    const twsIndex = Math.max(0, polarData.findIndex(data => data.trueWindSpeed > tws) - 1)
    return bilinear(
      { x: tws, y: twa },
      {
        x: polarData[twsIndex].trueWindSpeed,
        y: trueWindAngles[twaIndex],
        value: polarData[twsIndex].polarSpeeds[twaIndex]
      },
      {
        x: polarData[twsIndex + 1].trueWindSpeed,
        y: trueWindAngles[twaIndex],
        value: polarData[twsIndex + 1].polarSpeeds[twaIndex]
      },
      {
        x: polarData[twsIndex].trueWindSpeed,
        y: trueWindAngles[twaIndex + 1],
        value: polarData[twsIndex].polarSpeeds[twaIndex + 1]
      },
      {
        x: polarData[twsIndex + 1].trueWindSpeed,
        y: trueWindAngles[twaIndex + 1],
        value: polarData[twsIndex + 1].polarSpeeds[twaIndex +1]
      }
    )
  }
}

//https://en.wikipedia.org/wiki/Bilinear_interpolation#Nonlinear
function bilinear (point, x0y0, x1y0, x0y1, x1y1) {
  const b1 = x0y0.value
  const b2 = x1y0.value - x0y0.value
  const b3 = x0y1.value - x0y0.value
  const b4 = x0y0.value - x1y0.value - x0y1.value + x1y1.value
  const x = (point.x - x0y0.x) / (x1y1.x - x0y0.x)
  const y = (point.y - x0y0.y) / (x1y1.y - x0y0.y)
  const result = b1 + b2 * x + b3 * y + b4 * x * y
  return result
}
