const cors = require('cors');
const uuid = require('uuid');
const url = require('url');
const stackexchange = require('stackexchange');

const GetSimilarQuestionsService = require('../lib/services/GetSimilarQuestionsService');
const context = new stackexchange({version: 2.2});
const srv = new GetSimilarQuestionsService(context);

// This is the heart of your HipChat Connect add-on. For more information,
function createCard(firstQ) {
    const card = {
        "style": "link",
        "url": firstQ.link,
        "id": uuid.v4(),
        "title": firstQ.title,
        "description": `It has ${firstQ.answer_count} answers with a score ${firstQ.score}`,
        "icon": {
            "url": "https://hipchat-public-m5.atlassian.com/assets/img/hipchat/bookmark-icons/favicon-192x192.png"
        }
    };
    const msg = `<a href="${firstQ.link}">${firstQ.title}</a>`;
    const opts = {'options': {'color': 'yellow'}};

    return [msg, card, opts];
}

function identity(me) {
    return me;
}

// take a look at https://developer.atlassian.com/hipchat/tutorials/getting-started-with-atlassian-connect-express-node-js
module.exports = function (app, addon) {
    const hipchat = require('../lib/hipchat')(addon);

    // simple healthcheck
    app.get('/healthcheck', function (req, res) {
        res.send('OK');
    });

    // Root route. This route will serve the `addon.json` unless a homepage URL is
    // specified in `addon.json`.
    app.get('/',
        function (req, res) {
            // Use content-type negotiation to choose the best way to respond
            res.format({
                // If the request content-type is text-html, it will decide which to serve up
                'text/html': function () {
                    var homepage = url.parse(addon.descriptor.links.homepage);
                    if (homepage.hostname === req.hostname && homepage.path === req.path) {
                        res.render('homepage', addon.descriptor);
                    } else {
                        res.redirect(addon.descriptor.links.homepage);
                    }
                },
                // This logic is here to make sure that the `addon.json` is always
                // served up when requested by the host
                'application/json': function () {
                    res.redirect('/atlassian-connect.json');
                }
            });
        }
    );

    app.get('/help',
        function (req, res) {
            res.render('help', addon.descriptor);
        }
    );

    // This is an example route that's used by the default for the configuration page
    // https://developer.atlassian.com/hipchat/guide/configuration-page
    app.get('/config',
        // Authenticates the request using the JWT token in the request
        addon.authenticate(),
        function (req, res) {
            // The `addon.authenticate()` middleware populates the following:
            // * req.clientInfo: useful information about the add-on client such as the
            //   clientKey, oauth info, and HipChat account info
            // * req.context: contains the context data accompanying the request like
            //   the roomId
            res.render('config', req.context);
        }
    );

    // This is an example glance that shows in the sidebar
    // https://developer.atlassian.com/hipchat/guide/glances
    app.get('/glance',
        cors(),
        addon.authenticate(),
        function (req, res) {
            res.json({
                "label": {
                    "type": "html",
                    "value": "Hello World!"
                },
                "status": {
                    "type": "lozenge",
                    "value": {
                        "label": "NEW",
                        "type": "error"
                    }
                }
            });
        }
    );

    // This is an example end-point that you can POST to to update the glance info
    // Room update API: https://www.hipchat.com/docs/apiv2/method/room_addon_ui_update
    // Group update API: https://www.hipchat.com/docs/apiv2/method/addon_ui_update
    // User update API: https://www.hipchat.com/docs/apiv2/method/user_addon_ui_update
    app.post('/update_glance',
        cors(),
        addon.authenticate(),
        function (req, res) {
            res.json({
                "label": {
                    "type": "html",
                    "value": "Hello World!"
                },
                "status": {
                    "type": "lozenge",
                    "value": {
                        "label": "All good",
                        "type": "success"
                    }
                }
            });
        }
    );

    // This is an example sidebar controller that can be launched when clicking on the glance.
    // https://developer.atlassian.com/hipchat/guide/sidebar
    app.get('/sidebar',
        addon.authenticate(),
        function (req, res) {
            res.render('sidebar', {
                identity: req.identity
            });
        }
    );

    // This is an example dialog controller that can be launched when clicking on the glance.
    // https://developer.atlassian.com/hipchat/guide/dialog
    app.get('/dialog',
        addon.authenticate(),
        function (req, res) {
            res.render('dialog', {
                identity: req.identity
            });
        }
    );

    // Sample endpoint to send a card notification back into the chat room
    // See https://developer.atlassian.com/hipchat/guide/sending-messages
    app.post('/send_notification',
        addon.authenticate(),
        function (req, res) {
            var card = {
                "style": "link",
                "url": "https://www.hipchat.com",
                "id": uuid.v4(),
                "title": req.body.messageTitle,
                "description": "Great teams use HipChat: Group and private chat, file sharing, and integrations",
                "icon": {
                    "url": "https://hipchat-public-m5.atlassian.com/assets/img/hipchat/bookmark-icons/favicon-192x192.png"
                }
            };
            var msg = '<b>' + card.title + '</b>: ' + card.description;
            var opts = {'options': {'color': 'yellow'}};
            hipchat.sendMessage(req.clientInfo, req.identity.roomId, msg, opts, card);
            res.json({status: "ok"});
        }
    );

    // This is an example route to handle an incoming webhook
    // https://developer.atlassian.com/hipchat/guide/webhooks
    app.post('/webhook',
        addon.authenticate(),
        function (req, res) {
            hipchat.sendMessage(req.clientInfo, req.identity.roomId, 'pong')
                .then(function (data) {
                    res.sendStatus(200);
                });
        }
    );

    // starting the session
    app.post('/startSession',
        addon.authenticate(),
        function (req, res) {
            const getQuestions = function (msg) {
                const tags = /.*\?\?(.*)/.exec(msg);
                const tagsArr = tags[1].trim().split(' ').map(tg => tg.replace('#', '').trim());

                return srv.getQuestions(msg.replace('??', ''), tagsArr)
                    .then((questions) => createCard(questions.pop()))
                    .catch(identity);
            };

            const userQ = req.body.item.message.message;
            const helpMsg = 'See <a href="https://be6c99d5.ngrok.io/help">help</a> page for more info on how to use it';
            if ('help??' === userQ) {
                hipchat.sendMessage(req.clientInfo, req.identity.roomId, helpMsg);
            } else {
                getQuestions(userQ)
                    .then(([msg, card, opts]) => hipchat.sendMessage(req.clientInfo, req.identity.roomId, msg, opts, card))
                    .then((data) => res.sendStatus(200))
                    .then(() => hipchat.sendMessage(req.clientInfo, req.identity.roomId, `Was this question useful? ${helpMsg}`))
                ;
            }
        }
    );

    // Notify the room that the add-on was installed. To learn more about
    // Connect's install flow, check out:
    // https://developer.atlassian.com/hipchat/guide/installation-flow
    addon.on('installed', function (clientKey, clientInfo, req) {
        hipchat.sendMessage(clientInfo, req.body.roomId, 'The ' + addon.descriptor.name + ' add-on has been installed in this room');
    });

    // Clean up clients when uninstalled
    addon.on('uninstalled', function (id) {
        addon.settings.client.keys(id + ':*', function (err, rep) {
            rep.forEach(function (k) {
                addon.logger.info('Removing key:', k);
                addon.settings.client.del(k);
            });
        });
    });

};
