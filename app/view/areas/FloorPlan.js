/**
 * Created by JetBrains PhpStorm.
 * User: ernesto
 * Date: 3/16/12
 * Time: 9:09 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('App.view.areas.FloorPlan', {
	id       : 'panelAreaFloorPlan',
	extend   : 'App.classes.RenderPanel',
	pageTitle: 'Area Floor Plan',
	floorPlanId:null,
	initComponent: function() {
		var me = this;
		me.floorPlanZonesStore = Ext.create('App.store.administration.FloorPlanZones');

		me.floorPlan = Ext.create('Ext.panel.Panel',{
			title:'Floor Plan',
			layout:'absolute',
			tbar:[
				'->',
				{
					xtype:'floorplanareascombo',
					fieldLabel:'Area',
					labelWidth:40,
					listeners:{
						scope:me,
						select:me.onFloorPlanSelect
					}
				}
			],
			tools:[
				{
			        type: 'refresh',
					scope:me,
			        handler: me.setZones
				}
			]
		});

		me.pageBody = [ me.floorPlan ];

		me.callParent(arguments);
	},


	loadZone:function(record){
		var me = this, zone, form;
		zone = Ext.create('Ext.button.Split', {
		    text:record.data.title,
			scale:'medium',
			x:record.data.x,
			y:record.data.y,
			itemId:record.data.id,
			scope:me,
			handler:me.onZoneClicked,
			// --->
			// Zone specific reference data
			pid:null,
			zoneId:record.data.id,
			priority:null,
			patientZoneId:null,
			// <---
			menu:[
				form = Ext.create('Ext.form.Panel',{
					bodyPadding:'5 5 0 5',
					items:[
						{
							xtype:'textfield',
							fieldLabel:'Patient Name',
							labelWidth:80,
							name:'patient_name'
						},
						{
							xtype:'button',
							text:'Remove Patient',
							handler:function(){
								me.unSetZone(zone);
							}
						}
					]
				})
			],
			tooltip:'Patient Name: [empty]',
			listeners:{
				scope:me,
				render:me.initializeZone
//				menushow:me.afterMenuShow,
//				menuhide:me.afterMenuHide
			}
		});
		//zone.update({title:record.data.title});
		me.floorPlan.add(zone);
		form.getForm().loadRecord(record);
	},

	onZoneClicked:function(btn){
		say(btn);
		app.setCurrPatient(btn.data.pid, btn.data.name, btn.data.priority, function(){
			btn.data.eid ? app.openEncounter(btn.data.eid) : app.openPatientSummary();
		});
	},

	onFloorPlanSelect:function(field, record){
		var me = this;
		me.floorPlanId = record[0].data.id;
		me.loadZones(function(){
			me.setZones();
		});
	},

	loadZones:function(callback){
		var me = this;
		me.floorPlan.removeAll();
		me.floorPlanZonesStore.load({
			params:{ floor_plan_id:this.floorPlanId },
			scope:me,
			callback:function(records, operation, success){
				for(var i=0; i < records.length; i++){
					me.loadZone(records[i]);
				}
				callback();
			}
		});
	},

	initializeZone: function(panel) {
		var me = this;
		panel.dragZone = Ext.create('Ext.dd.DragZone', panel.getEl(), {
			ddGroup    : 'patientPoolAreas',
			getDragData: function(e) {
				var sourceEl = panel.btnEl.dom, d;
				if(sourceEl) {
					d = sourceEl.cloneNode(true);
					d.id = Ext.id();
					return panel.dragData = {
								sourceEl: sourceEl,
								repairXY: Ext.fly(sourceEl).getXY(),
								ddel    : d,
								patientData : panel.data,
								zone: panel
					};
				}
			},
			getRepairXY: function(e) {
				return this.dragData.repairXY;
			},
			b4MouseDown: function(e) {
		        this.autoOffset(e.getPageX(), e.getPageY());
		    }
		});

		panel.dragZone.lock();

		panel.dropZone = Ext.create('Ext.dd.DropZone', panel.getEl(), {
			ddGroup   : 'patientPoolAreas',
			notifyOver: function(dd, e, data) {
				if(panel.pid == null) {
					return Ext.dd.DropZone.prototype.dropAllowed;
				}else{
					return Ext.dd.DropZone.prototype.dropNotAllowed;
				}
			},
			notifyDrop: function(dd, e, data) {
				panel.data = data.patientData;
				if(data.zone){
					me.unAssignPatient(data.zone, panel.data);
				}
				me.assignPatient(panel, panel.data);
			}
		});
	},

	assignPatient:function(zone, data){
		var me = this,
			params = {
				zone_id:zone.zoneId,
				pid:data.pid
			};
		FloorPlans.setPatientToZone(params,function(provider, response){
			data.patientZoneId = response.result.data.patientZoneId;
			me.msg('Sweet!', data.name + ' successfully moved.');
			me.setZone(zone, data);
		});
	},

	unAssignPatient:function(zone, data){
		var me = this;
		FloorPlans.unSetPatientZoneByPatientZoneId(data.patientZoneId,function(){
			me.unSetZone(zone)
		});
	},

	setZone:function(zone, data){
		zone.pid = data.pid;
		zone.priority = data.priority;
		zone.patientZoneId = data.patientZoneId;
		zone.dropZone.lock();
		zone.dragZone.unlock();
		zone.setTooltip('Patient Name:' + data.name);
		zone.addCls(data.priority);
	},

	unSetZone:function(zone){
		zone.pid = null;
		zone.data = null;
		zone.dropZone.unlock();
		zone.dragZone.lock();
		zone.setTooltip('Patient Name: [empty]');
		zone.removeCls(zone.priority);
	},

	setZones:function(){
		var me = this, zone, zones, data;
		FloorPlans.getPatientsZonesByFloorPlanId(me.floorPlanId, function(provider, response){
			zones = me.floorPlan.items.items;
			data = response.result;

			for(var j=0; j < zones.length; j++){
				me.unSetZone(zones[j]);
			}

			for(var i=0; i < data.length; i++){
				zone = me.floorPlan.getComponent(data[i].zoneId);
				zone.data = data[i];
				me.setZone(zone, data[i]);
			}
		})
	},

	setFloorPlan:function(floorPlanId){

	},

	onActive: function(callback) {
		var me = this;
		if(me.floorPlanId == null){
			me.floorPlanId = 1;
			me.floorPlan.query('floorplanareascombo')[0].setValue(me.floorPlanId);
			me.loadZones(function(){
				me.setZones();
			});
		}else{
			me.setZones();
		}
		callback(true);
	}

});