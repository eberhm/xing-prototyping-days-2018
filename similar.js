const GetAnwsersService = require('./lib/services/GetSimilarQuestionsService');
const stackexchange = require('stackexchange');

const context = new stackexchange({version: 2.2});
const srv = new GetAnwsersService(context);

const question = process.argv[2] || '';
const tags = process.argv.slice(3) || [];


console.log(question, tags);

srv.getQuestions(question, tags).then(console.log);
