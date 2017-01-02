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
    M0SSION_VERSION = '0.1',
    M0SSION_CODE_DEFAULT = "// Write your code here.\n// Reference: https://github.com/namikiri/m0ssion/wiki\n\n";

var
    storage = {},
    codeEditor = null,
    currentModuleIndex = -1;

function switchTab (object)
{
    var name = (typeof object === 'object') ? $(object).data('tab-name') : object;

    console.log ('stab: '+name);
    $('.tab-content').hide();
    $('.tab-pointer').removeClass('active');
    $('#tab-content-'+name).show();
    $('#tab-'+name).addClass('active');
}

function storageInit()
{

}

function saveStorage()
{
    chrome.storage.local.set(storage);
}

function loadModules()
{
    var len = (typeof storage.modules !== 'undefined') ? storage.modules.length : 0;

    if (len == 0)
    {
        console.log ("No elements!");

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
                        '<div class="module-name">'+storage.modules[i].name+'</div>' +
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
        console.warning("m0ssion warning: no such module, it's a bug!");
    else
    {
        $('#module-name').val(storage.modules[index].name);
        codeEditor.setValue(storage.modules[index].code, 1);
        currentModuleIndex = index;

        switchTab('editor');
    }
}

function saveModule()
{
    var name = $('#module-name').val(),
        code = codeEditor.getValue(),
        index = currentModuleIndex;

    if (index == -1)
    {
        storage.modules.push ({
            'name'   : name,
            'code'   : code,
            'active' : true
        });

        currentModuleIndex = storage.modules.length - 1;
    }
    else
    {
        if (typeof storage.modules[index] === 'undefined')
            console.warn("m0ssion warning: no such module, it's a bug!");
        else
        {
            storage.modules[index].name = name;
            storage.modules[index].code = code;
        }
    }

    saveStorage();
    loadModules();
}

function toggleModuleActive()
{
    var index = +$(this).data('module-index');

    if (typeof storage.modules[index] === 'undefined')
        console.warn("m0ssion warning: no such module, it's a bug!");
    else
    {
        storage.modules[index].active = !storage.modules[index].active;
        saveStorage();
        loadModules();
    }
}

function removeModule ()
{
    var index = +$(this).data('module-index');

    if (typeof storage.modules[index] === 'undefined')
        console.warn("m0ssion warning: no such module, it's a bug!");
    else
    {
        storage.modules.splice(index, 1);
        saveStorage();
        loadModules();

        if (currentModuleIndex == index)
            currentModuleIndex = -1;
    }
}

function m0s_init()
{    
    $('#m0s-version').text(M0SSION_VERSION);

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

    switchTab('overview');

    chrome.storage.local.get(function (objects) {
        storage = JSON.parse(JSON.stringify(objects));
        loadModules();
    });
}

$(document).ready(m0s_init);