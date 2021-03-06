/**
 * Logon page
 *
 *
 * @namespace authProcedures.getSites
 * @namespace authProcedures.login
 */
Ext.define('App.panel.login.Login',{
    extend:'Ext.Viewport',
    initComponent:function(){
        var me = this;
        me.currSite = null;
        me.currLang = null;

        // setting to show site field
        me.showSite = false;

        Ext.define('SitesModel', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'site_id', type: 'int' },
                {name: 'site',    type: 'string' }
            ],
            proxy: {
                type: 'direct',
                api: {
                    read: authProcedures.getSites
                }
            }
        });

        me.langStore = Ext.create('Ext.data.Store', {
            fields:['name','value'],
            data : [
                {name: 'English (US)',  value: 'en_US'},
                {name: 'Spanish',       value: 'es'}
            ]
        });

        /**
         * The Copyright Notice Window
         */
        me.winCopyright = Ext.create('widget.window', {
            id				: 'winCopyright',
            title			: 'GaiaEHR Copyright Notice',
            bodyStyle		: 'background-color: #ffffff; padding: 5px;',
            autoLoad		: 'gpl-licence-en.html',
            closeAction		: 'hide',
            width			: 900,
            height			: '75%',
            modal			: false,
            resizable		: true,
            draggable		: true,
            closable		: true,
            autoScroll		: true
        });
        /**
         * Form Layout [Login]
         */
        me.formLogin = Ext.create('Ext.form.FormPanel', {
            id				: 'formLogin',
            bodyStyle		: 'background: #ffffff; padding:5px 5px 0',
            defaultType		: 'textfield',
            waitMsgTarget	: true,
            frame			: false,
            border			: false,
            width			: 483,
            padding         : '0 0 5 0',
            bodyPadding     : '5 5 0 5',
            baseParams		: { auth: 'true' },
            fieldDefaults	: { msgTarget: 'side', labelWidth: 300 },
            defaults		: { anchor: '100%' },
            items: [{
                xtype           : 'textfield',
                fieldLabel      : 'Username',
                blankText       : 'Enter your username',
                name            : 'authUser',
                itemId          : 'authUser',
                minLengthText   : 'Username must be at least 3 characters long.',
                minLength       : 3,
                maxLength       : 25,
                allowBlank      : false,
                validationEvent : false,
                listeners:{
                    scope       : me,
                    specialkey  : me.onEnter
                }
            },{
                xtype           : 'textfield',
                blankText       : 'Enter your password',
                inputType       : 'password',
                name            : 'authPass',
                fieldLabel      : 'Password',
                minLengthText   : 'Password must be at least 4 characters long.',
                validationEvent : false,
                allowBlank      : false,
                minLength       : 4,
                maxLength       : 50,
                listeners:{
                    scope       : me,
                    specialkey  : me.onEnter
                }
            },{
                xtype           : 'combobox',
                name            : 'lang',
                itemId          : 'lang',
                displayField    : 'name',
                valueField      : 'value',
                queryMode       : 'local',
                fieldLabel      : 'Language',
                store           : me.langStore,
                allowBlank      : false,
                editable        : false,
                listeners:{
                    scope       : me,
                    specialkey  : me.onEnter,
                    select      : me.onLangSelect
                }
            }],
            buttons: [{
                xtype:'checkbox',
                name:'checkin'
            },'Check-In Mode','->',{
                text    : 'Login',
                name    : 'btn_login',
                scope   : me,
                handler : me.onSubmit
            },'-',{
                text    : 'Reset',
                name    : 'btn_reset',
                scope   : me,
                handler : me.onFormReset
            }]
        });

        if(me.showSite){

            me.storeSites = Ext.create('Ext.data.Store', {
                model: 'SitesModel',
                autoLoad: false
            });
            me.formLogin.insert(3, {
                xtype           : 'combobox',
                name            : 'site',
                itemId          : 'site',
                displayField    : 'site',
                valueField      : 'site',
                queryMode       : 'local',
                fieldLabel      : 'Site',
                store           : me.storeSites,
                allowBlank      : false,
                editable        : false,
                msgTarget: 'side',
                labelWidth: 300,
                anchor: '100%',
                listeners:{
                    scope       : me,
                    specialkey  : me.onEnter,
                    select      : me.onSiteSelect
                }
            });
        }else{
            me.formLogin.insert(3, {
                xtype           : 'textfield',
                name            : 'site',
                itemId          : 'site',
                hidden:true,
                value:window.site
            });
        }

        /**
         * The Logon Window
         */
        me.winLogon = Ext.create('widget.window', {
            title			: 'GaiaEHR Logon',
            closeAction		: 'hide',
            plain			: true,
            modal			: false,
            resizable		: false,
            draggable		: false,
            closable		: false,
            width			: 495,
            bodyStyle		: 'background: #ffffff;',
            items			: [{ xtype: 'box', width: 483, height: 135, html: '<img src="ui_app/logon_header.png" />'}, me.formLogin ],
            listeners:{
                scope:me,
                afterrender:me.onAfterrender
            }
        }).show();

        me.listeners = {
            resize:me.onResized
        };

        me.callParent(arguments);
    },
    /**
     * when keyboard ENTER key press
     * @param field
     * @param e
     */
    onEnter:function(field, e){
        if (e.getKey() == e.ENTER) {
           this.onSubmit();
        }
    },
    /**
     * Form Submit/Logon function
     */
    onSubmit:function(){
        var me = this,
            formPanel = this.formLogin,
            form = formPanel.getForm(),
            params = form.getValues(),
            checkInMode = me.formLogin.query('checkbox')[0].getValue();
        if(form.isValid()){
            formPanel.el.mask('Sending credentials...');
            params.checkInMode = checkInMode;
            console.log(params);
            authProcedures.login(params, function(provider, response){
                if(response.result.success){
                    window.location = './';
	                //window.close();
	                //window.appWindow = window.open('./','app','fullscreen=yes,directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no');
                }else{
                    Ext.Msg.show({
                         title:'Oops!',
                         msg: response.result.error,
                         buttons: Ext.Msg.OK,
                         icon: Ext.Msg.ERROR
                    });
                    me.onFormReset();
                    formPanel.el.unmask();
                }
            });
        }else{
            this.msg('Oops!', 'Username And Password are required.');
        }
    },
    /**
     * gets the site combobox value and store it in currSite
     * @param combo
     * @param value
     */
    onSiteSelect:function(combo,value){
        this.currSite = value[0].data.site;
    },

    onLangSelect:function(combo,value){
        this.currLang = value[0].data.value;
    },
    /**
     * form rest function
     */
    onFormReset:function(){
        var me = this,
            form = me.formLogin.getForm();
        form.reset();
        form.setValues({
            site  : window.site,
            lang  : me.currLang
        });
        me.formLogin.getComponent('authUser').focus();
    },
    /**
     * After form is render load store
     */
    onAfterrender:function(){
        var me = this;
        if(me.showSite){
            me.storeSites.load({
                scope   :me,
                callback:function(records,operation,success){
                    if(success === true){
                        /**
                         * Lets add a delay to make sure the page is fully render.
                         * This is to compensate for slow browser.
                         */
                        Ext.Function.defer(function(){
                            me.currSite = records[0].data.site;
                            if(me.showSite){
                                me.formLogin.getComponent('site').setValue(this.currSite);
                            }
                        },100,this);

                    }else{
                        this.msg('Opps! Something went wrong...',  'No site found.');
                    }
                }
            });
        }
        me.currLang = 'en_US';
        me.formLogin.getComponent('lang').setValue(me.currLang);
        me.formLogin.getComponent('authUser').focus();

    },
    /**
     *  animated msg alert
     * @param title
     * @param format
     */
    msg:function(title, format){
        if(!this.msgCt){
            this.msgCt = Ext.core.DomHelper.insertFirst(document.body, {id:'msg-div'}, true);
        }
        this.msgCt.alignTo(document, 't-t');
        var s = Ext.String.format.apply(String, Array.prototype.slice.call(arguments, 1));
        var m = Ext.core.DomHelper.append(this.msgCt, {html:'<div class="msg"><h3>' + title + '</h3><p>' + s + '</p></div>'}, true);

        m.slideIn('t').pause(3000).ghost('t', {remove:true});
    },

    onResized:function(){
        var win = this.winLogon,
            ch =  win.getHeight() - (win.getHeight() / 2),
            cw = win.getWidth() - (win.getWidth() / 2);

        win.alignTo(this, 'c', [-cw, -ch]);
    }
});