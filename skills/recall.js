/*

Botkit Studio Skill module to enhance the "recall" script
@TODO replace https with got

*/
const got = require('got');
const https = require('https');
const _ = require('lodash');

const clapi = require('../util/clapi');

const URL = 'api.api.ai';

module.exports = function(controller) {
   /**
     * Function sends query message to api.ai. Converted https request into promise.
     * @param {string} text - Query message text
     * @return {promise} - Pending promise of https request
   **/
  function apiAiHttpsRequest(text, sessionId, cb, path="query", method="POST") {
     // api.ai request options assembled properly for https.request method
    const apiAiOptions = {
      hostname: URL,
      path: `/v1/${path}`,
      method,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${process.env.DF_CLIENT_ACCESS_TOKEN}`,
      },
    };

    const query = JSON.stringify({
      q: text,
      lang: 'en',
      sessionId,
    });
    const req = https.request(apiAiOptions, (res) => {
      let resData = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        resData += chunk;
      });
      res.on('end', () => {
        if (res.statusCode !== 200)
          return cb(new Error('ApiAi returned status code ' + res.statusCode));

        const action = _.get(JSON.parse(resData),['result','action']);
        if (action === 'input.unknown') {
          cb(null, JSON.parse(resData), 0);        
        } else {
          cb(null, JSON.parse(resData));
        }
      });
    });

    req.on('error', (e) => {
      cb(e);
    });

    req.write(query);
    req.end();
  }

  const getRecallUrl = (car) => `${process.env.NHTSA_API_ROOT}modelyear/${car.year}/make/${car.make}/model/${car.model}${process.env.NHTSA_API_SUFFIX}`;

  
    // define a before hook
    // you may define multiple before hooks. they will run in the order they are defined.
    controller.studio.before('recall', function(convo, next) {

        // do some preparation before the conversation starts...
        // for example, set variables to be used in the message templates
        // convo.setVar('foo','bar');

        controller.storage.users.save({id: convo.context.user, initiatedRecall: 1}, err => console.log(err));

      
        console.log('BEFORE: recall');
        //console.log({convo});
      
        // don't forget to call next, or your conversation will never continue.
        next();

    });

    /* Validators */

    // Validate user input: recall
    controller.studio.validate('recall','car_text', function(convo, next) {

        const carText = convo.extractResponse('car_text');
        const carUcFirst = carText.split(' ').map(_.upperFirst).join(' ');
        const sessId = Math.floor(Math.random() * Math.floor(1000000));
      
        const setVar = (err, x) => {
          if (err) console.log(err);

          const car = _.get(x,['result','parameters', 'car', '0']);
          
          controller.storage.users.get(convo.context.user, err, data => {
            if (err) console.log(err);
            const update = {...data, car: JSON.stringify(car)}
            controller.storage.users.save(update)
          });
          
          const recallUrl = getRecallUrl(car);
          console.log({recallUrl});
          
          got(recallUrl).then(response => {
            // have recall info!
            const recallString = response.body;
            controller.storage.users.get(convo.context.user, err, data => {
              if (err) console.log(err);
              const update = {...data, recallString}
              controller.storage.users.save(update)
            });
            
            const recall = JSON.parse(recallString)
            console.log("HERE: ", {recall})
            const count = recall["Count"];
            convo.setVar('count', count);
            let recalls = [];
            if (count > 0) {
              const recall_list = recall["Results"];
              convo.setVar('recall_list', recall_list);
              
              convo.addMessage(`Your ${carUcFirst} is affected by ${count} recalls`, 'please_work');
              recalls = _
                .chain(recall_list)
                .map(x => {
                  return {
                    component: x.Component,
                    summary: x.Summary,
                    conequence: x.Conequence,
                    remedy: x.Remedy,
                    notes: x.Notes
                  };
                })
                .uniq()
                .value();
              recalls.forEach((x, i) => {
                // Generate list of "component: blah blah"
                _.forOwn(x, (key, val) => {
                  // why are key and val switched??
                  convo.addMessage('*' + _.upperFirst(val) + ':* ' + key, 'please_work');
                });
                
                
              });
              convo.gotoThread('please_work');
              
              convo.addMessage({text: 'get dealers!', action: 'stop'}, 'dealer_thread');
              convo.addMessage('not a zip', 'bad_response');
              // Create a yes/no question in the default thread...
              convo.ask('If you give me your zip code, I can give you contact info for dealers who can fix this for free', [
                  {
                      pattern:  /\d{5}/,
                      callback: function(response, convo) {
                          const zip = response.text;
                          const afterClapi = (err, dealersRaw) => {
                            if (err) console.warn({err});
                            console.log({dealersRaw})
                            const dealers = clapi.fixDealers(dealersRaw.data)
                            const text = `Here are ${dealers.length} ${car.make} dealers in your area that can fix the recalled component(s) free of charge.`
                            const gallery = clapi.dealersToSpeakForm(dealers)
                            
                            convo.say(text);
                            convo.next();
                            //return {text, gallery} // maybe returning is confusing sync and async
                          }
                          //const {text, gallery} = 
                                clapi.clapi(car, zip, afterClapi);
                          
                      },
                  },
                  {
                      default: true,
                      callback: function(response, convo) {
                          convo.gotoThread('bad_response');
                      },
                  }
              ]);
            } else {
              convo.addMessage(`Congratulations, your ${carUcFirst} isn't affected by a recall`, 'rec_res');
              convo.gotoThread('rec_res');
            }
            

            convo.next();
            next();
          }).catch(e => {
            console.log(e);
            next();
          });
          
        };
        
      
        apiAiHttpsRequest(carText, sessId, setVar);

        // test or validate value somehow
        // can call convo.gotoThread() to change direction of conversation

        console.log('VALIDATE: variable: ');

        // always call next!
        // next();

    });

    // define an after hook
    // you may define multiple after hooks. they will run in the order they are defined.
    controller.studio.after('recall', function(convo, next) {

        console.log('AFTER: recall');

        // handle the outcome of the convo
        if (convo.successful()) {

            var responses = convo.extractResponses();
            console.log({responses})
            next();
        }

    });
}
