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
}
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