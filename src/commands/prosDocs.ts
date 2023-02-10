import * as cheerio from 'cheerio';
import * as vscode from "vscode";
import axios from 'axios';


//api names must be legal variable names
var prosJson = {
    "namespace": "pros",
    "url": "https://purduesigbots.github.io/pros-doxygen-docs/api.html",
    "apis": {
   "cpp": {
    "members": [
      {
        "name": "Motor",
        "url": "https://purduesigbots.github.io/pros-doxygen-docs/group__cpp-motors.html",
        "functions": [{"name" : "move", "url" : ""}]
      }
      ],
    },
    "c": {
      "members": [
        {
          "name": "Motor",
          "url": "https://purduesigbots.github.io/pros-doxygen-docs/group__c-motors.html",
          "functions": [{"name" : "move", "url" : ""}]
        }
      ]
    }
  

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
//needs to be update to use new json
export function parseJSON(keyword: string){
    var final_website = "";
    if (keyword === prosJson.namespace){
        final_website = prosJson.url;
    }
    else{
      var api_members;
      if(vscode.workspace.getConfiguration("pros").get<string>("integratedDocsLanguage") === "cpp"){
        var r = vscode.workspace.getConfiguration("pros").get<string>("integratedDocsLanguage");
        api_members = prosJson.apis.cpp.members;
      }
      else{
        api_members = prosJson.apis.c.members;
      }
      for(var i: number = 0; i < prosJson.apis.cpp.members.length; i += 1 ){
        var final_obj = api_members[i].functions.filter(prosMember=>{
            return prosMember.name === keyword;
        }
        );
        if(final_obj.length !== 0 ){
          final_website = final_obj[0].url;
        }
    }
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
        var regex_result;
        
        do {
          regex_result = link_regex.exec(html);
          if (regex_result) {
              //console.log(m[0], m[1], m[2],m[-1]);
              //checks if link is in c or cpp
              if( regex_result[1].indexOf("group__cpp") !== -1){
                prosJson.apis.cpp.members.push({"name": regex_result[2],"url": pros_base_url + regex_result[1], "functions": []});
              }
              else{
                prosJson.apis.c.members.push({"name": regex_result[2],"url": pros_base_url + regex_result[1],"functions": []});
              }
              main_links.push(regex_result[1]);
              
              
          }
      } while (regex_result);
      //deletes the temporary placeholder motor json in members so it isn't processed.
      prosJson.apis.c.members.shift();
      prosJson.apis.cpp.members.shift();
      });
      // Go to class links and scrape functions from each link
    for (var i: number = 0; i < prosJson.apis.cpp.members.length; i+= 1){

      var sublink_html = prosJson.apis.cpp.members[i].url;
      await AxiosInstance.get(sublink_html,{timeout: 5000})
    .then( 
      response => {
        const html = response.data; // Gets HTML from individual member webpage
        //console.log(html);
        
        var regex_result;
        //finds each link using sublink regex and stores it to member functions list
        do {
            regex_result = sublink_regex.exec(html);
            if (regex_result) {
                //console.log(m[0], m[1], m[2]);
                prosJson.apis.cpp.members[i].functions.push({"name": regex_result[3],"url": sublink_html + regex_result[1]});
            }
        } while (regex_result);
      });

      }
}

//ParseJSON("Motor");
loadJsonNew().then(() => {
  parseJSON("move_absolute");
});



