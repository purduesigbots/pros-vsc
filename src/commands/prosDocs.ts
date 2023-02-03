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

async function loadJsonOld(){
  var base_url = "https://pros.cs.purdue.edu/v5/api/cpp/";
}


async function loadJSON(){
  var final_websites = "";
  const AxiosInstance = axios.create(); // Create a new Axios Instance
 
  const url = 'https://purduesigbots.github.io/pros-doxygen-docs/api.html'; // PROS Doxygen url
  const pros_base_url = "https://purduesigbots.github.io/pros-doxygen-docs/";
  var variable: any;
  var final_link = "";
  // go to and scrape api link
  // Send an async HTTP Get request to the url
  await AxiosInstance.get(url,{timeout: 5000})
    .then( // Once we have data returned ...
      response => {
        const html = response.data; // Get the HTML from the HTTP request
        console.log(html);
        
        const link_regex: RegExp = RegExp('<a href="(.+)" class="(.+)">(.+)</a>');
        const sublink_regex: RegExp = RegExp('<a href="(.+)" class="m-doc-self">(.+)</a>');
      


    // In other environments:
        const cheerio = require('cheerio');
        const $ = cheerio.load('ul',html);
        const link_html = $('<ul>');
        const links = $('li'); //jquery get all hyperlinks
        const links_c = $(links[0]).attr('href');
        const links_cpp = $(links[1]).attr('href'); 

        //load all initial hyperlinks into JSON
        for (var i:number = 0;i <= links.length; i+=1){
            var link:String  = $(links[i]).attr("href");
  
            json.members.push({name: String($(links[i]).text()),members: [{}], url: $(links[i]).attr("href")});
        }
        console.log(json);
    })
    .catch(error => {
      console.log(error.response.data.error);
    });
    //travel to each link and scrape function links from link
    for (var i: number = 0;i<=json.members.length; i+=1 ){
      var subgroup_url = pros_base_url+ json.members[i].url;
      if(subgroup_url.length > 8+pros_base_url.length){
      console.log(subgroup_url);
      await AxiosInstance.get(subgroup_url,{timeout: 5000})
    .then( // Once we have data returned ...
      response => {
        const html = response.data; // Get the HTML from the HTTP request
        console.log(html);

    // In other environments:
        const cheerio = require('cheerio');
        const $ = cheerio.load(html);
        const sub_links = $('a'); //jquery get all hyperlinks
        //load all initial hyperlinks into JSON
        for (var i:number = 0;i <= sub_links.length; i+=1){
            json.members[i].members.push({"name:":  $(sub_links[i]).text(),"url": subgroup_url+$(sub_links[i]).attr('href')});
        }
        console.log(json);
    });
    }
  }
    
  console.log(final_link+"Printed");
  
 }
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
  const link_regex: RegExp = RegExp('<a href="(.{0,30})" class="m-doc">(.{0,35})<\/a>');
  const sublink_regex: RegExp = RegExp('<a href="(.{0,30})" class="m-doc-self">(.{0,30})<\/a>');
  var main_links = [];
  var function_links = [];
  //go to and scrape api homepage
  // Send an async HTTP Get request to the url
  await AxiosInstance.get(url,{timeout: 5000})
    .then( // Once we have data returned ...
      response => {
        const html = response.data; // Get the HTML from the HTTP request
        console.log(html);
        
        
        var links = [];
        var m;
        do {
          m = link_regex.exec(html);
          if (m) {
              console.log(m[0], m[1], m[2]);
              main_links.push(m[1]); 
          }
      } while (m);
      });
      // Go to class links and scrape functions from each link
        for (var i: number = 0; i < main_links.length; i+= 1){
          await AxiosInstance.get(url,{timeout: 5000})
    .then( // Once we have data returned ...
      response => {
        const html = response.data; // Get the HTML from the HTTP request
        console.log(html);
        
        
        var m;

        do {
            m = sublink_regex.exec(html);
            if (m) {
                console.log(m[0], m[1], m[2]);
                prosJson.language.members.push({"name":m[2], "url": m[0]});
            }
        } while (m);
      });

        }
}

//ParseJSON("Motor");
loadJsonNew();
console.log(json);
console.log("Done");
