/**
 Copyright 2015 Rick Wargo. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

'use strict';

var Text = require('./helper/text');

// TODO: Need to come up with a better means of determining easy/normal/hard problems
function generate_terms(skill, level) {
    var left = Math.random(),
        right = Math.random();

    //TODO: I'm sure this can be refactored to use anonymous functions to calc terms
    var l_limit, r_limit;
    var l_min = 0, r_min = 0;
    switch (skill) {
        case 'addition':
        case 'subtraction':
            if (level === 'easy') {
                l_limit = 90;
                r_limit = 10;
            } else { // normal || hard
                l_limit = r_limit = (level === 'normal' ? 100 : 1000);
                l_min = r_min = (level === 'normal' ? 10 : 100);
            }
            l_limit += 1;   // add one to account for floor so values range 0..limit
            r_limit += 1;

            left = Math.floor(left * l_limit) + l_min;
            right = Math.floor(right * r_limit) + r_min;

            while (level === 'hard' && ((left % 10 == 0) || (right % 10 == 0))) {  // don't allow a factor of ten on either term
                left = Math.floor(Math.random() * l_limit) + l_min;
                right = Math.floor(Math.random() * r_limit) + r_min;
            }
            break;
        case 'multiplication':
            if (level === 'easy') {
                l_limit = 10;
                r_limit = 10;
            } else if (level === 'normal') {
                l_limit = 50;
                r_limit = 20;
                l_min = r_min = 2;
            } else if (level === 'hard') {
                l_limit = 99;
                r_limit = 99;
                l_min = 3;
                r_min = 7;
            }
            l_limit += 1;   // add one to account for floor so values range 0..limit
            r_limit += 1;

            left = Math.floor(left * l_limit) + l_min;
            right = Math.floor(right * r_limit) + r_min;

            while (level === 'hard' && ((left % 10 == 0) || (right % 10 == 0))) {  // don't allow a factor of ten on either term
                left = Math.floor(Math.random() * l_limit) + l_min;
                right = Math.floor(Math.random() * r_limit) + r_min;
            }
            break;
        case 'division':
            if (level === 'easy') {
                l_limit = 10 + 1;
                r_limit = 10 + 1;
                l_min = r_min = 1;
            } else if (level == 'normal') {
                l_limit = 50 + 1;
                r_limit = 20 + 1;
                l_min = 4;
                r_min = 2;
            } else if (level == 'hard') {
                l_limit = 99 + 1;
                r_limit = 99 + 1;
                l_min = 7;
                r_min = 3;
            }

            // To make it exactly divisible, calc left as a multiple of right
            right = Math.floor(right * r_limit) + r_min;
            left = right * (Math.floor(left * l_limit) + l_min);

            while (level === 'hard' && ((left % 10 == 0) || (right % 10 == 0))) {  // don't allow a factor of ten on either term
                right = Math.floor(Math.random() * r_limit) + r_min;
                left = right * (Math.floor(Math.random() * l_limit) + l_min);
            }
            break;
    }

    return { left: left, right: right }
}

var challenge = (function () {
    return {
        problem: function (comment, response) {
            var skill = response.session('skill'),
                level = response.session('level');

            var terms = generate_terms(skill, level);
            var left_term = terms.left;
            var right_term = terms.right;
            var operator, card_operator, hint, answer;
            var round_value = (level === 'easy' ? 5 : 10);
            switch (skill) {
                case 'addition':
                    operator = 'plus';
                    card_operator = ' + ';
                    answer = left_term + right_term;
                    hint = Math.round((left_term + right_term) / round_value) * round_value;
                    break;
                case 'subtraction':
                    operator = 'minus';
                    card_operator = ' - ';
                    if (level !== 'hard' && right_term > left_term) // swap terms
                        right_term = left_term + (left_term = right_term) - right_term;
                    answer = left_term - right_term;
                    hint = Math.round((left_term - right_term) / round_value) * round_value;
                    break;
                case 'multiplication':
                    operator = 'times';
                    card_operator = ' * ';
                    answer = left_term * right_term;
                    hint = Math.round((left_term * right_term) / round_value) * round_value;
                    break;
                case 'division':
                    operator = 'divided by';
                    card_operator = ' / ';
                    if (right_term > left_term) // swap terms
                        right_term = left_term + (left_term = right_term) - right_term;
                    if (right_term == 0)
                        right_term = 1;
                    answer = left_term / right_term;
                    hint = Math.round((left_term / right_term) / round_value) * round_value;
                    break;
            }

            var question = 'What is '
                + left_term.toString()
                + ' ' + operator + ' '
                + right_term.toString()
                + '?';

            // save the answer for comparison
            response.session('question', question);
            response.session('card_question', left_term.toString() + card_operator + right_term.toString())
            response.session('answer', answer);
            response.session('hint', hint);

            //TODO: Need to set up better metrics tracking skill, level, counts, times, etc.
            var count = response.session(level + '-' + skill + '-count');
            response.session(level + '-' + skill + '-count', count ? count+1 : 1);

            var speechOutput = comment + (comment.trim().length > 0 ? ' <break time="1s"/> ' : '') + question;

            response
                .say(speechOutput)
                .card('New Problem', response.session('card_question') + ' = ?')
                .shouldEndSession(false, Text.simpleHelp);
        }
    };
})();

module.change_code = 1;
module.exports = challenge;