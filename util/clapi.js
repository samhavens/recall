const http = require('http');
const querystring = require('querystring');
const zlib = require('zlib');
const request = require('request');

// Request dealer info 
const URL_TYPE = 'link_button';
const pageType = {
  INCENTIVES: 'incentives',
  INCENTIVE_DETAIL: 'incentive_detail',
  INVENTORY: 'inventory',
  INVENTORY_DETAIL: 'inventory_detail',
  TRIM_SELECTOR: 'trim_selector',
  FINANCE_CALCULATOR: 'finance_calculator',
  EXTERNAL: 'external',
  DEALER: 'dealer',
};
  
const CLAPI_PATH = '/clapi/clql-api/query'
const CLAPI_ROOT_URL = process.env.CLAPI_URL

const dealersToSpeakForm = (dealers) => {
  return dealers.map((dealer, i) => {
    const template = {
      title: `${dealer.dealer_name}`,
      subtitle: `${dealer.address} ${dealer.city}, ${dealer.state}`,
      // link: `https://www.google.com/maps/place/${dealer.dealer_name.replace(/\s+/g, '+')}`,
      image: `https://maps.googleapis.com/maps/api/staticmap?markers=color:red%7Clabel:${i + 1}%7C${dealer.address.replace(/\s+/g, '+')}+${dealer.state}+${dealer.zip.slice(0, 5)}&size=1337x700&zoom=13&key=${process.env.GOOGLE_STATIC_MAPS_KEY}`,
      buttons: [],
    };
    if (dealer.phone) {
      template.buttons.push({
        type: URL_TYPE,
        label: 'Call Dealership',
        payload: `${process.env.SERVER_URL}dealer${dealer.params}`,
      });
    }
    template.buttons.push({
      type: URL_TYPE,
      label: 'Get Directions',
      payload: `https://www.google.com/maps/place/${dealer.dealer_name.replace(/\s+/g, '+')}`,
    });
    if (dealer.website) {
      template.buttons.push({
        type: URL_TYPE,
        label: 'Dealer Website',
        payload: dealer.website,
        logParams: { pageType: pageType.DEALER },
      });
    }
    return template;
  });
}

const fixDealers = (dealers) => {
  console.log({dealers})
  for (let dealer of dealers) {
    dealer = dealer.nearestDealers;
    console.log({dealer})
    // We need to clean the phone number due to data inconsistencies (remove 'Ext' or 'x' from phone numbers)
    // We also need to set the params for the URL when the user attempts to call the dealer so we can log it
    const normalizedPhone = dealer.phone.toLowerCase();
    const xOrExt = normalizedPhone.includes('ext') ? normalizedPhone.indexOf('ext') : normalizedPhone.indexOf('x');
    const number = xOrExt >= 0 ? normalizedPhone.slice(0, xOrExt) : normalizedPhone;
    dealer.phone_number = number;
    dealer.params = `?phone=${number}&did=${dealer.dealer_id}`;
  }
  return dealers
}

const parseResult = (cb, result) => {
  try {
    const data = JSON.parse(result);
    cb(null, data);
  } catch (e) {
    cb(e);
  }
}

/**
  * Function sends query message to CLAPI
**/

const clapiCall = (dealerRequest, path, cb) => {
  //const queryString = JSON.stringify(dealerRequest);
  const url = `http://${path}`;
  console.log({url})
  return request({
    url,
    method: 'POST',
    json: dealerRequest,
    gzip: true,
    encoding: undefined, // defaults to utf-8
    headers: {
      'Content-Type': 'text/json',
      'Accept-Encoding': 'gzip',
    }
  }, (err, resp, body) => {
    if (err) console.log({err});
    let e = null;
    let clapiResp = {"status":666,"msg":"CANNED RESPONSE, FROM JS CODE","dbg":"API Version 1.48.0\n1. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n2. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n3. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n4. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n5. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n6. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n7. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n8. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n9. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n10. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n11. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n12. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n13. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n14. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n15. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n16. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n17. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n18. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n19. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n20. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n21. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n22. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n23. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n24. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n25. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n26. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n27. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n28. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n29. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n30. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n31. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n32. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n33. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n34. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n35. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n36. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n37. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n38. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n39. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n40. ---*app\\common\\api\\CLQLReqMgr::recurseMapRequestingSection\n41. ---*app\\common\\api\\CLQLReqMgr::mapCLQLRec\n42. SQ Error Code : 0,  Query : select (performance * 9 + safety * 5) / 14 as average_score, trim.* from trim where (make_name = 'hyundai') order by price_invoice limit 20 offset 60\n43. ---*app\\common\\api\\CLQLReqMgr::getInternalRequestingSection\n44. ---*app\\common\\api\\CLQLReqMgr::getInternalScoreSection\n45. ---*app\\common\\api\\CLQLReqMgr::getInternalFetchSection\n46. ---*---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLValidElements\n47. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n48. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLValidElementsByFldName\n49. ---*app\\common\\api\\CLQLReqMgr::getInternalConstraintsSection\n50. ---*app\\common\\api\\CLQLReqMgr::getInternalQuery\n51. ---*---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLSortable\n52. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n53. ---*---*---*app\\common\\api\\CLQLReqMgr::isSortableField\n54. ---*---*app\\common\\api\\CLQLReqMgr::isValidFetchSection\n55. ---*---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLScoreable\n56. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n57. ---*---*---*app\\common\\api\\CLQLReqMgr::isScoreableField\n58. ---*---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLScoreable\n59. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n60. ---*---*---*app\\common\\api\\CLQLReqMgr::isScoreableField\n61. ---*---*app\\common\\api\\CLQLReqMgr::isValidScoreSection\n62. ---*---*---*app\\common\\api\\CLQLReqMgr::hasVaildConstraintType\n63. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n64. ---*---*app\\common\\api\\CLQLReqMgr::isValidConstraintsSection\n65. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n66. ---*---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLValidElements\n67. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n68. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLValidElementsByFldName\n69. ---*---*---*app\\common\\api\\CLQLReqMgr::getCLQLFldData\n70. ---*---*app\\common\\api\\CLQLReqMgr::recurseRequestingSection\n71. ---*---*app\\common\\api\\CLQLReqMgr::isValidRequestingSection\n","data":[{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]},{"nearestDealers":[{"dealer_id":"1611","sub_id":"","dealer_name":"Ladin Hyundai","dealer_hours":"","address":"3725 Auto Mall Dr","city":"Thousand Oaks","state":"CA","zip":"91362-3612","phone":"8054093230","website":"www.ladinhyundai.com","email":"","distance":"15.5"}]}]};
    try {
      console.log({resp, body})
      const clapiResp = JSON.parse(body);
    } catch(error) {
      console.log({error});
      e = error
    } finally {
      cb(e, clapiResp);
      
    }
    
  });
//   const clapiOptions = {
//     hostname: process.env.CLAPI_URL,
//     port: process.env.CLAPI_PORT || 80,
//     path: `${path}?query=${JSON.stringify(dealerRequest)}`,
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//       'Accept-Encoding': 'gzip',
//     },
//   };
//   const req = http.request(clapiOptions, (res) => {
//     const chunks = [];
//     res.on('data', (chunk) => {
//       chunks.push(chunk);
//     });

//     res.on('end', () => {
//       if (res.statusCode !== 200)
//         return cb(new Error('Clapi returned status code ' + res.statusCode));

//       const buffer = Buffer.concat(chunks);
//       const encoding = res.headers['content-encoding'];
//       if (encoding === 'gzip') {
//         zlib.gunzip(buffer, (err, decoded) => {
//           if (err) {
//             cb(err, null);
//           }
//           parseResult(cb, decoded.toString());
//         });
//       } else {
//         parseResult(cb, buffer.toString('utf8'));
//       }
//     });
//   });

//   req.on('error', (e) => {
//     cb(e);
//   });
//   // this is how CLAPI accepts info, our request must be in an object under the key 'query'

//   req.write(JSON.stringify(dealerRequest));
//   req.end();

}

const clapi = (car, zip, cb) => {
  
  const CLAPI_URL = CLAPI_ROOT_URL + CLAPI_PATH
  let request = {}
  request.system = {
    "_debug"    : false,
    "_verbose"  : true,
    "userToken" : "1f3870be274f6c49b3e31a0c6728957f"
  }
  request.requesting = [{
    nearestDealers: {
      zip_code: parseInt(zip, 10)
    }
  }];
  request.constraints = {
    make: [car.make]
  };
  request.score = {
    "performance": 1, // this doesn't matter
  },

  request.fetch = {
    "sort": "priceInvoice",
    "limit": 20,
    "offset": 60
  },
  
  console.log({request, CLAPI_URL})
  
  // Call CLAPI at URL with request
  clapiCall(request, CLAPI_URL, cb);
  
}

/**
  * Makes a CLAPI dealer request
  * accepts car object (make, model, year) - only make is required
  * accepts zip - string
  * returns {text: text to say, gallery: gallery to display}
  */
module.exports = {
  clapi,
  fixDealers,
  dealersToSpeakForm
};
