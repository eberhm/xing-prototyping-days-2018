const matchBestQuestion = require('./QuestionsMatcherService');
const PAGESIZE = 50;

class GetSimilarQuestionsService
{
    constructor(api) {
        this.api = api;
        this.MAX_QUESTIONS_FOUND = 300;
        this.REPHRASE_SENTENCE_MESSAGE = 'Could you rephrase the sentence?, I need more context :). You can add hashtags(#) to help me';
        this.NOT_FOUND_MESSAGE = 'not found';
    }

    getQuestions(question = [], tags = []) {
        return new Promise((resolve, reject) => {
            let filter = {
//            key: 'YOUR_API_KEY',
                pagesize: PAGESIZE,
                sort: 'relevance',
                tagged: tags.join(';'),
                order: 'asc',
                title: question
            };

            // Get all the questions (http://api.stackexchange.com/docs/similar)
            this.api.search.similar(filter, (err, results) => {
                if (err) reject(err);


                if (results.items.length > this.MAX_QUESTIONS_FOUND) {
                    resolve(this.REPHRASE_SENTENCE_MESSAGE);
                } else {
                    if (results.items.length === 0) {
                        resolve(this.NOT_FOUND_MESSAGE);
                    } else {
                        resolve(matchBestQuestion.getBestMatch(question, results, tags));
                    }
                }
            });
        });
    }


}

module.exports = GetSimilarQuestionsService;