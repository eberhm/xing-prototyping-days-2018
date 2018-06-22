const stackexchange = require('stackexchange');
const GetAnwsersService = require('../../../lib/services/GetSimilarQuestionsService');
const shortResponse = require('./similar.response');
const longResponse = require('./similar.response.big');
//const requestBody = JSON.parse(
//    '{"event":"room_message","item":{"message":{"date":"2018-06-20T10:07:44.819201+00:00","from":{"id":3297240,"links":{"self":"https://api.hipchat.com/v2/user/3297240"},"mention_name":"EberHerrera","name":"Eber Herrera","version":"B0F7OY05"},"id":"5f62a2a2-6e40-4b62-b1b9-cd90bf9b0739","mentions":[],"message":"adsfasdfA??","type":"message"},"room":{"id":4594247,"is_archived":false,"links":{"participants":"https://api.hipchat.com/v2/room/4594247/participant","self":"https://api.hipchat.com/v2/room/4594247","webhooks":"https://api.hipchat.com/v2/room/4594247/webhook"},"name":"testroom","privacy":"public","version":"JREOQ07C"}},"oauth_client_id":"47f7e4b5-2a43-491d-b458-421e8b21b110","webhook_id":20005843}'
//);



describe("GetSimilarQuestionsService", function () {

    const apiMock = {
        search: {
            similar: (filter, cb) => {
                if (filter.title === 'no responses') {
                    cb(null, {items: []});
                } else if (filter.title === 'too long') {
                    cb(null, longResponse);
                } else {
                    cb(null, shortResponse);
                }
            }
        }
    };

    const srv = new GetAnwsersService(apiMock);

    it("should return not found when no similar questions are found", function (done) {
        srv.getQuestions("no responses").then((msg) => {
            expect(msg).toEqual('not found');
            done();
        });
    });

    it("should ask for more context if there are too many requests", function (done) {
        //body.item.message.message = "hellooooo2!";
        srv.getQuestions("too long").then(msg => expect(msg).toEqual(srv.REPHRASE_SENTENCE_MESSAGE));
        done();
    });

    it("should return the best match", function (done) {
        srv.getQuestions("best").then(msg => expect(msg).toEqual('TDD/ testing with streams in NodeJS'));
        done();
    });
});

describe("GetSimilarQuestionsService integration", function () {
    const context = new stackexchange({version: 2.2});
    const srv = new GetAnwsersService(context);
    pending();

    it("if there are too many requests, ask for more context in the connected service", function (done) {
        srv.getQuestions("hellooooo2!").then(msg => expect(msg).toEqual('Could you rephrase the sentence?, I need more context :)'));
        done();
    });

    it("should be able to return the answer from the request", function (done) {
        srv.getQuestions("best testing tool in nodejs").then((msg) => {
            expect(msg).toEqual('I should send you either the answers or ask for more context: hellooooo!');
            done();
        });
    });
});
