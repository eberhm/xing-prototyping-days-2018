const natural = require('natural');
const TAG_SENSITIVITY = 0.7;
const weights = {
    distance: 1,
    tags: 2,
    score: 1
};

function getBestScore(finalTags, tag) {
    return finalTags.reduce((value, aTag) => {
        const newValue = natural.JaroWinklerDistance(aTag, tag);
        if (newValue >= value.score) {
            return {
                tag: aTag,
                score: newValue
            };
        } else {
            return value;
        }
    }, {tag: null, score: 0});
}

function getAllTags(results) {
    return results.reduce((acc, item) => acc.concat(item.tags), []);
}

function getPossibleTags(results) {
    const tags = getAllTags(results);
    return tags
        .reduce((finalTags, tag) => {
                if (getBestScore(finalTags, tag).score <= TAG_SENSITIVITY) finalTags.push(tag);

                return finalTags;
            },
            []
        );
}

function getBestMatch(question, results, tags) {
    const onlyWithScore = results.items
        .filter((item) => {
            return item.score > 0
            && !item.closed_date
        });

    const tagScoredItems = onlyWithScore.map((item) => {
        item.tagsScore = ((getMatchingTags(tags, item.tags).length / tags.length) || 0);

        item.distance = natural.LevenshteinDistance(item.title, question, {
            transposition_cost: 0.1,
            deletion_cost: 0,
            insertion_cost: 5
        });

        item.finalScore =
            (item.score * weights.score) +
            (item.tagsScore * weights.tags) +
            ((item.distance * -weights.distance) + 100)
        ;
        return item;
    });

    return tagScoredItems
        .sort((a, b) => a.finalScore - b.finalScore)
        //.pop()
        // .map(item => ({title: item.title, score: item.score, tagSc: item.tagsScore, distance: item.distance, finalScore: item.finalScore }))
        ;
}

//for each tag, how many tags are in the qTags
function getMatchingTags(tagsP, tagsQ) {
    return tagsP.reduce((matchingTags, tag) => {
        const bestScore = getBestScore(tagsQ, tag);
        if (bestScore.score > TAG_SENSITIVITY) matchingTags.push(bestScore.tag);

        return matchingTags;
    }, []);
}

module.exports = {
    getBestMatch,
    getPossibleTags,
    getMatchingTags
};