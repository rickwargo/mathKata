/**
 Copyright 2015 Rick Wargo. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

'use strict';

var Numbered = require('numbered');

var textHelper = (function () {
    return {
        completeHelp: 'Here\'s some things you can say, besides providing the answer: <break time="500ms" />'
            + ' Change to an easy, normal, or challenging level.'
            + ' Change skill to subtraction, multiplication, or division.'
            + ' Practice multiplication.'
            + ' I need a hint or I don\'t know.'
            + ' I need more time.'
            + ' Repeat the question.'
            + ' What is the answer?'
            + ' Skip this problem.'
            + ' What level am I at?'
            + ' How am I doing?'
            + ' I\'m done.',

        simpleHelp: 'You can ask for a hint, the answer, or repeat or skip the question. Say help for more options.',

        newKataHelp: 'To start a new kata, say Start a new <phoneme alphabet="ipa" ph="\ˈkɑ tə">kata</phoneme>.'
            + ' Or you can say begin a new addition game.'
            + ' Or you can say start a new easy subtraction <phoneme alphabet="ipa" ph="\ˈkɑ tə">kata</phoneme>.'
            + ' Or you can exit by saying goodbye or I\'m done.',

        correctPhrase: function () {
            var phrases  = [
                'That is correct!',
                'Correct!',
                'Correctamundo!',
                'Awesome!',
                'Great job!',
                'Exactly!',
                'Nicely done.',
                'Nice!',
                'Super!',
                'Well done.',
                'I knew you could do it.',
                'Sensational!',
                'That\'s the way to do it.',
                'Keep up the good work.',
                'Superb!',
                'You figured that out fast.',
                'Right on!',
                'Remarkable!',
                'Outstanding work!',
                'Brilliant!',
                'Terrific!',
                'Way to go',
                'Fabulous',
                'You did it',
                'I\'m impressed',
                'Exceptional',
                'Dynamite!',
                'You\'re a champ',
                'You\'re so smart',
                'You\'re right',
                'Super job'
            ];

            return phrases[Math.floor(Math.random()*phrases.length)];
        },

        incorrectPhrase: function () {
            var phrases = [
                'That is incorrect.',
                'Not quite.',
                'Not exactly.',
                'Close.',
                'Almost.',
                'Try again.',
                'Oops.'
            ];

            return phrases[Math.floor(Math.random() * phrases.length)];
        },

        numToWords: function(num) {
            return Numbered.stringify(num).replace(/-/g, ' ');
        },

        numberInterpretedCorrectly: function(text, result) {
            try {
                var parsed = Numbered.parse(text, true);
                return true;
            } catch (e) {
                return false;
            }

        },

        // Allow aliases for the different skills
        getMathSkill: function (mathSkill) {
            if (!mathSkill) {
                return undefined;
            }
            switch (mathSkill) {
                case 'addition':
                case 'add':
                case 'adding':
                case 'plus':
                    mathSkill = 'addition';
                    break;
                case 'subtraction':
                case 'subtract':
                case 'minus':
                    mathSkill = 'subtraction';
                    break;
                case 'multiplication':
                case 'multiply':
                case 'times':
                    mathSkill = 'multiplication';
                    break;
                case 'division':
                case 'divide':
                    mathSkill = 'division';
                    break;
                default:
                    mathSkill = undefined;
                    break
            }
            return mathSkill;
        },

        // Allow aliases for the different skills
        getDifficultyLevel: function (level) {
            if (!level) {
                return undefined;
            }
            switch (level) {
                case 'beginner':
                case 'easy':
                    level = 'easy';
                    break;
                case 'normal':
                case 'medium':
                case 'average':
                case 'standard':
                    level = 'normal';
                    break;
                case 'challenging':
                case 'advanced':
                case 'hard':
                case 'difficult':
                    level = 'hard';
                    break;
                default:
                    level = undefined;
                    break
            }
            return level;
        }

    };
})();

module.change_code = 1;
module.exports = textHelper;
