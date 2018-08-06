/*

WHAT IS THIS?

This module demonstrates simple uses of Botkit's conversation system.

In this example, Botkit hears a keyword, then asks a question. Different paths
through the conversation are chosen based on the user's response.

*/

module.exports = (controller) => {

    controller.hears(['what do i drive', 'mycar'], 'message_received', (bot, message) => {

        bot.startConversation(message, (err, convo) => {
          controller.storage.users.get(convo.context.user, (err, data) => {
            const car = { data }
            console.log(data)
            convo.say(`Your car is a ${car.year} ${car.make} ${car.model}`);

          });
        });
    });
};
