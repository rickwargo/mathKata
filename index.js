/**
 Copyright 2015 Rick Wargo. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

'use strict';

var alexa = require('alexa-app'),
    Package = require('./package.json'),
    Challenge = require('./challenge'),
    Statistics = require('./stats'),
    speechHelper = require('./helper/speech'),
    Text = require('./helper/text');

// Default to a normal level of skill
// TODO: Determine default level based on either preferences or past performance
var DEFAULT_LEVEL = Text.getDifficultyLevel('easy');

// Define an alexa-app
var mathKataApp = new alexa.app('mathKata');
mathKataApp.launch(function(request, response) {

    response.session('level', DEFAULT_LEVEL);
    speechHelper.askForSkill(request, response);
});

mathKataApp.pre = function(request, response, type) {
    if (request.sessionDetails.application.applicationId != Package.alexa.applicationId) {
        // Fail ungracefully
        response.fail("Invalid applicationId");
    }
};

mathKataApp.intent('NewKataIntent', {
        "slots": {
            "Skill": "LIST_OF_SKILLS",
            "Level": "LIST_OF_LEVELS"
        },
        "slot_types": [
            {
                "name":"Skill",
                "values":["addition","add","adding","plus","subtraction","subtract","minus","multiplication","multiply","times","division","divide"]
            },
            {
                "name":"Level",
                "values":["beginner","easy","normal","medium","average","standard","advanced","challenging","hard","difficult"]
            }
        ],
        "utterances": [
            "(begin|create|make|new|do|open|start|restart|setup) (|a) (|new) (|{Level}) (|{Skill}) (kata|game)",
            "(begin|create|make|new|do|open|start|restart|setup) (|a) (|new) (kata|game) for (|{Level}) {Skill}",
            "(begin|create|make|new|do|open|start|restart|setup) (|a) (|new) (kata|game) for {Skill} (that is|that's) {Level}",
            "{Skill}",
            "{Level}",
            "{Level} {Skill}"
        ]
    },
    function(request, response) {
        // Re-initialize to make it look like we are starting over (necessary for the restart action)
        // TODO: Look at how the stats are reset and maybe create a card then reset.
        response.session('answer', undefined);
        response.session('skill', undefined);
        // TODO: Determine default level based on either preferences or past performance

        if (!response.session('level'))     // only default if never set, when restarting game maintain same level
            response.session('level', DEFAULT_LEVEL);

        var skill = request.slot('Skill');
        var mathSkill = Text.getMathSkill(skill);
        if (mathSkill)
            response.session('skill', mathSkill);

        var level = request.slot('Level');
        var skillLevel = Text.getDifficultyLevel(level);
        if (skillLevel) {
            response.session('level', skillLevel);
        } else {
            skillLevel = response.session('level');
        }

        if (!mathSkill) {
            speechHelper.askForSkill(request, response);
            return;
        }

        if (!skillLevel) {
            speechHelper.askForDifficultyLevel(request, response);
            return;
        }

        Challenge.problem('', response);
    }
);

mathKataApp.intent('ChangeLevelIntent', {
        "slots": {
            "Level": "LIST_OF_LEVELS"
        },
        "slot_types": [
            {
                "name":"Level",
                "values":["beginner","easy","normal","medium","average","standard","advanced","challenging","hard","difficult"]
            }
        ],
        "utterances": [
            "(change|switch) (level to|to level|to) {Level} (|problems|questions|challenges)",
            "new level {Level}"
        ]
    },
    function(request, response) {
        var previousLevel = response.session('level');
        var previousSkill = response.session('skill');

        var preface = '';
        if (request.slot('Level')) {
            var level = Text.getDifficultyLevel(request.slot('Level'));
            if (!level) {
                speechHelper.askForDifficultyLevel(request, response);
                return;
            } else if (level !== response.session('level')) {
                response.session('level', level);
                preface += 'Level changed to ' + level + '. ';
            }
        }

        // at this point, already have a level. if a skill exists, we can present a problem.
        if (response.session('skill')) {
            preface += 'New problem';

            Statistics.reduceCounter(response, previousLevel, previousSkill);  // last problem presented before this action should not "count"
            Challenge.problem(preface, response);
        } else {
            speechHelper.askForSkill(request, response);
            return;
        }
    }
);

mathKataApp.intent('ChangeSkillIntent', {
        "slots": {
            "Skill": "LIST_OF_SKILLS",
            "Level": "LIST_OF_LEVELS"
        },
        "slot_types": [
            {
                "name":"Skill",
                "values":["addition","add","adding","plus","subtraction","subtract","minus","multiplication","multiply","times","division","divide"]
            },
            {
                "name":"Level",
                "values":["beginner","easy","normal","medium","average","standard","advanced","challenging","hard","difficult"]
            }
        ],
        "utterances": [
            "(change|switch) (skill to|to skill|to) (|{Level}) {Skill} (|problems|questions|challenges)",
            "practice (|{Level}) {Skill} (|now)",
            "(|now) practice (|{Level}) {Skill}"
        ]
    },
    function(request, response) {
        var previousLevel = response.session('level');
        var previousSkill = response.session('skill');
        var preface = '';

        if (request.slot('Skill')) {
            var skill = Text.getMathSkill(request.slot('Skill'));
            if (!skill) {
                speechHelper.askForSkill(request, response);
                return;
            } else if (skill !== response.session('skill')) {
                response.session('skill', skill);
                preface += 'Skill changed to ' + skill + '.';
            }
        }
        if (request.slot('Level')) {
            var level = Text.getDifficultyLevel(request.slot('Level'));
            if (!level) {
                speechHelper.askForDifficultyLevel(request, response);
                return;
            } else if (skill !== response.session('level')) {
                response.session('level', level);
                if (preface.charAt( preface.length-1 ) == ".") { // remove the period
                    preface = preface.slice(0, -1);
                }
                preface += ' and level changed to ' + level + '.';
            }
        }

        preface += ' New problem';

        Statistics.reduceCounter(response, previousLevel, previousSkill);  // last problem presented before this action should not "count"
        Challenge.problem(preface, response);
    }
);


mathKataApp.intent('ResponseIntent', {
        "slots": {
            "Value": "AMAZON.NUMBER"
        },
        "utterances": [
            "(|the) answer (|is) {Value}",
            "(it's|it is) {Value}",
            "{Value}"
        ]
    },
    function(request, response) {
        if (typeof response.session('answer') == 'undefined') {
            response
                .say('I have yet to present a problem. How could you know the answer?')
                .shouldEndSession(false, Text.newKataHelp);
            //TODO: What to do next here?
            return;
        }

        // note: parseInt will return NaN if the value is undefined/missing
        var answer = parseInt(request.slot('Value'));

        // try to parse what came back to see if Alexa misinterpreted the number
        if (answer != NaN && !Text.numberInterpretedCorrectly(request.slot('Value')))
            answer = NaN;

        var skill = response.session('skill'),
            level = response.session('level');

        if (isNaN(answer)) {
            response
                .say('Sorry, I did not hear the answer. ' + response.session('question'))
                .card('Misunderstood Answer', 'I heard ' + request.slot('Value') + ' for ' + response.session('card_question'))
                .shouldEndSession(false, Text.simpleHelp);
            return;
        } else if (answer == response.session('answer')) {
            //Store the number of correct answers
            var count = response.session(level + '-' + skill + '-correct');
            response.session(level + '-' + skill + '-correct', count ? count+1 : 1);

            response.card('Correct Answer', response.session('card_question') + ' = ' + request.slot('Value'));
            Challenge.problem(Text.correctPhrase(), response);
        } else {
            //Store the number of incorrect attempts
            var count = response.session(level + '-' + skill + '-incorrect');
            response.session(level + '-' + skill + '-incorrect', count ? count+1 : 1);

            response
                .say(Text.incorrectPhrase() + ' ' + response.session('question'))
                .card('Incorrect Answer', response.session('card_question') + ' != ' + request.slot('Value'))
                .shouldEndSession(false, Text.simpleHelp);
        }
    }
);

mathKataApp.intent('HintIntent', {
        "utterances":[
            "Can I (get|have) a hint",
            "Could you give me a hint",
            "I (do not|don't) know",
            "(|I am|I'm) not sure",
            "(What's|What is) it close to"
        ]
    },
    function(request, response) {
        if (typeof response.session('answer') == 'undefined') {
            response
                .say('I have yet to present a problem. How could I give you a hint?')
                .shouldEndSession(false, Text.newKataHelp);
            //TODO: What to do next here?
            return;
        }
        //Store the number of hinted attempts
        var skill = response.session('skill'),
            level = response.session('level');
        var count = response.session(level + '-' + skill + '-hint');
        response.session(level + '-' + skill + '-hint', count ? count+1 : 1);

        response
            .say('The answer is approximately ' + response.session('hint') + '. ')
            .card('Hint', response.session('card_question') + ' ~ ' + response.session('hint') + '.')
            .say(response.session('question'))
            .shouldEndSession(false, Text.simpleHelp);
    }
);

mathKataApp.intent('SupplyAnswerIntent', {
        "utterances":[
            "What is the answer (|please)",
            "Could you give me the answer (|please)",
            "I need the answer (|please)",
            "answer (|please)"
        ]
    },
    function(request, response) {
        if (typeof response.session('answer') == 'undefined') {
            response
                .say('I have yet to present a problem. How can I give you the answer?')
                .shouldEndSession(false, Text.newKataHelp);
            //TODO: What to do next here?
            return;
        }
        //Store the number of skipped attempts
        var skill = response.session('skill'),
            level = response.session('level');
        var count = response.session(level + '-' + skill + '-skipped');
        response.session(level + '-' + skill + '-skipped', count ? count+1 : 1);

        response
            .say('The answer is ' + response.session('answer') + '.')
            .card('Answer', response.session('card_question') + ' = ' + response.session('answer'))
            .shouldEndSession(false, Text.simpleHelp);

        Challenge.problem('', response);
    }
);

mathKataApp.intent('MoreTimeIntent', {
        "utterances":[
            "(|I) (need|want|desire) more time",
            "Can I have more time",
            "(|Please) (|give me) more time",
            "Umm",
            "Hmm"
        ]
    },
    function(request, response) {
        if (typeof response.session('answer') == 'undefined') {
            response
                .say('I have yet to present a problem. How could you need more time to answer it?')
                .shouldEndSession(false, Text.newKataHelp);
            //TODO: What to do next here?
            return;
        }
        response
            .say('Okay. I\'ll give you five more seconds to think about ' + response.session('question').replace('?', '.') + '<break time="5s"/>' + response.session('question'))
            .card('More Time', 'Need more time to answer: ' + response.session('card_question'))
            .shouldEndSession(false, Text.simpleHelp);
    }
);

mathKataApp.intent('SkipIntent', {
        "utterances":[
            "Skip",
            "Next (one|problem|question|challenge)",
            "(skip|move) (this|to the next) (one|problem|question|challenge)"
        ]
    },
    function(request, response) {
        if (typeof response.session('answer') == 'undefined') {
            response
                .say('I have yet to present a problem. How could I skip it?')
                .shouldEndSession(false, Text.newKataHelp);
            //TODO: What to do next here?
            return;
        }
        //Store the number of skipped attempts
        var skill = response.session('skill'),
            level = response.session('level');
        var count = response.session(level + '-' + skill + '-skipped');
        response.session(level + '-' + skill + '-skipped', count ? count+1 : 1);

        response
            .say('Okay. ')
            .card('Skipped', 'Skipping: ' + response.session('card_question'))
            .shouldEndSession(false, Text.simpleHelp);

        Challenge.problem('', response);
    }
);

mathKataApp.intent('RepeatIntent', {
        "utterances":[
            "(|Please|Can you) (|please) (say|repeat) the (question|problem) (|again)",
            "What was the (question|problem)",
            "what was that (|again)",
            "repeat (|please)",
            "say (|that) again (|please)",
            "I missed that",
            "(|can I have a) do over"
        ]
    },
    function(request, response) {
        if (typeof response.session('answer') == 'undefined') {
            response
                .say('I have yet to present a problem. How could I repeat the question?')
                .shouldEndSession(false, Text.newKataHelp);
            //TODO: What to do next here?
            return;
        }
        response
            .say('Okay. ' + response.session('question'))
            .card('Repeated', 'Repeating: ' + response.session('card_question'))
            .shouldEndSession(false, Text.simpleHelp);
    }
);

mathKataApp.intent('GetLevelIntent', {
        "utterances":[
            "what (am I|my) (practicing|doing)",
            "(where|what level) am I (|at)",
            "what (kata|game|skill)",
            "what (kata|game|skill) (am I|my) practicing",
            "what (skill|level) (|am i|am i at)"
        ]
    },
    function(request, response) {
        var level = response.session('level'),
            skill = response.session('skill');

        if (!skill) {
            response
                .say('You still need to select a skill before checking the level.')
                .shouldEndSession(false, Text.newKataHelp);
            return;
        }
        if (!level) {
            response
                .say('You still have not set a level.')
                .shouldEndSession(false, Text.simpleHelp);
            return;
        }
        response
            .say('You are currently engaged in a' + (skill[0] === 'a' ? 'n ' : ' ') + skill + ' <phoneme alphabet="ipa" ph="\ˈkɑ tə">kata</phoneme> at the ' + level + ' level.')
            .card('Check Level','You are currently engaged in a ' + skill + ' kata at the ' + level + ' level.')
            .say(response.session('question'))
            .shouldEndSession(false, Text.simpleHelp);
    }
);

mathKataApp.intent('GetStatsIntent', {
        "utterances":[
            "how (am I|my) doing",
            "(tell me|what are|get) (|the|my) (stats|statistics)"
        ]
    },
    function(request, response) {
        var stats = Statistics.information(response);
        response
            .say(stats)
            .card('Stats', stats)
            .say('<break time="400ms"/>' + response.session('question'))
            .shouldEndSession(false, Text.simpleHelp);
    }
);

mathKataApp.intent('FinishedIntent', {
        "utterances":[
            "(I am|I'm) (done|finished)",
            "(|I) quit",
            "Goodbye"
        ]
    },
    function(request, response) {
        Statistics.reduceCounter(response);  // last problem presented before this action should not "count"
        var stats = Statistics.information(response);
        response
            .say('Thank you for sharpening your math skills with me today. Soon you will become a math jedi!')
            .card('Finished', stats);
        // FIXME: The number of problems presented is inflated by one
    }
);

mathKataApp.intent('AMAZON.HelpIntent', {
    },
    function(request, response) {
        var speechText = "With Math Kata, you can practice your math skills.  " +
            Text.completeHelp;
        var repromptText = "What do you want to do?";

        response
            .say(speechText)
            .shouldEndSession(false, repromptText);
    }
);

mathKataApp.intent('AMAZON.StopIntent', {
    },
    function(request, response) {
        response
            .say('Okay. Whenever you\'re ready, you can ask to start another <phoneme alphabet="ipa" ph="\ˈkɑ tə">kata</phoneme>. Goodbye.');
    }
);

mathKataApp.intent('AMAZON.CancelIntent', {
    },
    function(request, response) {
        response
            .say('Okay. Whenever you\'re ready, you can ask to start another <phoneme alphabet="ipa" ph="\ˈkɑ tə">kata</phoneme>. Goodbye');
    }
);

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = mathKataApp;