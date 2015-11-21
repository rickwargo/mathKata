/**
 Copyright 2015 Rick Wargo. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

'use strict';

var AWS = require("aws-sdk");

var storageHelper = (function () {
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    /*
     * The SessionData class stores all sessionData states for the user
     */
    function SessionData(session, data) {
        if (data) {
            this.data = data;
        } else {
            this.data = {
                //TODO: Define data for session storage
                //TODO: Define mechanism to keep this "class" generic such that the only thing that needs to happen is to require this and define the data model
            };
        }
        this._session = session;
    }

    SessionData.prototype = {

        save: function (callback) {
            //save the sessionData states in the session,
            //so next time we can save a read from dynamoDB
            this._session.attributes.currentSessionData = this.data;
            dynamodb.putItem({
                TableName: 'SessionData',
                Item: {
                    CustomerId: {
                        S: this._session.user.userId
                    },
                    Data: {
                        S: JSON.stringify(this.data)
                    }
                }
            }, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                }
                if (callback) {
                    callback();
                }
            });
        }
    };

    return {
        loadSessionData: function (session, callback) {
            // loads the sessionData session for the environment or the database,
            if (session.attributes.currentSessionData) {
                console.log('get sessionData from session=' + session.attributes.currentSessionData);
                callback(new SessionData(session, session.attributes.currentSessionData));
                return;
            }
            dynamodb.getItem({
                TableName: 'MathSessionDataUserData',
                Key: {
                    CustomerId: {
                        S: session.user.userId
                    }
                }
            }, function (err, data) {
                var currentSessionData;
                if (err) {
                    console.log(err, err.stack);
                    currentSessionData = new SessionData(session);
                    session.attributes.currentSessionData = currentSessionData.data;
                    callback(currentSessionData);
                } else if (data.Item === undefined) {
                    currentSessionData = new SessionData(session);
                    session.attributes.currentSessionData = currentSessionData.data;
                    callback(currentSessionData);
                } else {
                    console.log('get sessionData from dynamodb=' + data.Item.Data.S);
                    currentSessionData = new SessionData(session, JSON.parse(data.Item.Data.S));
                    session.attributes.currentSessionData = currentSessionData.data;
                    callback(currentSessionData);
                }
            });
        },

        newSessionData: function (session) {
            // creates a new sessionData session
            return new SessionData(session);
        }
    };
})();

module.exports = storageHelper;
