/**
 Copyright 2015 Rick Wargo. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

'use strict';

var stats = (function () {
    return {
        //TODO: Could also create this info in a tabular form for the Echo Card
        //FIXME: Stats are not completely accurate - changing levels or skills will inflate some of the results
        information: function (response) {
            var stats = '';
            var vars = [];
            // Make some order of the stats
            // TODO: This needs to be ordered better than alphabetically
            for (var svar in response.response.sessionAttributes) {
                if (svar.match(/-(count|correct|incorrect|skipped|hint)/))
                    vars.push(svar);
            }
            for (var i in vars.sort()) {
                var words = vars[i].split('-');
                var level = words[0];
                var skill = words[1];
                var metric = words[2];
                var count = response.session(vars[i]);
                var qualifier = '';

                switch (metric) {
                    case 'count':
                        qualifier = 'presented';
                        break;
                    case 'correct':
                        qualifier = 'solved correctly';
                        break;
                    case 'incorrect':
                        qualifier = 'with incorrect attempts';
                        break;
                    case 'skipped':
                        qualifier = 'skipped';
                        break;
                    case 'hint':
                        qualifier = 'needing hints';
                        break;
                    default:
                        qualifier = metric;
                        break;
                }
                stats += 'The number of ' + level + ' ' + skill + ' problems ' + qualifier + ' is ' + count.toString() + ".\n";
            }
            return stats === '' ? 'No statistics yet as you have just started.' : stats;
        },

        reduceCounter: function (response, level, skill) {
            // Reduce problems presented by one as this last one does not count
            if (!level)
                level = response.session('level');
            if (!skill)
                skill = response.session('skill')

            var count = response.session(level + '-' + skill + '-count');
            if (count)
                response.session(level + '-' + skill + '-count', count-1);
        }
    }
})();

module.change_code = 1;
module.exports = stats;