/**
 * Encounter.js
 * Encounter Panel
 *
 * This class renders all the panel used  inside the Encounter Panel
 *
 * v0.1.0
 *
 * Author: Ernesto J. Rodriguez
 *
 * GaiaEHR (Electronic Health Records) 2011
 *
 * This are all the Ext.direct methods used in this class
 * @namespace Encounter.getEncounter
 * @namespace Encounter.createEncounter
 * @namespace Encounter.updateEncounter
 * @namespace Encounter.checkOpenEncounters
 * @namespace Encounter.closeEncounter
 * @namespace Encounter.getVitals
 * @namespace Encounter.addVitals
 * @namespace Encounter.saveReviewOfSystem
 * @namespace Encounter.saveReviewOfSystemsChecks
 * @namespace Encounter.saveSOAP
 * @namespace Encounter.saveSpeechDictation
 * @namespace Encounter.updateReviewOfSystemsById
 * @namespace Encounter.updateReviewOfSystemsChecksById
 * @namespace Encounter.updateSoapById
 * @namespace Encounter.updateDictationById
 * @namespace Encounter.getProgressNoteByEid
 * @namespace User.verifyUserPass
 * @namespace ACL.hasPermission
 */
Ext.define('App.view.patient.Encounter', {
    extend                : 'App.classes.RenderPanel',
    id                    : 'panelEncounter',
    pageTitle             : 'Encounter',
    pageLayout            : 'border',
    requires              : [
        'App.store.patient.Encounter', 'App.store.patient.Vitals'
    ],
    eid                   : null,
    currEncounterStartDate: null,
    initComponent         : function() {
        var me = this;

        me.renderAdministrative = perm.access_enc_hcfa || perm.access_enc_cpt || perm.access_enc_history;

        me.timerTask = {
            scope   : me,
            run     : function() {
                me.encounterTimer();
            },
            interval: 1000 //1 second
        };
        /**
         * stores
         * @type {*}
         */
        me.encounterStore = Ext.create('App.store.patient.Encounter', {
            listeners: {
                scope      : me,
                datachanged: me.updateProgressNote
            }
        });
        me.encounterEventHistoryStore = Ext.create('App.store.patient.EncounterEventHistory');
        me.EncounterOrdersStore = Ext.create('App.store.patient.EncounterCPTsICDs');

        if(perm.access_encounter_checkout){
            me.checkoutAlertArea = Ext.create('App.store.patient.CheckoutAlertArea');
        }

        /**
         * New Encounter Panel this panel is located hidden at
         * the top of the Visit panel and will slide down if
         * the "New Encounter" button is pressed.
         */
        if(perm.add_encounters){
            me.newEncounterWindow = Ext.create('Ext.window.Window', {
                title      : 'New Encounter Form',
                closeAction: 'hide',
                modal      : true,
                width      : 660,
                items      : [
                    {
                        xtype      : 'form',
                        border     : false,
                        bodyPadding: '10 10 0 10'
                    }
                ],
                buttons    : [
                    {
                        text   : 'Create Encounter',
                        action : 'encounter',
                        scope  : me,
                        handler: me.onSave
                    },
                    {
                        text   : 'Cancel',
                        scope  : me,
                        handler: me.cancelNewEnc

                    }
                ],
                listeners  : {
                    scope: me,
                    close: me.cancelNewEnc
                }
            });
        }
        /**
         * Encounter Checkout window
         * @type {*}
         */
        if(perm.access_encounter_checkout){
            me.checkoutWindow = Ext.create('Ext.window.Window', {
                title      : 'Checkout and Signing',
                closeAction: 'hide',
                modal      : true,
                layout     : 'border',
                width      : 1000,
                height     : 660,
                bodyPadding: 5,
                items      : [
                    {
                        xtype  : 'grid',
                        title  : 'Services / Diagnostics',
                        region : 'center',
                        store  : me.EncounterOrdersStore,
                        columns: [
                            {
                                header   : 'Code',
                                width    : 60,
                                dataIndex: 'code'
                            },
                            {
                                header   : 'Description',
                                flex     : 1,
                                dataIndex: 'code_text'
                            },
                            {
                                header   : 'Type',
                                flex     : 1,
                                dataIndex: 'type'
                            }
                        ]
                    },
                    me.documentsimplegrid = Ext.create('App.view.patient.EncounterDocumentsGrid', {
                        title : 'Documents',
                        region: 'east',
                        width : 485
                    }),
                    {
                        xtype   : 'form',
                        title   : 'Additional Info',
                        region  : 'south',
                        split   : true,
                        height  : 245,
                        layout  : 'column',
                        defaults: {
                            xtype  : 'fieldset',
                            padding: 8
                        },
                        items   : [
                            {
                                xtype      : 'fieldcontainer',
                                columnWidth: .5,
                                defaults   : {
                                    xtype  : 'fieldset',
                                    padding: 8
                                },
                                items      : [
                                    {
                                        xtype      : 'fieldset',
                                        margin     : '5 1 5 5',
                                        padding    : 8,
                                        columnWidth: .5,
                                        height     : 115,
                                        title      : 'Messages, Notes and Reminders',
                                        items      : [
                                            {
                                                xtype     : 'textfield',
                                                name      : 'message',
                                                fieldLabel: 'Message',
                                                anchor    : '100%'
                                            },
                                            {
                                                xtype     : 'textfield',
                                                name      : 'reminder',
                                                fieldLabel: 'Reminder',
                                                anchor    : '100%'
                                            },
                                            {
                                                xtype     : 'textfield',
                                                grow      : true,
                                                name      : 'note',
                                                fieldLabel: 'Note',
                                                anchor    : '100%'
                                            }
                                        ]
                                    },
                                    {
                                        title   : 'Follow Up',
                                        margin  : '5 1 5 5',
                                        defaults: {
                                            anchor: '100%'
                                        },
                                        items   : [
                                            {
                                                xtype     : 'mitos.followupcombo',
                                                fieldLabel: 'Time Interval',
                                                name      : 'followup_time'
                                            },
                                            {
                                                fieldLabel: 'Facility',
                                                xtype     : 'mitos.activefacilitiescombo',
                                                name      : 'followup_facility'
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                xtype      : 'fieldset',
                                margin     : 5,
                                padding    : 8,
                                columnWidth: .5,
                                layout     : 'fit',
                                height     : 208,
                                title      : 'Warnings / Alerts',
                                items      : [
                                    {
                                        xtype      : 'grid',
                                        hideHeaders: true,
                                        store      : me.checkoutAlertArea,
                                        border     : false,
                                        rowLines   : false,
                                        header     : false,
                                        viewConfig : {
                                            stripeRows      : false,
                                            disableSelection: true
                                        },
                                        columns    : [
                                            {
                                                dataIndex: 'alertType',
                                                width    : 30,
                                                renderer : me.alertIconRenderer
                                            },
                                            {
                                                dataIndex: 'alert',
                                                flex     : 1
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ],
                buttons    : [
                    {
                        text   : 'Co-Sign',
                        action : 'encounter',
                        scope  : me,
                        handler: me.coSignEncounter
                    },
                    {
                        text   : 'Sign',
                        action : 'encounter',
                        scope  : me,
                        handler: me.signEncounter
                    },
                    {
                        text   : 'Cancel',
                        handler: me.cancelCheckout

                    }
                ],
                listeners  : {
                    scope: me,
                    show : function() {
                        me.EncounterOrdersStore.load({params: {eid: app.currEncounterId}});
                        if(perm.access_encounter_checkout){
                            me.checkoutAlertArea.load({params: {eid: app.currEncounterId}});
                        }
                        me.documentsimplegrid.loadDocs(me.eid);
                    }

                }

            });
        }

//        me.speechDicPanel = Ext.create('Ext.form.Panel', {
//            autoScroll   : true,
//            title        : 'Speech Dictation',
//            action       : 'encounter',
//            frame        : true,
//            bodyPadding  : 5,
//            bodyStyle    : 'background-color:white',
//            fieldDefaults: { msgTarget: 'side' },
//            buttons      : [
//                {
//                    text   : 'Save',
//                    iconCls: 'save',
//                    action : 'speechDictation',
//                    scope  : me,
//                    handler: me.onSave
//                }
//            ]
//        });

        if(me.renderAdministrative){
            me.centerPanel = Ext.create('Ext.tab.Panel', {
                region     : 'center',
                margin     : '1 0 0 0',
                bodyPadding: 5,
                listeners  : {
                    render: function() {
                        this.items.each(function(i) {
                            i.tab.on('click', function() {
                                me.onTapPanelChange(this);
                            });
                        });
                    }
                }
            });
        }else{
            me.centerPanel = Ext.create('Ext.panel.Panel', {
                region     : 'center',
                margin     : '1 0 0 0',
                layout:'fit',
                bodyPadding: 5
            });
        }

        /**
         * Encounter Tab Panel and its Panels...
         * @type {*}
         */
        me.encounterTabPanel = me.centerPanel.add(
            Ext.create('Ext.tab.Panel', {
                title     : me.renderAdministrative ? 'Encounter' : false,
                itemId    : 'encounter',
                plain     : true,
                activeItem: 0,
                border:false,
                defaults  : {
                    bodyStyle : 'padding:15px',
                    bodyBorder: true,
                    layout    : 'fit'
                }
            })
        );
        if(perm.access_patient_vitals){
            me.vitalsPanel = me.encounterTabPanel.add(
                Ext.create('Ext.panel.Panel', {
                    title      : 'Vitals',
                    action     : 'encounter',
                    cls        : 'vitals-panel',
                    bodyPadding: '5 10',
                    overflowY  : 'auto',
                    frame      : true,
                    bodyStyle  : 'background-color:white',
                    layout     : {
                        type   : 'hbox',
                        stretch: true
                    },
                    items      : [
                        {
                            xtype        : 'form',
                            width        : 313,
                            margin       : 0,
                            border       : false,
                            layout       : 'anchor',
                            fieldDefaults: { msgTarget: 'side', labelAlign: 'right' },
                            buttons      : [
                                {
                                    text   : 'Reset',
                                    width  : 40,
                                    scope  : me,
                                    handler: me.resetVitalsForm
                                },
                                {
                                    text   : 'Save',
                                    action : 'vitals',
                                    width  : 40,
                                    scope  : me,
                                    handler: me.onSave
                                },
                                {
                                    text    : 'Sign',
                                    width   : 40,
                                    disabled: true,
                                    action  : 'signBtn',
                                    scope   : me,
                                    handler : me.onVitalsSign
                                }

                            ]
                        },
                        {
                            xtype     : 'vitalsdataview',
                            flex      : 1,
                            autoScroll: true,
                            listeners : {
                                scope       : me,
                                itemdblclick: me.onVitalsClick
                            }
                        }
                    ],
                    dockedItems: {
                        xtype: 'toolbar',
                        dock : 'top',
                        items: [
                            '->', {
                                text   : 'Vector Charts',
                                iconCls: 'icoChart',
                                scope  : me,
                                handler: me.onChartWindowShow
                            }
                        ]
                    }
                })
            );
        }
        if(perm.access_review_of_systems){
            me.reviewSysPanel = me.encounterTabPanel.add(
                Ext.create('Ext.form.Panel', {
                    autoScroll   : true,
                    action       : 'encounter',
                    title        : 'Review of Systems',
                    frame        : true,
                    bodyPadding  : 5,
                    bodyStyle    : 'background-color:white',
                    fieldDefaults: { msgTarget: 'side' },
                    buttons      : [
                        {
                            text   : 'Save',
                            iconCls: 'save',
                            action : 'reviewOfSystems',
                            scope  : me,
                            handler: me.onSave
                        }
                    ]
                })
            );
        }
        if(perm.access_review_of_systems_checks){
            me.reviewSysCkPanel = me.encounterTabPanel.add(
                Ext.create('Ext.form.Panel', {
                    autoScroll   : true,
                    action       : 'encounter',
                    title        : 'Review of Systems Checks',
                    frame        : true,
                    bodyPadding  : 5,
                    bodyStyle    : 'background-color:white',
                    fieldDefaults: { msgTarget: 'side' },
                    buttons      : [
                        {
                            text   : 'Save',
                            iconCls: 'save',
                            action : 'reviewOfSystemsChecks',
                            scope  : me,
                            handler: me.onSave
                        }
                    ]
                })
            );
        }
        if(perm.access_soap){
            me.soapPanel = me.encounterTabPanel.add(
                Ext.create('Ext.form.Panel', {
                    autoScroll   : true,
                    title        : 'SOAP',
                    action       : 'encounter',
                    frame        : true,
                    bodyPadding  : 5,
                    bodyStyle    : 'background-color:white',
                    fieldDefaults: { msgTarget: 'side' },
                    buttons      : [
                        {
                            text   : 'Save',
                            iconCls: 'save',
                            action : 'soap',
                            scope  : me,
                            handler: me.onSave
                        }
                    ]
                })
            );
        }
        if(perm.access_itmes_to_review){
            me.itemsToReview = me.encounterTabPanel.add(
                Ext.create('App.view.patient.ItemsToReview', {
                    title      : 'Items to Review',
                    bodyPadding: '7 5 2 5'
                })
            );
        }

        /**
         * Administravive Tab Panel and its Panels
         * @type {*}
         */
        if(perm.access_enc_hcfa || perm.access_enc_cpt || perm.access_enc_history){
            me.administrativeTabPanel = me.centerPanel.add(
                Ext.create('Ext.tab.Panel', {
                    title     : 'Administrative',
                    itemId    : 'administrative',
                    plain     : true,
                    activeItem: 0,
                    defaults  : {
                        bodyStyle : 'padding:15px',
                        bodyBorder: true,
                        layout    : 'fit'
                    }
                })
            );
        }
        if(perm.access_enc_hcfa){
            me.MiscBillingOptionsPanel = me.administrativeTabPanel.add(
                Ext.create('App.view.patient.encounter.HealthCareFinancingAdministrationOptions', {
                    autoScroll: true,
                    title     : 'Misc. Billing Options HCFA-1500'
                })
            );
        }
        if(perm.access_enc_cpt){
            me.CurrentProceduralTerminology = me.administrativeTabPanel.add(
                Ext.create('App.view.patient.encounter.CurrentProceduralTerminology', {
                    title: 'Current Procedural Terminology'
                })
            );
        }
        if(perm.access_enc_history){
            me.EncounterEventHistory = me.administrativeTabPanel.add(
                Ext.create('App.classes.grid.EventHistory', {
                    bodyStyle: 0,
                    title    : 'Encounter History',
                    store    : me.encounterEventHistoryStore
                })
            );
        }

        /**
         * Progress Note
         */
        me.progressNote = Ext.create('App.view.patient.ProgressNote', {
            title       : 'Encounter Progress Note',
            region      : 'east',
            margin      : '0 0 0 2',
            bodyStyle   : 'padding:15px',
            width       : 500,
            collapsible : true,
            animCollapse: true,
            collapsed   : true,
            listeners   : {
                scope   : this,
                collapse: me.progressNoteCollapseExpand,
                expand  : me.progressNoteCollapseExpand
            },
            tools       : [
                {
                    type   : 'print',
                    tooltip: 'Print Progress Note',
                    scope  : me,
                    handler: function() {
                        var win = window.open('print.html', 'win', 'left=20,top=20,width=700,height=700,toolbar=0,resizable=1,location=1,scrollbars=1,menubar=0,directories=0');
                        var dom = me.progressNote.body.dom;
                        var wrap = document.createElement('div');
                        var html = wrap.appendChild(dom.cloneNode(true));
                        win.document.write(html.innerHTML);
                        Ext.defer(function() {
                            win.print();
                        }, 1000);

                    }
                }
            ]
        });

        me.panelToolBar =  Ext.create('Ext.toolbar.Toolbar', {
            dock    : 'top',
            defaults: {
                scope  : me,
                handler: me.onMedicalWin
            },
            items   : [
                '-', {
                    text  : 'Immunizations ',
                    action: 'immunization'
                }, '-', {
                    text  : 'Allergies ',
                    action: 'allergies'
                }, '-', {
                    text  : 'Active Problems ',
                    action: 'issues'
                }, '-', {
                    text  : 'Surgeries ',
                    action: 'surgery'
                }, '-', {
                    text  : 'Dental ',
                    action: 'dental'
                }, '-', {
                    text  : 'Medications ',
                    action: 'medications'
                }, '-', {
                    text  : 'Laboratories ',
                    action: 'laboratories'
                }, '-', {
                    text   : 'New Lab Order',
                    action : 'lab',
                    scope  : me,
                    handler: me.newDoc
                }, '-', {
                    text   : 'New X-Ray Order',
                    action : 'xRay',
                    scope  : me,
                    handler: me.newDoc
                }, '-', {
                    text   : 'New Prescription',
                    action : 'prescription',
                    scope  : me,
                    handler: me.newDoc
                }, '-', {
                    text   : 'New Doctors Note',
                    action : 'notes',
                    scope  : me,
                    handler: me.newDoc
                }, '-', '->', '-',
                me.priorityCombo = Ext.create('App.classes.combo.EncounterPriority', {
                    listeners: {
                        scope : me,
                        select: me.prioritySelect
                    }
                }), '-'
            ]
        });

        if(perm.access_encounter_checkout){
            me.panelToolBar.add({
                text   : 'Checkout',
                handler: me.onCheckout
            },'-');
        }

        me.pageBody = [ me.centerPanel, me.progressNote ];
        me.listeners = {
            beforerender: me.beforePanelRender
        };
        me.callParent(arguments);
        me.down('panel').addDocked(me.panelToolBar);
    },
    newDoc                : function(btn) {
        app.onNewDocumentsWin(btn.action)
    },
    /**
     * opens the Medical window
     * @param btn
     */
    onMedicalWin          : function(btn) {
        app.onMedicalWin(btn);
    },
    /**
     * opens the Chart window
     */
    onChartWindowShow     : function() {
        app.onChartsWin();
    },

    prioritySelect: function(cmb, records) {
        alert('TODO: Priority Changed to ' + records[0].data.option_value)
    },
    /**
     * Checks for opened encounters, if open encounters are
     * found alert the user, if not then open the
     * new encounter window
     */
    newEncounter  : function() {
        var me = this, form, model;
        if(perm.add_encounters){
            Encounter.checkOpenEncounters(function(provider, response) {
                /** @namespace response.result.encounter */
                if(response.result.encounter) {
                    Ext.Msg.show({
                        title  : 'Oops! Open Encounters Found...',
                        msg    : 'Do you want to <strong>continue creating the New Encounters?</strong><br>"Click No to review Encounter History"',
                        buttons: Ext.Msg.YESNO,
                        icon   : Ext.Msg.QUESTION,
                        fn     : function(btn) {
                            if(btn == 'yes') {
                                form = me.newEncounterWindow.down('form');
                                form.getForm().reset();
                                model = Ext.ModelManager.getModel('App.model.patient.Encounter');
                                model = Ext.ModelManager.create({
                                    start_date: new Date()
                                }, model);
                                form.getForm().loadRecord(model);
                                me.newEncounterWindow.show();
                            } else {
                                app.openPatientVisits();
                            }
                        }
                    });
                } else {
                    form = me.newEncounterWindow.down('form');
                    form.getForm().reset();
                    model = Ext.ModelManager.getModel('App.model.patient.Encounter');
                    model = Ext.ModelManager.create({
                        start_date: new Date()
                    }, model);
                    form.getForm().loadRecord(model);
                    me.newEncounterWindow.show();
                }
            });
        }else{
            app.accessDenied();
        }
    },



    /**
     * CheckOut Functions
     */
    onCheckout: function() {
        var me = this, win = me.checkoutWindow, patient = me.getCurrPatient();
        win.setTitle(patient.name + ' - ' + Ext.Date.format(me.currEncounterStartDate, 'F j, Y, g:i:s a') + ' (Checkout)');
        win.show();
    },
    coSignEncounter: function() {

    },
    signEncounter: function() {
        this.closeEncounter();
        this.checkoutWindow.close();
    },
    cancelCheckout: function(btn) {
        var win = btn.up('window'), form = win.down('form').getForm();
        win.close();
        form.reset();
    },



    /**
     * Sends the data to the server to be saved.
     * This function needs the button action to determine
     * which form  to save.
     * @param SaveBtn
     */
    onSave: function(SaveBtn) {
        var me = this, panel = me.centerPanel.getActiveTab().getActiveTab(), form;
        if(SaveBtn.action == "encounter") {
            form = me.newEncounterWindow.down('form').getForm();
        } else if(SaveBtn.action == 'vitals') {
            form = panel.down('form').getForm();
        } else {
            form = panel.getForm();
        }
        if(form.isValid()) {
            var values = form.getValues(), store, record, storeIndex;

            if(SaveBtn.action == 'encounter') {
                ACL.hasPermission('add_encounters', function(provider, response) {
                    if(response.result) {
                        store = me.encounterStore;
                        record = form.getRecord();
                        storeIndex = store.indexOf(record);

                        if(storeIndex == -1) {
                            store.add(values);
                            record = store.last();
                        } else {
                            record.set(values);
                        }
                        record.save({
                            callback: function(store) {
                                app.patientButtonRemoveCls();
                                app.patientButton.addCls(store.data.priority);
                                me.openEncounter(store.data.eid);
                                SaveBtn.up('window').hide();
                            }
                        });
                    } else {
                        SaveBtn.up('window').close();
                        app.accessDenied();
                    }
                });
            } else if(SaveBtn.action == 'vitals') {
                var VFields = form.getFields().items, VFieldsCount = VFields.length, emptyCount = 0;
                for(var i = 0; i < VFields.length; i++) {
                    if(VFields[i].xtype != 'mitos.datetime') {
                        if(VFields[i].value == '') {
                            emptyCount++;
                        }
                    }
                }
                if((VFieldsCount - 3) > emptyCount) {
                    ACL.hasPermission('add_vitals', function(provider, response) {
                        if(response.result) {
                            store = me.encounterStore.getAt(0).vitals();
                            record = form.getRecord();
                            values = me.addDefaultData(values);
                            storeIndex = store.indexOf(record);
                            if(storeIndex == -1) {
                                store.insert(0, values);
                            } else {
                                record.set(values);
                            }
                            store.sync({
                                scope  : me,
                                success: function() {
                                    me.msg('Sweet!', 'Vitals Saved');
                                    me.updateProgressNote();
                                    me.vitalsPanel.down('vitalsdataview').refresh();
                                    me.resetVitalsForm();
                                }
                            });
                        } else {
                            app.accessDenied();
                        }
                    });
                } else {
                    me.msg('Oops!', 'Vitals form is epmty')
                }

            } else {
                ACL.hasPermission('edit_encounters', function(provider, response) {
                    if(response.result) {
                        store = me.encounterStore;
                        if(SaveBtn.action == 'reviewOfSystems') {
                            record = store.getAt(0).reviewofsystems().getAt(0);
                        } else if(SaveBtn.action == 'reviewOfSystemsChecks') {
                            record = store.getAt(0).reviewofsystemschecks().getAt(0);
                        } else if(SaveBtn.action == 'soap') {
                            record = store.getAt(0).soap().getAt(0);
                        } else if(SaveBtn.action == 'speechDictation') {
                            record = store.getAt(0).speechdictation().getAt(0);
                        }
                        values = me.addDefaultData(values);
                        record.set(values);
                        record.save({
                            callback: function() {
                                me.updateProgressNote();
                            }
                        });
                        me.msg('Sweet!', 'Encounter Updated');
                        me.encounterEventHistoryStore.load({params: {eid: app.currEncounterId}});
                    } else {
                        app.accessDenied();
                    }
                });
            }
        }
    },

    onVitalsSign: function() {
        var me = this,
            form = me.vitalsPanel.down('form').getForm(),
            store = me.encounterStore.getAt(0).vitals(),
            record = form.getRecord();
        if(form.isValid()) {
            me.passwordVerificationWin(function(btn, password) {
                if(btn == 'ok') {
                    User.verifyUserPass(password, function(provider, response) {
                        if(response.result) {
                            record.set({auth_uid: user.id});
                            store.sync({
                                callback: function() {
                                    form.reset();
                                    me.msg('Sweet!', 'Vitals Signed');
                                    me.updateProgressNote();
                                    me.resetVitalsForm();
                                    me.vitalsPanel.down('vitalsdataview').refresh();
                                }
                            });

                        } else {
                            Ext.Msg.show({
                                title  : 'Oops!',
                                msg    : 'Incorrect password',
                                buttons: Ext.Msg.OKCANCEL,
                                icon   : Ext.Msg.ERROR,
                                fn     : function(btn) {
                                    if(btn == 'ok') {
                                        me.onVitalsSign();
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    },

    /**
     * Takes the form data to be send and adds the default
     * data used by every encounter form. For example
     * pid (Patient ID), eid (Encounter ID), uid (User ID),
     * and date (Current datetime as 00-00-00 00:00:00)
     * @param data
     */
    addDefaultData: function(data) {
        data.pid = app.currPatient.pid;
        data.eid = app.currEncounterId;
        data.uid = user.id;
        data.date = Ext.Date.format(new Date(), 'Y-m-d H:i:s');
        return data;
    },

    /**
     * Cancels the New Encounter process, closing the window
     * and send the user to the Patient Summary panel
     */
    cancelNewEnc: function() {
        this.newEncounterWindow.close();
        app.openPatientSummary();
    },

    /**
     *
     * @param eid
     */
    openEncounter: function(eid) {
        var me = this, vitals;
        me.eid = app.currEncounterId = eid;
        me.encounterStore.getProxy().extraParams.eid = eid;
        me.encounterStore.load({
            scope   : me,
            callback: function(record) {
                var data = record[0].data;
                me.currEncounterStartDate = data.start_date;
                if(!data.close_date) {
                    me.startTimer();
                    me.setButtonsDisabled(me.getButtonsToDisable());
                } else {
                    if(me.stopTimer()) {
                        var timer = me.timer(data.start_date, data.close_date), patient = me.getCurrPatient();
                        me.updateTitle(patient.name + ' - ' + Ext.Date.format(me.currEncounterStartDate, 'F j, Y, g:i:s a') + ' (Closed Encounter)', app.currPatient.readOnly, timer);
                        me.setButtonsDisabled(me.getButtonsToDisable(), true);
                    }
                }

                if(me.vitalsPanel){
                    vitals = me.vitalsPanel.down('vitalsdataview');
                    me.resetVitalsForm();
                    vitals.store = record[0].vitalsStore;
                    vitals.refresh();
                }


                if(me.reviewSysPanel) me.reviewSysPanel.getForm().loadRecord(record[0].reviewofsystems().getAt(0));
                if(me.reviewSysCkPanel) me.reviewSysCkPanel.getForm().loadRecord(record[0].reviewofsystemschecks().getAt(0));
                if(me.soapPanel) me.soapPanel.getForm().loadRecord(record[0].soap().getAt(0));

                //me.speechDicPanel.getForm().loadRecord(record[0].speechdictation().getAt(0));

                me.encounterEventHistoryStore.load({params: {eid: eid}});

                if(me.soapPanel) me.soapPanel.query('icdsfieldset')[0].loadIcds(record[0].soap().getAt(0).data.icdxCodes);

                if(me.CurrentProceduralTerminology) {
                    me.CurrentProceduralTerminology.encounterCptStoreLoad(record[0].data.pid, eid, function() {
                        me.CurrentProceduralTerminology.setDefaultQRCptCodes();
                    });
                }
                me.priorityCombo.setValue(data.priority);
                app.PreventiveCareWindow.loadPatientPreventiveCare();
                me.resetTabs();
            }
        });
    },

    /**
     * Function to close the encounter..
     */
    closeEncounter            : function() {
        var me = this, form, values;
        me.passwordVerificationWin(function(btn, password) {
            if(btn == 'ok') {
                form = me.checkoutWindow.down('form').getForm();
                values = form.getValues();
                values.eid = app.currEncounterId;
                values.pid = app.currPatient.pid;
                values.close_date = Ext.Date.format(new Date(), 'Y-m-d H:i:s');
                values.signature = password;
                Encounter.closeEncounter(values, function(provider, response) {
                    if(response.result.success) {
                        if(me.stopTimer()) {

                            app.openPatientVisits();
                            me.msg('Sweet!', 'Encounter Closed');
                        }
                    } else {
                        Ext.Msg.show({
                            title  : 'Oops!',
                            msg    : 'Incorrect password',
                            buttons: Ext.Msg.OKCANCEL,
                            icon   : Ext.Msg.ERROR,
                            fn     : function(btn) {
                                if(btn == 'ok') {
                                    me.closeEncounter();
                                }
                            }
                        });
                    }
                });
            }
        });
    },
    /**
     * listen for the progress note panel and runs the
     * doLayout function to re-adjust the dimensions.
     */
    progressNoteCollapseExpand: function() {
        this.centerPanel.doLayout();
    },

    updateProgressNote: function() {
        var me = this;
        Encounter.getProgressNoteByEid(app.currEncounterId, function(provider, response) {
            var data = response.result;
            me.progressNote.tpl.overwrite(me.progressNote.body, data);
        });
    },

    onTapPanelChange: function(panel) {
        if(panel.card.itemId == 'encounter') {
            this.isProgressNoteCollapsed(true);
        } else {
            this.isProgressNoteCollapsed(true);
        }
    },

    isProgressNoteCollapsed: function(ans) {
        ans ? this.progressNote.collapse() : this.progressNote.expand();

    },

    onVitalsClick: function(view, record, e) {
        var me = this, form = me.vitalsPanel.down('form').getForm();
        form.reset();
        if(!record.data.auth_uid) {
            me.vitalsPanel.query('button[action="signBtn"]')[0].setDisabled(false);
            form.loadRecord(record);
        } else {
            Ext.Msg.show({
                title        : 'Oops!',
                msg          : 'This column can not be modified because it has been signed by ' + record.data.auth_uid,
                buttons      : Ext.Msg.OK,
                icon         : Ext.Msg.WARNING,
                animateTarget: e
            });
        }
    },

    resetVitalsForm  : function() {
        var me = this, form = me.vitalsPanel.down('form').getForm(), model = Ext.ModelManager.getModel('App.model.patient.Vitals'), newModel = Ext.ModelManager.create({}, model);
        me.vitalsPanel.query('button[action="signBtn"]')[0].setDisabled(true);
        form.loadRecord(newModel);
    },

    //***************************************************************************************************//
    //***************************************************************************************************//
    //*********    *****  ******    ****** **************************************************************//
    //*********  *  ****  ****  ***  ***** **************************************************************//
    //*********  **  ***  ***  *****  **** **************************************************************//
    //*********  ***  **  ***  *****  **** **************************************************************//
    //*********  ****  *  ****  ***  ********************************************************************//
    //*********  *****    *****    ******* **************************************************************//
    //***************************************************************************************************//
    //***************************************************************************************************//
    alertIconRenderer: function(v) {
        if(v == 1) {
            return '<img src="ui_icons/icoLessImportant.png" />'
        } else if(v == 2) {
            return '<img src="ui_icons/icoImportant.png" />'
        }
        return v;
    },

    /**
     * Start the timerTask
     */
    startTimer: function() {
        Ext.TaskManager.start(this.timerTask);
        return true;
    },
    /**
     * stops the timerTask
     */
    stopTimer : function() {
        Ext.TaskManager.stop(this.timerTask);
        return true;
    },

    /**
     * This will update the timer every sec
     */
    encounterTimer: function() {
        var me = this;
        var timer = me.timer(me.currEncounterStartDate, new Date()), patient = me.getCurrPatient();
        me.updateTitle(patient.name + ' - ' + Ext.Date.format(me.currEncounterStartDate, 'F j, Y, g:i:s a') + ' (Opened Encounter)', app.currPatient.readOnly, timer);
    },

    /**
     * This function use the "start time" and "stop time"
     * and gets the time elapsed between the two then
     * returns it as a timer (00:00:00)  or (1 day(s) 00:00:00)
     * if more than 24 hrs
     *
     * @param start
     * @param stop
     */
    timer: function(start, stop) {
        var ms = Ext.Date.getElapsed(start, stop), t, sec = Math.floor(ms / 1000);

        function twoDigit(d) {
            return (d >= 10) ? d : '0' + d;
        }

        var min = Math.floor(sec / 60);
        sec = sec % 60;
        t = twoDigit(sec);
        var hr = Math.floor(min / 60);
        min = min % 60;
        t = twoDigit(min) + ":" + t;
        var day = Math.floor(hr / 24);
        hr = hr % 24;
        t = twoDigit(hr) + ":" + t;
        t = (day == 0 ) ? '<span class="time">' + t + '</span>' : '<span class="day">' + day + ' day(s)</span><span class="time">' + t + '</span>';
        return t;
    },

    /**
     * Convert Celsius to Fahrenheit
     * @param field
     * @param e
     */
    cf: function(field, e) {
        var v = field.getValue(), temp = 9 * v / 5 + 32, res = Ext.util.Format.round(temp, 1);
        if(e.getKey() != e.TAB) {
            field.up('form').getForm().findField('temp_f').setValue(res);
        }
    },
    /**
     * Convert Fahrenheit to Celsius
     * @param field
     * @param e
     */
    fc: function(field, e) {
        var v = field.getValue(), temp = (v - 32) * 5 / 9, res = Ext.util.Format.round(temp, 1);
        if(e.getKey() != e.TAB) {
            field.up('form').getForm().findField('temp_c').setValue(res);
        }
    },

    /**
     * Convert Lbs to Kg
     * @param field
     * @param e
     */
    lbskg: function(field, e) {
        var v = field.getValue(), weight = v / 2.2, res = Ext.util.Format.round(weight, 1);
        if(e.getKey() != e.TAB) {
            field.up('form').getForm().findField('weight_kg').setValue(res);
        }
    },
    /**
     * Convert Kg to Lbs
     * @param field
     * @param e
     */
    kglbs: function(field, e) {
        var v = field.getValue(), weight = v * 2.2, res = Ext.util.Format.round(weight, 1);
        if(e.getKey() != e.TAB) {
            field.up('form').getForm().findField('weight_lbs').setValue(res);
        }
    },
    /**
     * Convert Inches to Centimeter
     * @param field
     * @param e
     */
    incm : function(field, e) {
        var v = field.getValue(), weight = v * 2.54, res = Ext.util.Format.round(weight, 1);
        if(e.getKey() != e.TAB) {
            if(field.name == 'head_circumference_in') {
                field.up('form').getForm().findField('head_circumference_cm').setValue(res);
            } else if(field.name == 'waist_circumference_in') {
                field.up('form').getForm().findField('waist_circumference_cm').setValue(res);
            } else if(field.name == 'height_in') {
                field.up('form').getForm().findField('height_cm').setValue(res);
            }
        }
    },
    /**
     * Convert Centimeter to Inches
     * @param field
     * @param e
     */
    cmin : function(field, e) {
        var v = field.getValue(), weight = v * 0.39, res = Ext.util.Format.round(weight, 1);
        if(e.getKey() != e.TAB) {
            if(field.name == 'head_circumference_cm') {
                field.up('form').getForm().findField('head_circumference_in').setValue(res);
            } else if(field.name == 'waist_circumference_cm') {
                field.up('form').getForm().findField('waist_circumference_in').setValue(res);
            } else if(field.name == 'height_cm') {
                field.up('form').getForm().findField('height_in').setValue(res);
            }
        }
    },

    bmi: function(field) {
        var form = field.up('form').getForm(), weight = form.findField('weight_kg').getValue(), height = form.findField('height_cm').getValue(), bmi, status;
        if(weight > 0 && height > 0) {
            bmi = weight / (height / 100 * height / 100);
            if(bmi < 15) {
                status = 'Very severely underweight'
            } else if(bmi >= 15 && bmi < 16) {
                status = 'Severely underweight'
            } else if(bmi >= 16 && bmi < 18.5) {
                status = 'Underweight'
            } else if(bmi >= 18.5 && bmi < 25) {
                status = 'Normal'
            } else if(bmi >= 25 && bmi < 30) {
                status = 'Overweight'
            } else if(bmi >= 30 && bmi < 35) {
                status = 'Obese Class I'
            } else if(bmi >= 35 && bmi < 40) {
                status = 'Obese Class II'
            } else if(bmi >= 40) {
                status = 'Obese Class III'
            }
            field.up('form').getForm().findField('bmi').setValue(Ext.util.Format.number(bmi, '0.00'));
            field.up('form').getForm().findField('bmi_status').setValue(status);

        }

    },

    /**
     * After this panel is render add the forms and listeners for conventions
     */
    beforePanelRender: function() {
        var me = this, form, defaultFields = function() {
                return [
                    {name: 'id', type: 'int'},
                    {name: 'pid', type: 'int'},
                    {name: 'eid', type: 'int'},
                    {name: 'uid', type: 'int'}
                ]
            };
        /**
         * Get 'Vitals' Form Fields and add listeners to convert values
         */
        if(me.vitalsPanel){
            me.getFormItems(me.vitalsPanel.down('form'), 'Vitals', function() {
                form = me.vitalsPanel.down('form').getForm();
                form.findField('temp_c').addListener('keyup', me.cf, me);
                form.findField('temp_f').addListener('keyup', me.fc, me);
                form.findField('weight_lbs').addListener('keyup', me.lbskg, me);
                form.findField('weight_kg').addListener('keyup', me.kglbs, me);
                form.findField('height_cm').addListener('keyup', me.cmin, me);
                form.findField('height_in').addListener('keyup', me.incm, me);
                form.findField('weight_lbs').addListener('blur', me.bmi, me);
                form.findField('weight_kg').addListener('blur', me.bmi, me);
                form.findField('height_cm').addListener('blur', me.bmi, me);
                form.findField('height_in').addListener('blur', me.bmi, me);
                form.findField('head_circumference_cm').addListener('keyup', me.cmin, me);
                form.findField('head_circumference_in').addListener('keyup', me.incm, me);
                form.findField('waist_circumference_cm').addListener('keyup', me.cmin, me);
                form.findField('waist_circumference_in').addListener('keyup', me.incm, me);
            });
        }
        /**
         * Get 'Review of Systems' Form and define the Model using the form fields
         */
        if(me.reviewSysPanel){
            me.getFormItems(me.reviewSysPanel, 'Review of Systems', function() {
                var formFields = me.reviewSysPanel.getForm().getFields(), modelFields = new defaultFields;
                for(var i = 0; i < formFields.items.length; i++) {
                    modelFields.push({name: formFields.items[i].name, type: 'auto'});
                }
                Ext.define('App.model.patient.ReviewOfSystems', {
                    extend   : 'Ext.data.Model',
                    fields   : modelFields,
                    proxy    : {
                        type: 'direct',
                        api : {
                            update: Encounter.updateReviewOfSystemsById
                        }
                    },
                    belongsTo: { model: 'App.model.patient.Encounter', foreignKey: 'eid' }
                });
            });
        }
        /**
         * Get 'SOAP' Form and define the Model using the form fields
         */
        if(me.soapPanel){
            me.getFormItems(me.soapPanel, 'SOAP', function() {
                var formFields = me.soapPanel.getForm().getFields(), modelFields = new defaultFields;
                for(var i = 0; i < formFields.items.length; i++) {
                    modelFields.push({name: formFields.items[i].name, type: 'auto'});
                }
                Ext.define('App.model.patient.SOAP', {
                    extend   : 'Ext.data.Model',
                    fields   : modelFields,
                    proxy    : {
                        type: 'direct',
                        api : {
                            update: Encounter.updateSoapById
                        }
                    },
                    belongsTo: { model: 'App.model.patient.Encounter', foreignKey: 'eid' }
                });
            });
        }
        /**
         * Get 'Speech Dictation' Form and define the Model using the form fields
         */
//        this.getFormItems(me.speechDicPanel, 'Speech Dictation', function() {
//            var formFields = me.speechDicPanel.getForm().getFields(), modelFields = new defaultFields;
//            for(var i = 0; i < formFields.items.length; i++) {
//                modelFields.push({name: formFields.items[i].name, type: 'auto'});
//            }
//            Ext.define('App.model.patient.SpeechDictation', {
//                extend   : 'Ext.data.Model',
//                fields   : modelFields,
//                proxy    : {
//                    type: 'direct',
//                    api : {
//                        update: Encounter.updateDictationById
//                    }
//                },
//                belongsTo: { model: 'App.model.patient.Encounter', foreignKey: 'eid' }
//            });
//        });
        /**
         * Get 'Review of Systems Check' Form and define the Model using the form fields
         */
        if(me.reviewSysCkPanel){
            me.getFormItems(me.reviewSysCkPanel, 'Review of Systems Check', function() {
                var formFields = me.reviewSysCkPanel.getForm().getFields(), modelFields = new defaultFields;
                for(var i = 0; i < formFields.items.length; i++) {
                    modelFields.push({name: formFields.items[i].name, type: 'auto'});
                }
                Ext.define('App.model.patient.ReviewOfSystemsCheck', {
                    extend   : 'Ext.data.Model',
                    fields   : modelFields,
                    proxy    : {
                        type: 'direct',
                        api : {
                            update: Encounter.updateReviewOfSystemsChecksById
                        }
                    },
                    belongsTo: { model: 'App.model.patient.Encounter', foreignKey: 'eid' }
                });
            });
        }

        if(me.newEncounterWindow) me.getFormItems(me.newEncounterWindow.down('form'), 'New Encounter');
    },

    getButtonsToDisable: function() {
        var me = this, buttons = [];
        if(me.ButtonsToDisable == null){
            if(me.vitalsPanel) buttons.concat(buttons, me.vitalsPanel.query('button'));
            if(me.reviewSysPanel) buttons.concat(buttons, me.reviewSysPanel.query('button'));
            if(me.reviewSysCkPanel) buttons.concat(buttons, me.reviewSysCkPanel.query('button'));
            if(me.soapPanel) buttons.concat(buttons, me.soapPanel.query('button'));
            if(me.MiscBillingOptionsPanel) buttons.concat(buttons, me.MiscBillingOptionsPanel.query('button'));
            if(me.CurrentProceduralTerminology) buttons.concat(buttons, me.CurrentProceduralTerminology.query('button'));
            if(me.EncounterEventHistory) buttons.concat(buttons, me.EncounterEventHistory.query('button'));
            if(me.newEncounterWindow) buttons.concat(buttons, me.newEncounterWindow.query('button'));
            if(me.checkoutWindow) buttons.concat(buttons, me.checkoutWindow.query('button'));
            me.ButtonsToDisable = buttons;
        }
        return me.ButtonsToDisable;
    },

    resetTabs:function(){
        var me = this;
        if(me.renderAdministrative) me.centerPanel.setActiveTab(0);
        if(me.encounterTabPanel) me.encounterTabPanel.setActiveTab(0);
        if(me.administrativeTabPanel) me.administrativeTabPanel.setActiveTab(0);
    },

    onDocumentView: function(grid, rowIndex) {
        var rec = grid.getStore().getAt(rowIndex),
            src = rec.data.url;
        app.onDocumentView(src);
    },
    /**
     * This function is called from MitosAPP.js when
     * this panel is selected in the navigation panel.
     * place inside this function all the functions you want
     * to call every this panel becomes active
     */
    onActive      : function(callback) {
        var me = this, patient = app.currPatient;
        if(me.checkIfCurrPatient()) {
            me.updateTitle(patient.name + ' (Visits)', patient.readOnly, null);
            me.setReadOnly(patient.readOnly);
            callback(true);
        } else {
            callback(false);
            me.currPatientError();
        }
    }
});
