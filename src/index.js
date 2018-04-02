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
    parsedPolars = (props.polars || []).map(polar => {
      return parse(polar.data || '', polar.delimiter || ';')
    })
    console.log(JSON.stringify(parsedPolars,null, 2))
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
              description: 'First row is header and specifies the True Wind Speeds for columns. First column is True Wind Angle in degrees.',
              default: 'twa/tws;6;8;10;12;14;16;20\n' +
                '52;5.33;6.29;6.9;7.13;7.23;7.28;7.32\n' +
                '60;5.65;6.61;7.1;7.33;7.43;7.49;7.53\n' +
                '75;5.96;6.84;7.26;7.53;7.74;7.85;7.95\n' +
                '90;5.96;6.87;7.29;7.58;7.86;8.13;8.43\n' +
                '110;5.52;6.67;7.26;7.64;8.03;8.3;8.67\n' +
                '120;5.35;6.49;7.16;7.55;7.92;8.34;9\n' +
                '135;4.83;5.91;6.79;7.28;7.62;8;8.84\n' +
                '150;4.09;5.16;6.08;6.84;7.28;7.61;8.34'
            },
            description: {
              type: 'string',
              title: 'Detailed description'
            },
            twsUnit: {
              type: 'string',
              title: 'True Wind Speed Unit',
              required: true,
              default: 'knots',
              enum: ['metersPerSecond', 'knots']
            },
            stwUnit: {
              type: 'string',
              title: 'Speed Through Water Unit',
              required: true,
              default: 'knots',
              enum: ['metersPerSecond', 'knots']
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
        twsUnit: {
          'ui:widget': 'radio'
        },
        stwUnit: {
          'ui:widget': 'radio'
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
  return plugin
}

function parse (polarTxt, delimiter) {
  const parsed = csvParse(polarTxt, { delimiter })
  console.log(parsed)
  const result = {
    trueWindAngles: parsed.slice(1).map(row => Number(row[0])),
    polars: parsed[0]
      .slice(1)
      .map(trueWindSpeed => ({ trueWindSpeed, polarSpeeds: [] }))
  }
  parsed.slice(1).forEach(row => {
    row.slice(1).forEach((speed, index) => {
      result.polars
      result.polars[index].polarSpeeds.push(speed)
    })
  })
  return result
}
