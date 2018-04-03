/*
 * Copyright 2018 Teppo Kurki <teppo.kurki@iki.fi>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const csvParse = require('csv-parse/lib/sync')
const uuidv4 = require('uuid/v4')

module.exports = function (app) {
  const error =
    app.error ||
    (msg => {
      console.error(msg)
    })
  const debug =
    app.debug ||
    (msg => {
      console.log(msg)
    })
  const plugin = {}
  let parsedPolars = []

  plugin.start = function (props) {
    if (fillUuids(props)) {
      debug('Updated at least one uuid')
      app.savePluginOptions(props, () => {})
    }
    parsedPolars = (props.polars || []).map(polar => {
      const { uuid, name, description } = polar
      const result = {
        uuid,
        name,
        description,
        trueWindSpeedLabelUnit: polar.trueWindSpeedUnit,
        speedThroughWaterLabelUnit: polar.speedThroughWaterUnit,
        ...parse(
          polar.data || '',
          polar.delimiter || ';',
          twsConversions[polar.trueWindSpeedUnit || 'metersPerSecond'],
          twsConversions[polar.speedThroughWaterUnit || 'metersPerSecond'],
          debug
        )
      }
      return result
    })
    debug(JSON.stringify(parsedPolars, null, 2))
  }

  plugin.stop = function () {}

  plugin.id = 'polars'
  plugin.name = 'Polars'
  plugin.description = 'Polar handling'

  plugin.schema = {
    properties: {
      polars: {
        type: 'array',
        title: 'Polars',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Descriptive name for the polar',
              required: true
            },
            data: {
              type: 'string',
              title: 'Polar data',
              description: 'First row is header and specifies the True Wind Speeds for columns. First column is True Wind Angle in degrees. # starts a comment',
              default: '#this line is a comment\n' +
                'twa/tws;6;8;10;12;14;16;20\n' +
                '52;5.29;6.25;6.89;7.19;7.3;7.36;7.4\n' +
                '60;5.61;6.58;7.1;7.37;7.51;7.58;7.64\n' +
                '75;5.9;6.82;7.25;7.55;7.8;7.98;8.12\n' +
                '90;5.9;6.82;7.32;7.65;7.86;8.18;8.64\n' +
                '110;5.68;6.82;7.37;7.77;8.18;8.56;8.98\n' +
                '120;5.52;6.67;7.27;7.67;8.11;8.59;9.34\n' +
                '135;5.01;6.12;6.95;7.4;7.77;8.2;9.17\n' +
                '150;4.24;5.32;6.26;6.98;7.39;7.74;8.56'
            },
            uuid: {
              type: 'string',
              default: 'Server will assign the uuid on save'
            },
            description: {
              type: 'string',
              title: 'Detailed description'
            },
            trueWindSpeedUnit: {
              type: 'string',
              title: 'True Wind Speed Unit',
              required: true,
              default: 'kn',
              enum: ['mps', 'kn'],
              enumNames: ['Meters/second', 'Knots']
            },
            speedThroughWaterUnit: {
              type: 'string',
              title: 'Speed Through Water Unit',
              required: true,
              default: 'kn',
              enum: ['mps', 'kn'],
              enumNames: ['Meters/second', 'Knots']
            },
            delimiter: {
              type: 'string',
              title: 'Delimiter character',
              default: 'semicolon',
              enum: [';', ',', '\t'],
              enumNames: ['semicolon', 'comma', 'tab'],
              default: ';'
            }
          }
        }
      }
    }
  }

  plugin.uiSchema = {
    polars: {
      items: {
        trueWindSpeedUnit: {
          'ui:widget': 'radio'
        },
        speedThroughWaterUnit: {
          'ui:widget': 'radio'
        },
        uuid: {
          'ui:readonly': true
        },
        data: {
          'ui:widget': 'textarea',
          'ui:options': {
            rows: 18
          }
        }
      }
    }
  }

  plugin.signalKApiRoutes = router => {
    router.get('/vessels/self/polars', (req, res) => {
      res.json(
        parsedPolars.reduce((acc, polar) => {
          acc[polar.uuid] = polar
          return acc
        }, {})
      )
    })
    router.get('/vessels/self/polars/active', (req, res) => {
      if (!parsedPolars || parsedPolars.length < 1) {
        res.status(404)
        res.end()
        return
      }
      res.json(parsedPolars[0])
    })
    router.get('/vessels/self/polars/:idOrName', (req, res) => {
      const result = parsedPolars.find(
        polar =>
          polar.uuid == req.params.idOrName ||
          polar.name === req.params.idOrName
      )
      if (result) {
        res.json(result)
      } else {
        res.status(404)
        res.end()
      }
    })
    return router
  }
  return plugin
}

function parse (
  polarTxt,
  delimiter,
  twsToMetersPerSecond = s => s,
  stwToMetersPerSecond = s => s,
  debug
) {
  const parsed = csvParse(polarTxt, { delimiter, comment: '#' })
  debug(parsed)
  const result = {
    trueWindAngles: parsed.slice(1).map(row => toRadian(row[0])),
    trueWindAngleLabels: parsed.slice(1).map(row => Number(row[0])),
    polarData: parsed[0].slice(1).map(trueWindSpeed => ({
      trueWindSpeed: twsToMetersPerSecond(trueWindSpeed),
      trueWindSpeedLabel: trueWindSpeed,
      polarSpeeds: [],
      polarSpeedLabels: []
    }))
  }
  parsed.slice(1).forEach(row => {
    row.slice(1).forEach((speed, index) => {
      result.polarData[index].polarSpeeds.push(stwToMetersPerSecond(speed))
      result.polarData[index].polarSpeedLabels.push(speed)
    })
  })
  return result
}

const toRadian = deg => deg / 180 * Math.PI

const MPS_PER_KNOT = 0.514444
const twsConversions = { mps: s => s, kn: s => s * MPS_PER_KNOT }

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
function fillUuids (options) {
  return options.polars.reduce((acc, polar) => {
    if (!polar.uuid || !UUID_REGEX.test(polar.uuid)) {
      polar.uuid = uuidv4()
      return true
    }
    return acc
  }, false)
}
