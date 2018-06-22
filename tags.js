const srv = require('./lib/services/QuestionsMatcherService');
const longResult = require('./spec/lib/services/similar.response.big');

const possibleTags = srv.getPossibleTags(longResult.items);
console.log(possibleTags);


console.log(srv.getMatchingTags([
    'nodejs', 'mapredue', 'ruby', 'js'
], possibleTags), 'matching tags');
