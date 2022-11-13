const CLIENT_ID = encodeURIComponent('74427a8256b04d7380c950c22a4620cb');
const RESPONSE_TYPE = encodeURIComponent('token');
const REDIRECT_URI = encodeURIComponent('https://cieieciokjekfacbglpdllcllpbibjdk.chromiumapp.org/');
const redirectUri = chrome.identity.getRedirectURL();
const SCOPE = encodeURIComponent('user-read-private user-read-email playlist-modify-public');
const SHOW_DIALOG = encodeURIComponent('true');
let STATE = '';
let ACCESS_TOKEN = '';

let user_signed_in = false;


function create_spotify_endpoint() {
    STATE = encodeURIComponent('meet' + Math.random().toString(36).substring(2, 15));

    let oauth2_url = 'https://accounts.spotify.com/authorize';
    oauth2_url += '?response_type=' + RESPONSE_TYPE;
    oauth2_url += '&client_id=' + CLIENT_ID;
    oauth2_url += '&scope=' + SCOPE;
    oauth2_url += `&redirect_uri=${redirectUri}`;
    oauth2_url += '&state=' + STATE;

    console.log(oauth2_url);

    return oauth2_url;
}

function getData(songName){
    return new Promise((resolve, reject) => {
        fetch(`https://api.spotify.com/v1/search?q=${songName}&type=track&limit=3`, {
            method: 'GET', headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + ACCESS_TOKEN
            }
        })
        .then((resp) => resp.json())
        .then((data) => resolve(data))
    })
}

function getURIs(songNames){
    console.log("song Names we get are :")
    console.log(songNames)
    result_uris = []
    promisesShit = []

    songNames.forEach(song => {
        promisesShit.push(getData(song))
    });

    Promise.all(promisesShit).then((allData) => {
        console.log("all Data:")
        console.log(allData)
        allData.forEach(data => {
            if(data.tracks.items.length > 0){
                result_uris.push(data.tracks.items[0].uri)
            }

        })
    })

    // allData.forEach(data => result_uris.push(data.tracks.items[0].uri))

    // for(let i = 0; i < songNames.length; i++){

    //     fetch(`https://api.spotify.com/v1/search?q=${songNames[i]}&type=track&limit=3`, {
    //         method: 'GET', headers: {
    //             'Accept': 'application/json',
    //             'Content-Type': 'application/json',
    //             'Authorization': 'Bearer ' + ACCESS_TOKEN
    //         }
    //     })
    //     .then(response => {
    //         response.json().then(
    //             (data) => {
    //                 console.log(data)
    //                 result_uris.push(data.tracks.items[0].uri)
    //             }
    //         );
    //     })
    //     .catch(err => {
    //         console.log(err)
    //     })
    // }

    return result_uris
}


// .then(response => {
//     response.json().then(
//         (data) => {
//             return data.id
//         }
//     );
// })
// .catch(err => {
//     console.log(err)
// }

async function getUserId(){

    const res = await fetch("https://api.spotify.com/v1/me", {
        method: 'GET', headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + ACCESS_TOKEN
        }
    })

    const kk = res.json()
    return kk
}

async function createPlaylist(userId){
    const res = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`,{
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + ACCESS_TOKEN,
            'Content-Length': 92
        },
        body: JSON.stringify({
            "name": "Spotifynder 2",
          })
    })

    return res.json()
}

function addSongsToPlaylist(songURIs, playlistId){
    fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`,{
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + ACCESS_TOKEN,
        },
        body: JSON.stringify({
            "uris": songURIs,
          })
    }).then(data => {
        return data.id
    })
}

function addURIsToPlaylist(songURIs){
    userId = getUserId()
    id = ''

    userId.then(data => {
        playlistId = createPlaylist(data.id)

        playlistId.then(data2 => {
            console.log("data2:")
            console.log(data2)
            addSongsToPlaylist(songURIs, data2.id)
        })

    }).catch(err => {
        console.log(err.message)
    })


}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'login') {
        if (user_signed_in) {
            console.log("User is already signed in.");
        }
        else {
            // sign the user in with Spotify
            chrome.identity.launchWebAuthFlow({
                url: create_spotify_endpoint(),
                interactive: true
            },
            async function (redirect_url) {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    sendResponse({ message: 'fail' });
                }
                else {
                    if (redirect_url.includes('callback?error=access_denied')) {
                        sendResponse({ message: 'fail' });
                    }
                    else {
                        ACCESS_TOKEN = redirect_url.substring(redirect_url.indexOf('access_token=') + 13);
                        ACCESS_TOKEN = ACCESS_TOKEN.substring(0, ACCESS_TOKEN.indexOf('&'));
                        let state = redirect_url.substring(redirect_url.indexOf('state=') + 6);

                        if (state === STATE) {
                            console.log("SUCCESS")
                            console.log(ACCESS_TOKEN)
                            user_signed_in = true;

                            //can comment out setTiemout part if wanted
                            // setTimeout(() => {
                            //     ACCESS_TOKEN = '';
                            //     user_signed_in = false;
                            // }, 3600000);

                            chrome.browserAction.setPopup({ popup: './popups/signedIn.html' }, () => {
                                sendResponse({ message: 'success' });
                            });

                            sendAndGetData()
                            // res.then(songNames => {
                            //     //songNames = ["better my boobs", "butter", "john coltrane"]

                            //     let songURIs = getURIs(songNames)
                            //     console.log(songURIs)
                            //     addURIsToPlaylist(songURIs)
                            // })
                            // const data = sendAndGetData()
                            // data.then(songNames => {
                            //     //songNames = ["better my boobs", "butter", "john coltrane"]

                            //     let songURIs = getURIs(songNames)
                            //     console.log(songURIs)
                            //     addURIsToPlaylist(songURIs)
                            // })





                        } else {
                            sendResponse({ message: 'fail' });
                        }
                    }
                }
            });

        }

      return true;
    }
    else if (request.message === 'logout') {
        user_signed_in = false;
        chrome.browserAction.setPopup({ popup: './popups/login.html' }, () => {
            sendResponse({ message: 'success' });
        });

        return true;
    }
});

function sendAndGetData(){
    getActiveTab( tab => {
        chrome.tabs.sendMessage(tab.id, {message: "get data"}, async (string) => {
            const res = await fetch("http://127.0.0.1:5000/", {
                method: 'POST',
                headers:{
                    "Content-Type": 'application/json'
                },
                body: JSON.stringify({
                    "Request Type": 'Songify Page',
                    "Model": 1,
                    "Data": string
                }) // string or object
            })
            res.json().then(data => {
                songNames = data.Songs
                doStuff2(songNames).then(songURIs=> {

                    console.log(songURIs)
                    addURIsToPlaylist(songURIs)
                })



            })
    })})
}

async function doStuff2(songNames){
    let songURIs = await getURIs(songNames)
    return songURIs
}

var activeTabId;

chrome.tabs.onActivated.addListener(function(activeInfo) {
  activeTabId = activeInfo.tabId;
});

function getActiveTab(callback) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    var tab = tabs[0];

    if (tab) {
      callback(tab);
    } else {
      chrome.tabs.get(activeTabId, function (tab) {
        if (tab) {
          callback(tab);
        } else {
          console.log('No active tab identified.');
        }
      });

    }
  });
}