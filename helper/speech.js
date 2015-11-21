/**
 Copyright 2015 Rick Wargo. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

'use strict';

var Text = require('./text');

var speechHelper = (function () {
    return {
        askForSkill: function (request, response) {
            var speechOutput = 'What skill would you like to practice';
            if (request.session('level')) speechOutput += ' at level ' + request.session('level');
            speechOutput += '?';

            response
                .say(speechOutput)
                .shouldEndSession(false, Text.simpleHelp);
        },
        askForDifficultyLevel: function (request, response) {
            var speechOutput = 'At what level would you like to practice';
            if (request.session('skill')) speechOutput += ' ' + request.session('skill');
            speechOutput += '?';

            response
                .say(speechOutput)
                .shouldEndSession(false, Text.simpleHelp);
        }
    };
})();

module.change_code = 1;
module.exports = speechHelper;
