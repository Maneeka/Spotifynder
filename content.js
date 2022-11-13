chrome.runtime.onMessage.addListener(
    function(request, sender, callback){
        if(request.message = "get data"){
            callback(document.querySelector("body").innerText)
            return true
        }
    }
)