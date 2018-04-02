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

  plugin.start = function (props) {}

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
            description: {
              type: 'string',
              title: 'Detailed description'
            },
            twsUnit: {
              type: 'string',
              title: 'True Wind Speed Unit',
              required: true,
              default: 'metersPerSecond',
              enum: ['metersPerSecond', 'knots']
            },
            stwUnit: {
              type: 'string',
              title: 'Speed Through Water Unit',
              required: true,
              default: 'metersPerSecond',
              enum: ['metersPerSecond', 'knots']
            },
            delimiter: {
              type: 'string',
              title: 'Delimiter character',
              default: 'semicolon',
              enum: ['semicolon', 'comma', 'tab']
            },
            data: {
              type: 'string',
              title: 'Polar data'
            }
          }
        }
      }
    }
  }

  plugin.uiSchema = {
    polars: {
      items: {
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
