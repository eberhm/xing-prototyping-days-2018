const shortResponse = require('./similar.response');
const longResponse = require('./similar.response.big');
const questionsMatcher = require('../../../lib/services/QuestionsMatcherService');
//const requestBody = JSON.parse(
//    '{"event":"room_message","item":{"message":{"date":"2018-06-20T10:07:44.819201+00:00","from":{"id":3297240,"links":{"self":"https://api.hipchat.com/v2/user/3297240"},"mention_name":"EberHerrera","name":"Eber Herrera","version":"B0F7OY05"},"id":"5f62a2a2-6e40-4b62-b1b9-cd90bf9b0739","mentions":[],"message":"adsfasdfA??","type":"message"},"room":{"id":4594247,"is_archived":false,"links":{"participants":"https://api.hipchat.com/v2/room/4594247/participant","self":"https://api.hipchat.com/v2/room/4594247","webhooks":"https://api.hipchat.com/v2/room/4594247/webhook"},"name":"testroom","privacy":"public","version":"JREOQ07C"}},"oauth_client_id":"47f7e4b5-2a43-491d-b458-421e8b21b110","webhook_id":20005843}'
//);

describe("QuestionsMatcherService", function () {
    it("should best match when no tags are passed", function () {
        expect(questionsMatcher.getBestMatch(shortResponse).title).toEqual('TDD/ testing with streams in NodeJS');
    });

    it("should get best lst of tags", function () {
        expect(questionsMatcher.getPossibleTags(longResponse.items)).toEqual([]);
    });
});

