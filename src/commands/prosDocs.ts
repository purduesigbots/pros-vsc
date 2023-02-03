import * as cheerio from 'cheerio';
import axios from 'axios';
import { CodeLens } from 'vscode';
import internal = require('stream');
import { linkSync } from 'fs';
import { Range } from 'semver';
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

    ],
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
var json ={"name:": "pros",
          "name": "",
          "members": [{
            "name": "",
              "members": [{}],
              "url": ""
          }]};

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

export async function ParseJSON(keyword: string){


  const url = 'https://purduesigbots.github.io/pros-doxygen-docs/api.html'; // URL we're scraping
  //find keywords for initial webpage of keyword.
  var final_website = "";
      if (keyword === PROSJSON.namespace){
          final_website = PROSJSON.namespace;
      }

      else{

          var final_obj = PROSJSON.members.filter(prosMember=> prosMember.members.filter(memberFunc=> memberFunc === keyword));

          if (final_obj.length > 0) {
          final_website = final_obj[0].name;
          console.log(final_website);
          }

      }
}




var loadJsonFinished = false;
// most recent json loading function
// needed for either website
// uses regex to parse html
 async function loadJsonNew(){
  var final_websites = "";
  const AxiosInstance = axios.create(); // Create a new Axios Instance
 
  const url = 'https://purduesigbots.github.io/pros-doxygen-docs/api.html'; // PROS Doxygen url
  const pros_base_url = "https://purduesigbots.github.io/pros-doxygen-docs/";
  var variable: any;
  var final_link = "";
  const link_regex = /<a href="(.{0,30})" class="m-doc">(.{0,35})<\/a>/g;
  const sublink_regex = /<a href="(#.{0,60})" class="(m-doc-self|m-doc)">(.{0,30})<\/a>/g;
  var main_links: [string]= [""];
  main_links.pop();
  var function_links = [];
  //go to and scrape api homepage
  // Send an async HTTP Get request to the url
  await AxiosInstance.get(url,{timeout: 5000})
    .then( // Once we have data returned ...
      response => {
        const html = response.data; // Get the HTML from the HTTP request
        //console.log(html);
        
        
        var links = [];
        var m;
        
        do {
          m = link_regex.exec(html);
          if (m) {
              //console.log(m[0], m[1], m[2],m[-1]);
              main_links.push(m[1]); 
          }
      } while (m);
      });
      // Go to class links and scrape functions from each link
        for (var i: number = 0; i < main_links.length; i+= 1){
          var sublink_html=pros_base_url+main_links[i]
          await AxiosInstance.get(sublink_html,{timeout: 5000})
    .then( // Once we have data returned ...
      response => {
        const html = response.data; // Get the HTML from the HTTP request
        //console.log(html);
        
        
        var m;

        do {
            m = sublink_regex.exec(html);
            if (m) {
                //console.log(m[0], m[1], m[2]);
                prosJson.language.members.push({"name":m[3], "url": sublink_html + m[1]});
            }
        } while (m);
      });

        }
}

//ParseJSON("Motor");
loadJsonNew().then(() => {
  parseJSON("move_absolute");
});



