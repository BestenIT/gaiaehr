/**
 * Created by JetBrains PhpStorm.
 * User: Ernesto J. Rodriguez (Certun)
 * File:
 * Date: 2/18/12
 * Time: 10:46 PM
 */
Ext.define('App.view.patient.windows.ArrivalLog', {
	extend: 'App.classes.window.Window',
	title      : 'Patient Arrival Log',
	closeAction: 'hide',
    layout     : 'fit',
	modal      : true,
	width      : 900,
	height     : 600,
	maximizable: true,
	initComponent: function() {
		var me = this;


        me.store = Ext.create('App.store.patient.PatientArrivalLog',{
            autoSync:true
        });

		me.tbar = [
            {
                xtype       : 'patienlivetsearch',
                fieldLabel  : 'Look for Patient',
                width       : 400,
                hideLabel:false,
                enableKeyEvents:true,
                listeners:{
                    scope:me,
                    select:me.onPatientSearchSelect,
                    keyup:me.onPatientSearchKeyUp

                }
		    },
            '-',
            {
                text:'Add New Patient',
                iconCls:'icoAddRecord',
                action:'newPatientBtn',
                disabled:true,
                scope:me,
                handler:me.onNewPatient
		    },
            '->',
            {
                xtype:'tool',
                type: 'refresh',
                scope:me,
                handler:me.onGridReload
            }
        ];

		me.items = [
            me.ckGrid = Ext.create('Ext.grid.Panel',{
                store:me.store,
                margin:5,
                columns:[
                    {
                        xtype:'actioncolumn',
                        width:25,
                        items: [
                            {
                                icon: 'ui_icons/delete.png',  // Use a URL in the icon config
                                tooltip: 'Remove',
                                scope:me,
                                handler: me.onPatientRemove
                            }
                        ]
                    },
                    {
                        header:'Time',
                        dataIndex:'time',
	                    width:130
                    },
                    {
                        header:'Record #',
                        dataIndex:'pid'
                    },
                    {
                        header:'Patient Name',
                        dataIndex:'name',
                        flex:1
                    },
                    {
                        header:'Insurance',
                        dataIndex:'insurance'
                    },
                    {
                        header:'Area',
                        dataIndex:'area'
                    },
                    {
                        width:25,
                        dataIndex:'warning',
                        renderer:me.warnRenderer
                    }
                ],
                listeners:{
                    scope:me,
                    itemdblclick:me.onPatientDlbClick
                }

            })
		];

		me.listeners = {
			scope:me,
			show:me.onWinShow
		};

		me.callParent(arguments);
	},

    onPatientSearchSelect:function(field, record){
        var me = this,
            store = me.query('grid')[0].getStore(),
            btn = me.query('button[action="newPatientBtn"]')[0];
        store.add({
            pid:record[0].data.pid,
            name:record[0].data.fullname,
            time: Ext.Date.format(new Date(), 'Y-m-d H:i:s'),
            isNew:false
        });
        field.reset();
        btn.setDisabled(true);
    },

    onPatientSearchKeyUp:function(field){
        this.query('button[action="newPatientBtn"]')[0].setDisabled(field.getValue() == null);
    },

    onNewPatient:function(btn){
        var me = this,
            field = me.query('patienlivetsearch')[0],
            name = field.getValue(),
            store = me.query('grid')[0].getStore();
        field.reset();
        btn.disable();
        store.add({
            name:name,
            time: Ext.Date.format(new Date(), 'Y-m-d H:i:s'),
            isNew:true
        });
    },

    onPatientRemove:function(grid, rowIndex){
        var store = grid.getStore(),
	        me = this,
            record = store.getAt(rowIndex);
	    Encounter.checkForAnOpenedEncounterByPid({pid:record.data.pid,date:Ext.Date.format(new Date(), 'Y-m-d H:i:s')}, function(provider, response){
		    if(response.result) {
			    me.msg('Oops!', 'Patient have a opened encounter');
		    } else {
			    me.msg('Sweet!', 'Patient have been removed');
			    store.remove(record);
		    }
	    });




    },

    onPatientDlbClick:function(grid, record){
        var me = this,
            data = record.data;
	    // TODO: pass priority!
        app.setCurrPatient(data.pid, data.name, '', function(){
            app.openPatientSummary();
        });
        me.close();
    },

    onGridReload:function(){
        this.store.load();
    },

	onWinShow:function(){
        var me = this;
        me.onGridReload();
        new Ext.util.DelayedTask(function(){
            me.query('patienlivetsearch')[0].focus();
        }).delay(1000);

	}

});
