/*

Botkit Studio Skill module to enhance the "recall" script

*/

const url = (car) => `${process.env.NHTSA_API_ROOT}modelyear/${car.year}/make/${car.model}/model/${car.model}${process.env.NHTSA_API_SUFFIX}`

module.exports = function(controller) {
    // define a before hook
    // you may define multiple before hooks. they will run in the order they are defined.
    controller.studio.before('recall', function(convo, next) {

        // do some preparation before the conversation starts...
        // for example, set variables to be used in the message templates
        // convo.setVar('foo','bar');

        console.log('BEFORE: recall', {...car});
      
        // don't forget to call next, or your conversation will never continue.
        next();

    });

    /* Validators */

    // Validate user input: favorite_color
    controller.studio.validate('recall','car', function(convo, next) {

        var value = convo.extractResponse('car');

        // test or validate value somehow
        // can call convo.gotoThread() to change direction of conversation

        console.log('VALIDATE: demo VARIABLE: favorite_color');

        // always call next!
        next();

    });

    // define an after hook
    // you may define multiple after hooks. they will run in the order they are defined.
    controller.studio.after('demo', function(convo, next) {

        console.log('AFTER: demo');

        // handle the outcome of the convo
        if (convo.successful()) {

            var responses = convo.extractResponses();
            // do something with the responses

        }

        // don't forget to call next, or your conversation will never properly complete.
        next();
    });
}
