/* eslint-disable */
/*
aardio-chrome ר�� websocket/json-rpc/aasdl �ͻ���
���� aasdl : http://bbs.aardio.com/doc/aasdl/
*/


window.aardio = {};
var urlQuery = function (variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) { return pair[1]; }
    }
    return false;
}

var rpcServerUrl;
var rpcPort = urlQuery("rpcport")
if (typeof (rpcPort) == "string") {
    rpcServerUrl = "ws://127.0.0.1:" + rpcPort + "/rpc"
    localStorage.setItem("aardioRpcServerUrl", rpcServerUrl);
}
else {
    rpcServerUrl = localStorage.getItem("aardioRpcServerUrl");
    if (!rpcServerUrl) rpcServerUrl = "ws://127.0.0.1:58389/rpc";
}


let ws = new WebSocket(rpcServerUrl);
let rpcNotifications = new Object();
let rpcCallbacks = new Array();

let scripts = document.getElementsByTagName('script');
let scriptCode = scripts[scripts.length - 1].innerHTML;

ws.onopen = function (e) {
    window.aardio.xcall("?").then(
        function (aasdl, error) {

            var paseraasdl = function (obj, ex, pk) {
                for (var k in obj) {
                    let method = k;
                    if (typeof (pk) == "string") method = pk + "." + k;

                    if (typeof (obj[k]) == "object") {
                        ex[k] = {};
                        paseraasdl(obj[k], ex[k], method);
                        continue;
                    }

                    ex[k] = function () {
                        Array.prototype.unshift.call(arguments, method);
                        return window.aardio.xcall.apply(ex, arguments)
                    }
                }
            }

            paseraasdl(JSON.parse(aasdl), window.aardio);

            eval(scriptCode);
            window.aardio.xcall("onLoadUrl", document.location.href);

        }
    )

}
ws.onclose = function (e) { }
ws.onerror = function (e) { console.log(e) }
ws.onmessage = function (e) {
    var rep = JSON.parse(e.data)
    if (typeof (rep.id) == "number") {
        var callback = rpcCallbacks[rep.id];
        if (callback) {
            callback(rep.result, rep.error);
            rpcCallbacks.splice(rep.id, 1);
        }
    }
    else if (typeof (rep.method) == "string") {
        var notify = rpcNotifications[rep.method];
        if (notify) {
            var result = notify.apply(ws, rep.params);
            if (rep.id) {
                var clientRep = JSON.stringify({
                    id: rep.id,
                    jsonrpc: "2.0",
                    result: result
                });
                ws.send(clientRep);
            }
        }
    }
}

window.aardio.on = function (method, notify) {
    rpcNotifications[method] = notify;
}

window.aardio.xcall = function () {

    var req = JSON.stringify({
        method: Array.prototype.shift.call(arguments),
        jsonrpc: "2.0",
        params: Array.prototype.slice.apply(arguments),
        id: rpcCallbacks.length
    });

    return new Promise(function (resolve, reject) {

        rpcCallbacks.push(
            function (result, error) {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            }
        );

        ws.send(req);
    });
}

export default aardio;
