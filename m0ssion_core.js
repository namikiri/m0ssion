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
    M0SSION_VERSION = '0.0.3',
    M0SSION_CODE_DEFAULT = "// Write your code here.\n// Reference: https://github.com/namikiri/m0ssion/wiki\n\n";

var
    storage = {},
    codeEditor = null,
    currentModuleIndex = -1;

function switchTab (object)
{
    var name = (typeof object === 'object') ? $(object).data('tab-name') : object;

    $('.tab-content').hide();
    $('.tab-pointer').removeClass('active');
    $('#tab-content-'+name).show();
    $('#tab-'+name).addClass('active');

    // automatically scroll log, autoscroll doesn't work on hidden elements
    if (name == 'log')
    {
        var  evLog = $('#event-log');
        evLog.scrollTop(evLog[0].scrollHeight);
    }
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

function saveStorage()
{
    chrome.storage.local.set(storage);
}

function loadModules()
{
    m0s_log('Reloading modules');
    var len = (typeof storage.modules !== 'undefined') ? storage.modules.length : 0;

    if (len == 0)
    {
        m0s_log('No elements found, probably a first run.', 'warn');

        storage.modules = [];

        storage.modules.push (
            {
            'name'   : 'Make Galaxy great again!',
            'code'   : '// This is a simple test. This module does exactly nothing. Write your own!',
            'active' : true
            });

        len++;
        saveStorage();
    }

    m0s_log('Found '+len+' element(s)');

    var mlist = $('#modules-list');

    mlist.html('');

    for (i = 0; i < len; i++)
    {
        var modState = (storage.modules[i].active) ? 'active' : 'inactive';

        mlist.append('<div class="module" id="module-'+i+'">'+
                        '<div class="module-tools">' +
                            '<div class="module-tool '+modState+'" data-module-index="'+i+'"></div>' +
                            '<div class="module-tool edit" data-module-index="'+i+'"></div>' +
                            '<div class="module-tool remove" data-module-index="'+i+'"></div>' +
                        '</div>' +
                        '<div class="module-name">'+sanitize(storage.modules[i].name)+'</div>' +
                    '</div>');
    }

    $('.module-tool.edit').each(function (idx, ctl) {
        $(ctl).click(prepareForEdit);
    });

    $('.module-tool.remove').each(function (idx, ctl) {
        $(ctl).click(removeModule);
    });

    $('.module-tool.active, .module-tool.inactive').each(function (idx, ctl) {
        $(ctl).click(toggleModuleActive);
    });

    m0s_log('Everything is loaded and ready.', 'info');
}

function editorReset()
{
    $('#module-name').val('');
    codeEditor.setValue(M0SSION_CODE_DEFAULT, 1);
    currentModuleIndex = -1;
}

function newModule()
{
    editorReset();
    switchTab('editor');
}

function prepareForEdit()
{
    var index = +$(this).data('module-index');

    if (typeof storage.modules[index] === 'undefined')
        m0s_log('Module editing: no module at '+index+' index! That\'s a bug!', 'warn');
    else
    {
        $('#module-name').val(storage.modules[index].name);
        codeEditor.setValue(storage.modules[index].code, 1);
        currentModuleIndex = index;
        m0s_log('Editing module at index '+currentModuleIndex+' (\''+sanitize(storage.modules[index].name)+'\')');

        switchTab('editor');
    }
}

function saveModule()
{
    var name = $('#module-name').val(),
        code = codeEditor.getValue(),
        index = currentModuleIndex;

    if (!name || !code)
    {
        m0s_log('No module name or code present, editing cancelled!', 'warn');
    }

    if (index == -1)
    {
        storage.modules.push ({
            'name'   : name,
            'code'   : code,
            'active' : true
        });
        currentModuleIndex = storage.modules.length - 1;

        m0s_log('Creating a new module '+currentModuleIndex+' (\''+sanitize(name)+'\')');

    }
    else
    {
        if (typeof storage.modules[index] === 'undefined')
            m0s_log('Module editing: no module at '+index+' index! That\'s a bug!', 'warn');
        else
        {
            storage.modules[index].name = name;
            storage.modules[index].code = code;

            m0s_log('Edited module at index '+currentModuleIndex+' (\''+sanitize(name)+'\')');
        }
    }

    saveStorage();
    loadModules();
}

function toggleModuleActive()
{
    var index = +$(this).data('module-index');

    if (typeof storage.modules[index] === 'undefined')
        m0s_log('Module (de)activating: no module at '+index+' index! That\'s a bug!', 'warn');
    else
    {
        storage.modules[index].active = !storage.modules[index].active;
        saveStorage();
        loadModules();

        m0s_log('(De)activated module at index '+index+' (\''+sanitize(storage.modules[index].name)+'\')');
    }
}

function removeModule ()
{
    var index = +$(this).data('module-index');

    if (typeof storage.modules[index] === 'undefined')
        m0s_log('Module removal: no module at '+index+' index! That\'s a bug!', 'warn');
    else
    {
        storage.modules.splice(index, 1);
        saveStorage();
        loadModules();

        m0s_log('Removed module at index '+currentModuleIndex);

        if (currentModuleIndex == index)
            currentModuleIndex = -1;
    }
}

function m0s_log (message, level = 'debug', module = 'core')
{
    var s = '['+module+' '+level+']: '+message,
        evLog = $('#event-log');

    evLog.append('<div class="log-entry '+level+'">'+s+'</div>');
    evLog.scrollTop(evLog[0].scrollHeight);
}

function m0s_init()
{    
    m0s_log('Welcome to m0ssion/'+M0SSION_VERSION, 'info');
    $('#m0s-version').text(M0SSION_VERSION);

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (sender.tab) // don't receive from other exts
                m0s_log(request.message, request.level, 'client.'+request.module);
    });

    m0s_log('Setting up UI...');
    $('.tab-pointer').each(function (idx, tab) {
        $(tab).click(function() {switchTab(this)});
    });

    codeEditor = ace.edit("module-code");
    codeEditor.setTheme("ace/theme/tomorrow_night_bright");
    codeEditor.getSession().setMode("ace/mode/javascript");
    codeEditor.getSession().setUseWrapMode(true);
    codeEditor.setHighlightActiveLine(false);

    $('#editor-save').click(saveModule);
    $('#editor-reset').click(editorReset);
    $('#modules-new').click(newModule);
    $('#log-clear').click(function() { $('#event-log').html('')});

    switchTab('overview');

    m0s_log('Done. Loading storage...');
    chrome.storage.local.get(function (objects) {
        storage = JSON.parse(JSON.stringify(objects));
        loadModules();
    });
}

$(document).ready(m0s_init);