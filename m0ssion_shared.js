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

var
    M0SSION_VERSION = '0.1.3',
    M0SSION_CODE_DEFAULT = "// Write your code here.\n// Reference: https://github.com/namikiri/m0ssion/wiki\n\n";

function m0s_log (message, level = 'debug', module = 'core')
{
    var s = '['+module+' '+level+']: '+sanitize(message),
        evLog = $('#event-log');

    evLog.append('<div class="log-entry '+level+'">'+s+'</div>');
    evLog.scrollTop(evLog[0].scrollHeight);
}

function m0s_sendTo(target, command)
{

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
        {
            chrome.tabs.sendMessage(tabs[0].id, {
                              'type'    : 'command',
                              'command' : command,
                              'target'  : target
                          });
        });
}

function sendEvent(e)
{
    var sender = $(this);
    switch (e.keyCode)
    {
        case 13 : // enter
        case 10 : // enter alternative
                e.preventDefault();

                m0s_sendTo(sender.data('target'), sender.val());

                if (!e.shiftKey)
                    sender.val('');

                return false;
            break;
    }
}


function logControlsInit()
{
    // Receive logs from the framework
    chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse) {
                if (sender.tab) // don't receive from other exts
                {
                    if (typeof request.type !== 'undefined' && request.type === 'log')
                        m0s_log(request.message, request.level, 'client.'+request.module);
                }
        });

    $('#log-clear').click(function() { $('#event-log').html('')});
    $('#command-to-client').keydown(sendEvent);
    $('#command-to-server').keydown(sendEvent);

}

function sanitize (s)
{
    var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
    s = s.replace(/[&<>"']/g, function(m) { return map[m]; });

    return s;
}

function rnd(min, max)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randword()
{
    var s = '';
    var ltr = 'qwertyuiopasdfghjklzxcvbnm';
    while (s.length < 20)
    {
        s += ltr[rnd(0, 20)];
    }
    return s;
}