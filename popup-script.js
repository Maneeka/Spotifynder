document.querySelector('#sign-in').addEventListener('click', function () {

    chrome.runtime.sendMessage({ message: 'login' }, function (response) {
        if (response.message === 'success'){
            console.log("sucessful sign in");
            window.close();     //change that to then be able to "generate" (emmet stuff)
        }
    });
});



// document.querySelector("generate-playlist").addEventListener('click', () => {
//     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//         chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response){
//             console.log(response.farewell);
//         })
//     })
// })