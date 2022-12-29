import * as cheerio from 'cheerio';
import axios from 'axios';
var prosJson = {
    "namespace": "pros",
    "url": "https://pros.cs.purdue.edu/v5/index.html",
    "language": {
    "name": "C++",
    "members": [
      {
        "name": "Motor",
        "url": "https://pros.cs.purdue.edu/v5/api/cpp/motors.html"
      },
      {
        "name": "ADI",
        "url": "https://pros.cs.purdue.edu/v5/api/cpp/adi.html"
      },
      {
        "name": "optical",
        "url": "https://pros.cs.purdue.edu/v5/api/cpp/optical.html"
      },
      {
        "name": "rotation",
        "url": "https://pros.cs.purdue.edu/v5/api/cpp/rotation.html"
      },
      {
        "name": "Controller",
        "url": "https://pros.cs.purdue.edu/v5/api/cpp/misc.html#pros-controller"
      }
    ],
    "names":[
        "Motor",
        "ADI",
        "optical",
        "rotation"
    ]
},
"lang2":{
    "name": "C",
    "members": [
        {
        "name": "Motor",
        "url": ""
        },
        {
        "name": "ADI",
        "url": ""
        }
    ]
}
};

var PROSJSON = {
  "namespace": 'pros',
  "members": [
    {
      "name": "Motors",
      "members": [
        "Motor",
        "move_velocity",
        "move_voltage",
        "move",
        "move_absolute",
        "move_relative",
        "brake",
        "modify_profiled_velocity",
        "get_target_position"
      ]
    }
  ]
};


function find_file(keyword: string,json:any){
    return json.name === keyword;
}
export function parseJSON(keyword: string){
    var final_website = "";
    if (keyword === prosJson.namespace){
        final_website = prosJson.url;
    }
    else{
        var final_obj = prosJson.language.members.filter(prosMember=>{
            return prosMember.name === keyword;
        }
        );
        final_website = final_obj[0].url;
    }
    return final_website;
}

export function ParseJSON(keyword: string){


  const url = 'https://purduesigbots.github.io/pros-doxygen-docs/api.html'; // URL we're scraping
  //find keywords for initial webpage of keyword.
  var final_website = "";
      if (keyword === PROSJSON.namespace){
          final_website = PROSJSON.namespace;
      }
      else{
          var final_obj = PROSJSON.members.filter(prosMember=>{
              return keyword in prosMember.members ;
          }
          );
          final_website = final_obj[0].name;
          console.log(final_website);
      }
  const AxiosInstance = axios.create(); // Create a new Axios Instance
  if (final_website === "pros"){
    return url;
  }
  else{
    var variable= '';
    // Send an async HTTP Get request to the url
    AxiosInstance.get(url)
      .then( // Once we have data returned ...
        response => {
          const html = response.data; // Get the HTML from the HTTP request
          

      // In other environments:
          const cheerio = require('cheerio');
          const $ = cheerio.load(html);
          variable = $(final_website+'C++ API</a></li><li><)').attr("href");

          console.log(variable+"Printed");
        
      });
      
    console.log(variable+"Printed");
    return variable;
  }
}

 
ParseJSON("Motors");