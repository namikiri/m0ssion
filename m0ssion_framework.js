/*
    
    This is     ___          _             
     _ __ ___  / _ \ ___ ___(_) ___  _ __  
    | '_ ` _ \| |_| / __/ __| |/ _ \| '_ \
    | | | | | | |_| \__ \__ | | (_) | | | |
    |_| |_| |_|\___/|___|___|_|\___/|_| |_|

    A minimalistic extensible in-browser framework for Galaxy chat.

    Copyright (c) 2017 IDENT Software ~ http://identsoft.org

    m0ssion is a free software, you can use, modify
    and redistribute it under the terms of GNU GPL version 3. 
    See https://www.gnu.org/licenses/gpl-3.0.html or LICENSE file.


                        ~ DISCLAIMER ~
    AUTHORS OF THIS SOFTWARE ARE NOT AFFILIATED WITH MOBSTUDIO LTD.
    WE ARE NOT RESPONSIBLE FOR ANY EFFECT ON YOU ACCOUNT AND/OR
    CHARACTER IN THE CHAT. KEEP IN MIND THAT IT IS PROHIBITED
    TO USE ANY THIRD-PARTY SOFTWARE WITH THE GALAXY CHAT.

    YOU ARE USING THIS SOFTWARE AT YOUR OWN RISK.

*/

var codeToInject = '(' + function() {

    function M0ssion ()
    {
        var GalaxyEvents = null;
        var m0ssionEvents = null;

        this.init = function ()
        {
            // $("div.copyrights").html("Controlled by <b>m0ssion framework</b>");

            GalaxyEvents = {
                receive : CONNECT.receive,
                send    : CONNECT.send
            };

            CONNECT.receive = function(tx) {m0s_event('receive', tx)};
            CONNECT.send = function(tx, unused) {m0s_event('send', tx)}; // 'unused' is really unused in main.js of Galaxy

            m0ssionEvents = {
                receive : [],
                send    : []
            }

            window.addEventListener('message', function(event) {
                // Only accept messages from the same frame
                if (event.source !== window)
                    return;

                var message = event.data;
                if (typeof message.type !== 'undefined' && message.type == 'command')
                {
                    var command = message.command;
                    switch (message.target)
                    {
                        case 'server' :
                            m0s_log('server: '+command, 'info', 'command');
                            GalaxyEvents.send(command);
                            break;

                        case 'client' :
                            m0s_log('client: '+command, 'info', 'command');
                            GalaxyEvents.receive(command, 0);
                            break;

                        default :
                            m0s_log('Got bad command event, oh shish!', 'error', 'command');
                            break;
                    }
                }
            });

        }

        this.sendToClient = function(command)
        {
            m0s_log('client: '+command, 'info', 'command');
            GalaxyEvents.receive(command, 0);
        }

        this.sendToServer = function(command)
        {
            m0s_log('server: '+command, 'info', 'command');
            GalaxyEvents.send(command);
        }

        this.log = function (message, level = 'debug', module = 'event')
        {
            m0s_log(message, level, 'ext.'+module);
        }

        m0s_log = function (message, level = 'debug', module = 'core')
        {            
            window.postMessage({
                      'type'    : 'log',
                      'message' : message,
                      'level'   : level,
                      'module'  : module
                }, '*');
        }

        m0s_event = function (event, command = '')
        {
            m0s_log ('Event '+event+'; command '+command);

            switch (event)
            {
                case 'send' :
                        for (i = 0; i < m0ssionEvents.send.length; i++)
                        {
                            command = m0ssionEvents.send[i](command, 0);
                            if (!command)
                                return;
                        }

                        GalaxyEvents.send(command, 0);
                break;

                case 'receive' : 
                        for (i = 0; i < m0ssionEvents.receive.length; i++)
                        {
                            command = m0ssionEvents.receive[i](command, 0);
                            if (!command)
                                return;
                        }

                        GalaxyEvents.receive(command, 0);
                    break;

                default :
                        m0s_log ('Shish, unknown event '+event+'!', 'error', 'event');
                    break;
            }

        }

        this.addEvent = function (name, fun)
        {
            switch (name)
            {
                case 'receive' :
                    m0ssionEvents.receive.push(fun);
                    break;

                case 'send' : 
                    m0ssionEvents.send.push(fun);
                    break;

                default :
                    m0s_log('Unknown event type '+name, 'error', 'eventman');
                    break;
            }
        }
    }

    var m0s = new M0ssion();
    m0s.init();

    /*_MODULES_CODE*/ // don't remove this, it's a placeholder

} + ')();';


function injectCode (storage)
{
    if (typeof storage.modules === 'undefined' || storage.length === 0)
        console.warn('No m0ssion modules found, nothing to do.');
    else
    {
        var modulesCode = '';

        for (i = 0; i < storage.modules.length; i++)
        {
            if (storage.modules[i].active)
            {
                console.log ("m0ssion: loading module '"+storage.modules[i].name+"'");
                modulesCode += '(function() { ' + storage.modules[i].code + "\n})();";
            }
        }

        codeToInject = codeToInject.replace('/*_MODULES_CODE*/', modulesCode);

        // Receive messages FROM the chat (modules+protocol log)
        window.addEventListener('message', function(event) {
            if (event.source !== window)
                return;

            var message = event.data;

            if (typeof message.type !== 'undefined' && message.type === 'log')
                chrome.runtime.sendMessage(message);
        });

        chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse) {
                if (typeof request.type !== 'undefined' && request.type === 'command')
                    window.postMessage({
                      'type'    : 'command',
                      'target'  : request.target,
                      'command' : request.command
                    }, '*');
        });


        var script = document.createElement('script');
        script.textContent = codeToInject;
        (document.head||document.documentElement).appendChild(script);
        script.remove();
    }
}

chrome.storage.local.get(injectCode);