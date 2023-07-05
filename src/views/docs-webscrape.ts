import * as cheerio from "cheerio";
import * as vscode from "vscode";
import axios from "axios";

//JSON object storing urls for different class methods
//Sorts by api (C and C++)
var prosJson = {
  namespace: "pros",
  url: "https://purduesigbots.github.io/pros-doxygen-docs/api.html",
  apis: {
    cpp: {
      members: [
        {
          name: "Motor",
          url: "https://purduesigbots.github.io/pros-doxygen-docs/group__cpp-motors.html",
          functions: [{ name: "move", url: "" }],
        },
      ],
    },
    c: {
      members: [
        {
          name: "Motor",
          url: "https://purduesigbots.github.io/pros-doxygen-docs/group__c-motors.html",
          functions: [{ name: "move", url: "" }],
        },
      ],
    },
  },
};

const namespaceOnly = [
  "C++ API for the V5 Screen",
  "C++ API for LLEMU (Legacy Lcd EMUlator)",
  "C++ API for Color Values",
];

//Parses JSON object to return website for different keywords.
//Does not take class type into account, it only evaluates by name
//Will currently return duplicate methods and might direct user to wrong class API page
export function parseJSON(
  keyword: string,
  namespace: string | undefined = undefined
) {
  // we need to map the "namespace" that appears in the code to it's actual namespace name in the docs
  // eg "lcd" -> "PROS LLEMU"
  var finalWebsite: string = "";
  if (keyword === prosJson.namespace) {
    finalWebsite = prosJson.url;
  } else {
    var apiMembers;
    if (
      vscode.workspace
        .getConfiguration("pros")
        .get<string>("Integrated Docs Language") === "cpp"
    ) {
      apiMembers = prosJson.apis.cpp.members;
    } else {
      apiMembers = prosJson.apis.c.members;
    }

    if (namespace !== undefined && namespace !== "") {
      // if there is a . in namespace, we need to remove the namespaceOnly items from apiMembers

      if (namespace.includes(".")) {
        apiMembers = apiMembers.filter((m) => !namespaceOnly.includes(m.name));
        namespace = "";
      } else {
        console.log("namespace: " + namespace);
        apiMembers = apiMembers.filter((m) =>
          m.name.toLowerCase().replace(/\s/g, "").includes(namespace)
        );
      }
    }

    for (let apiMember of apiMembers) {
      // check if keyword is == api member name or if keyword is in api member functions
      if (keyword === apiMember.name) {
        finalWebsite = apiMember.url;
        break;
      }

      for (let func of apiMember.functions) {
        if (keyword === func.name) {
          finalWebsite = func.url;
          break;
        }
      }

      if (finalWebsite !== "") {
        break;
      }
    }
  }

  if (finalWebsite === "" && namespace !== undefined && namespace !== "") {
    finalWebsite = parseJSON(keyword);
  }
  return finalWebsite;
}

// most recent json loading function
// needed for either website
// uses regex to parse html
export async function populateDocsJSON() {
  const axiosInstance = axios.create(); // Create a new Axios Instance

  const url = "https://purduesigbots.github.io/pros-doxygen-docs/api.html"; // PROS Doxygen url
  const prosBaseUrl = "https://purduesigbots.github.io/pros-doxygen-docs/";

  const linkRegex = /<a href="(.{0,30})" class="m-doc">(.{0,40})<\/a>/g;

  const sublinkRegex =
    /<a href="(#.{0,60})" class="(m-doc-self|m-doc)">(.{0,30})<\/a>/g;

  var mainLinks: string[] = [];
  //go to and scrape api homepage
  // Send an async HTTP Get request to the url
  await axiosInstance.get(url, { timeout: 5000 }).then(
    // Once we have data returned ...
    (response) => {
      const html = response.data; // Get the HTML from the HTTP request
      //console.log(html);
      var regexResult;

      do {
        regexResult = linkRegex.exec(html);
        if (regexResult) {
          //console.log(m[0], m[1], m[2],m[-1]);
          //checks if link is in c or cpp
          if (regexResult[1].indexOf("group__cpp") !== -1) {
            prosJson.apis.cpp.members.push({
              name: regexResult[2],
              url: prosBaseUrl + regexResult[1],
              functions: [],
            });
          } else {
            prosJson.apis.c.members.push({
              name: regexResult[2],
              url: prosBaseUrl + regexResult[1],
              functions: [],
            });
          }
          mainLinks.push(regexResult[1]);
        }
      } while (regexResult);
      //deletes the temporary placeholder motor json in members so it isn't processed.
      prosJson.apis.c.members.shift();
      prosJson.apis.cpp.members.shift();
    }
  );
  // Go to class links and scrape functions from each link
  for (var i: number = 0; i < prosJson.apis.cpp.members.length; i += 1) {
    var sublinkHtml = prosJson.apis.cpp.members[i].url;
    await axiosInstance.get(sublinkHtml, { timeout: 5000 }).then((response) => {
      const html = response.data; // Gets HTML from individual member webpage
      //console.log(html);

      var regexResult;
      //finds each link using sublink regex and stores it to member functions list
      do {
        regexResult = sublinkRegex.exec(html);
        if (regexResult) {
          //console.log(m[0], m[1], m[2]);
          prosJson.apis.cpp.members[i].functions.push({
            name: regexResult[3],
            url: sublinkHtml + regexResult[1],
          });
        }
      } while (regexResult);
    });
  }

  console.log(prosJson);
}

export const debugDocsJson = () => {
  console.log(prosJson);
};
