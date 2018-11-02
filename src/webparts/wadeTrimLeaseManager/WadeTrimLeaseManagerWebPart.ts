import * as ko from 'knockout';
import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';

import * as mo from 'moment';
import * as moment from 'moment';


import * as strings from 'WadeTrimLeaseManagerWebPartStrings';
import WadeTrimLeaseManagerViewModel, { IWadeTrimLeaseManagerBindingContext } from './WadeTrimLeaseManagerViewModel';

//Telerik Kendo UI Required Imports
import '@progress/kendo-ui';
import 'kendo-ui-core';
import * as $ from 'jquery';
import {  SPHttpClient, SPHttpClientResponse, ISPHttpClientOptions} from '@microsoft/sp-http';
import { IWebPartContext } from '@microsoft/sp-webpart-base';
import { sp, Item, ItemAddResult, ItemUpdateResult } from '@pnp/sp'; 
import { SPFetchClient, SPOAuthEnv } from "@pnp/nodejs";
import { SPList } from '@microsoft/sp-page-context';
import { stringIsNullOrEmpty, dateAdd } from '@pnp/common';
import styles from './WadeTrimLeaseManager.module.scss';


let _instance: number = 0;

export interface IWadeTrimLeaseManagerWebPartProps {
  description: string;
  items:any[];
}

export default class WadeTrimLeaseManagerWebPart extends BaseClientSideWebPart<IWadeTrimLeaseManagerWebPartProps> {
  private _id: number;
  private _componentElement: HTMLElement;
  private _koDescription: KnockoutObservable<string> = ko.observable('');
  private _koItems: KnockoutObservableArray<any>=ko.observableArray();
  private static _NewItem:boolean = false;
  private _spPNPListData:any[];

  /**
   * Shouter is used to communicate between web part and view model.
   */
  private _shouter: KnockoutSubscribable<{}> = new ko.subscribable();

  /**
   * Initialize the web part.
   */
  protected onInit(): Promise<void> {
    this._id = _instance++;

    const tagName: string = `ComponentElement-${this._id}`;
    this._componentElement = this._createComponentElement(tagName);
    this._registerComponent(tagName);

    // When web part description is changed, notify view model to update.
    this._koDescription.subscribe((newValue: string) => {
      this._shouter.notifySubscribers(newValue, 'description');
    });

    this._koItems.subscribe((newitems:any[])=>{
      this._shouter.notifySubscribers(newitems, 'items');
    });

    // Get Connection to current site
    sp.setup({spfxContext: this.context});

    sp.web.lists.getByTitle("LeaseManagement").items.getAll().then((FirstItems:any[]) =>{
      this._spPNPListData = FirstItems;
    });

    const bindings: IWadeTrimLeaseManagerBindingContext = {
      description: this.properties.description,
      items:this._spPNPListData,
      shouter: this._shouter 
    };

    ko.applyBindings(bindings, this._componentElement);

    return super.onInit();
  }

  public refreshGrid():void{
    var kgrid = $("#LeaseGrid").data("kendoGrid");
            sp.web.lists.getByTitle("LeaseManagement").items.getAll().then((FirstItems:any[]) =>{
              FirstItems.forEach((item)=>{
                item.Lease_x0020_Expiration = mo(Date.parse(item.Lease_x0020_Expiration)).format('L');
              });
              this._koItems(FirstItems);
              this._koItems.notifySubscribers(FirstItems,'items');
              
              kgrid.dataSource.data(this._koItems());
              //kgrid.dataSource.data.First().style(styles["k-header"]);
              
            });
  }

  public render(): void {
    var grid:any;
    var selectedlease:any;
    if (!this.renderedOnce) {
      this.domElement.appendChild(this._componentElement);
      var WindowsBaseHTML = $('#PropEditwindow').text();
      $('#LeaseWebpart').height.bind($('LeaseGrid').height);
      SetUpPropWindow();
        var PropEditWindow = $("#PropEditwindow").kendoWindow({
          height:660,
          width: 990,
          minWidth:500,
          minHeight:700,
          title: "Blank" ,
          visible: false,
          scrollable:true,
          modal:true,
          actions: [
              "Maximize",
              "Close"
          ],
          close:(onClose)=>{
            this.refreshGrid();
            //PropEditWindow.title('New Property');
            WadeTrimLeaseManagerWebPart._NewItem=false;
          },
          
          
      }).data("kendoWindow");

      SetUpEquipWindow();
        var EquipEditWindow = $("#EquipEditwindow").kendoWindow({
          height:660,
          width: 990,
          minWidth:500,
          minHeight:700,
          title: "Blank" ,
          visible: false,
          scrollable:true,
          modal:true,
          actions: [
              "Maximize",
              "Close"
          ],
          close:(onClose)=>{
            this.refreshGrid();
            //PropEditWindow.title('New Property');
            WadeTrimLeaseManagerWebPart._NewItem=false;
          },
          
          
      }).data("kendoWindow");

      SetUpVehicleWindow();
        var VehicleEditWindow = $("#VehicleEditwindow").kendoWindow({
          height:660,
          width: 990,
          minWidth:500,
          minHeight:700,
          title: "Blank" ,
          visible: false,
          scrollable:true,
          modal:true,
          actions: [
              "Maximize",
              "Close"
          ],
          close:(onClose)=>{
            this.refreshGrid();
            //PropEditWindow.title('New Property');
            WadeTrimLeaseManagerWebPart._NewItem=false;
          },
          
          
      }).data("kendoWindow");
    
    
    sp.web.lists.getByTitle("LeaseManagement").items.getAll().then((FirstItems:any[]) =>{
      this._koItems = ko.observableArray(FirstItems);

      const bindings: IWadeTrimLeaseManagerBindingContext = {
        description: this.properties.description,
        items:this._koItems(),
        shouter: this._shouter 

      };

      $("#toolbar").kendoToolBar({ 
        items:
        [
          {
              template: "<label for='kddLeaseType'>Lease Type:</label> <input id='kddLeaseType' style='width: 150px;' />",
              overflow: "never"
          },
          { type: "separator", overflow:"never" },
          {type: "button",text: "Refresh",showText:"overflow", overflow:"never",icon:"refresh",showIcon:"both",click:(arg)=>{

            this.refreshGrid();
          }
        },
          {type: "button",text: "Add Property",showText:"both", overflow:"never",icon:"add",showIcon:"both", click:(arg)=>{
            ClearPropWindow();
            PropEditWindow.title('New Property Lease');
            WadeTrimLeaseManagerWebPart._NewItem=true;
            PropEditWindow.center().open();
          }
          
        },
        {type: "button",text: "Add Equipment",showText:"both", overflow:"never",icon:"add",showIcon:"both", click:(arg)=>{
          ClearEquipWindow();
          EquipEditWindow.title('New Equipment Lease');
          WadeTrimLeaseManagerWebPart._NewItem=true;
          EquipEditWindow.center().open();
        } 
      },
      {type: "button",text: "Add Vehicle",showText:"both", overflow:"never",icon:"add",showIcon:"both", click:(arg)=>{
        ClearVehicleWindow();
        VehicleEditWindow.title('New Vehicle Lease');
        WadeTrimLeaseManagerWebPart._NewItem=true;
        VehicleEditWindow.center().open();
      }
      }
          
        ]
      });
      //$("#TestR").kendoButton();
      
      $("#kddLeaseType").kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        dataSource: [
          { text: "Property", value: 1 },  
          { text: "Plotter", value: 2},       
            { text: "Copier", value: 3 },
            { text: "Vehicle", value: 4 }
        ],
        change:(test)=>{sp.web.lists.getByTitle("LeaseManagement").items.getAll().then((newItems: any[]) =>{
          var grida = $("#LeaseGrid").data("kendoGrid");
          var Selected = $('#kddLeaseType').data("kendoDropDownList");
          switch(Selected.text()){
            case "Property":{
              grida.showColumn("Premises");
              grida.showColumn("Lanlord");
              grida.showColumn("Lease_x0020_Expiration");
              grida.hideColumn("Equipment_x0020_Description");
              grida.hideColumn("Leasing_x0020_Company");
              grida.hideColumn("Driver");
              grida.hideColumn("VIN");
              grida.hideColumn("Year");
              grida.hideColumn("Make");
              grida.hideColumn("Model");
              grida.hideColumn("Minimum_x0020_Payment");
              grida.dataSource.filter({ field: "RecordType", operator: "contains", value: "Property" });
              
              break;
            }
            case "Plotter":{
              grida.hideColumn("Premises"); 
              grida.hideColumn("Lanlord");
              grida.hideColumn("Lease_x0020_Expiration");
              grida.hideColumn("Driver");
              grida.hideColumn("VIN");
              grida.hideColumn("Year");
              grida.hideColumn("Make");
              grida.hideColumn("Model");
              grida.showColumn("Equipment_x0020_Description");
              grida.showColumn("Leasing_x0020_Company");
              grida.showColumn("Lease_x0020_Expiration");
              grida.showColumn("Minimum_x0020_Payment");
              grida.dataSource.filter({ field: "RecordType", operator: "contains", value: "Plotter" });
              break;
            }
            case "Copier":{
              grida.hideColumn("Premises"); 
              grida.hideColumn("Lanlord");
              grida.hideColumn("Lease_x0020_Expiration");
              grida.hideColumn("Driver");
              grida.hideColumn("VIN");
              grida.hideColumn("Year");
              grida.hideColumn("Make");
              grida.hideColumn("Model");
              grida.showColumn("Equipment_x0020_Description");
              grida.showColumn("Leasing_x0020_Company");
              grida.showColumn("Lease_x0020_Expiration");
              grida.showColumn("Minimum_x0020_Payment");

              grida.dataSource.filter({ field: "RecordType", operator: "contains", value: "Copier" });
              break;
            }
            case "Vehicle":{
              grida.showColumn("Title");
              grida.showColumn("Driver");
              grida.showColumn("VIN");
              grida.showColumn("Year");
              grida.showColumn("Make");
              grida.showColumn("Model");
              grida.showColumn("Lease_x0020_Expiration");
              grida.showColumn("Minimum_x0020_Payment");
              grida.hideColumn("Premises"); 
              grida.hideColumn("Lanlord");
              grida.hideColumn("Equipment_x0020_Description");
              grida.dataSource.filter({ field: "RecordType", operator: "contains", value: "Vehicle" });
              break;
            }
            default:{
              grida.hideColumn("Premises");
              grida.dataSource.filter(null);
                     }
          }

          
    });
      }
    });

      grid = $("#LeaseGrid").kendoGrid({autoBind: true,
      dataSource: {
        data: bindings.items,
        schema: {
            model: {
                fields: {
                  //_x0020_
                    Id:{type: "number"},
                    Title: { type: "string" },
                    Premises:{type: "string"},
                    Landlord: {type: "string"},
                    RecordType:{type: "string"},
                    Lease_x0020_Expiration: {type: "Date"},
                    Cancellation_x0020_Details:{type:"string"},
                    Cancellation_x0020_Option:{type:"boolean"},
                    Electricity_x0020_Included:{type:"string"},
                    Gas_x0020_Included:{type:"boolean"},
                    Lease_x0020_Commencement: {type: "Date"},
                    Lease_x0020_Type:{type: "string"},
                    Operating_x0020_Expenses:{type: "string"},
                    Opt_x002d_Out_x0020_Warning: {type: "Date"},
                    Renewal_x0020_Option_x0028_s_x00:{type: "string"},
                    Rent:{type:"String"},
                    Right_x0020_of_x0020_First_x0020:{type:"boolean"},
                    Security_x0020_Deposit:{type:"number"},
                    Size:{type:"number"},
                    Tenant_x0020_Improvements_x0020_:{type: "string"},
                    Term:{type: "string"},
                    Water_x0020_Included:{type:"boolean"},
                    Billing_x0020_Fequency:{type: "string"},
                    Buy_x0020_Out_x0020_Option:{type: "boolean"},
                    Equipment_x0020_Description:{type: "string"},
                    Leasing_x0020_Company:{type: "string"},
                    Minimum_x0020_Payment:{type:"number"},
                    Minimum_x0020_Term:{type:"number"},
                    Equipment_x0020_Location:{type: "string"},
                    Equipment_x0020_Office:{type: "string"},
                    Driver:{type: "string"},
                    VIN:{type: "string"},
                    Project:{type: "string"},
                    CO_x002f_Phase_x002f_ORG:{type: "string"},
                    Unit:{type: "string"},
                    Market_x0020_Segment:{type: "string"},
                    Vehicle_x0020_Office:{type: "string"},
                    Year:{type: "string"},
                    Make:{type: "string"},
                    Model:{type: "string"},
                    Lic_x0020_State:{type: "string"},
                    Plate_x0020__x0023_:{type: "string"},
                    Delivery_x0020_Date:{type: "Date"},
                    Mileage:{type: "string"},
                    Early_x0020_Cancellation:{type: "Date"}
                

                }
            }
        },
        
        
        filter:({ field: "RecordType", operator: "contains", value: "Property" }),
        
    },
      height: 550,
      change:(arg)=>{
        
        var kgrid = $("#LeaseGrid").data("kendoGrid");
        selectedlease = kgrid.dataItem(kgrid.select().first());
        
        switch(selectedlease.RecordType)
        {
          case "Property":
            UpdatePropData(selectedlease);
            PropEditWindow.title(selectedlease.Title);
            PropEditWindow.center().open();
            break;
            case "Plotter":
            UpdateEquipData(selectedlease);
            EquipEditWindow.title(selectedlease.Title);
            EquipEditWindow.center().open();
            break;
            case "Copier":
            UpdateEquipData(selectedlease);
            EquipEditWindow.title(selectedlease.Title);
            EquipEditWindow.center().open();
            break;
            case "Vehicle":
            UpdateVehicleData(selectedlease);
            VehicleEditWindow.title(selectedlease.Title);
            VehicleEditWindow.center().open();
            break;
        }
      },
      selectable:"row",
      sortable:true,
      scrollable:false,
      columns: [{
        field:"Id",
        hidden:true
    },{
        field:"Title",
        filterable: true 
    },
    {
      field:"Driver",
      title:"Driver",
      filterable: true,
      encoded: false,
      hidden:true,
    },
    {
      field:"RecordType",
      title:"Record Type",
      filterable: true,
      encoded: false,
      hidden:true,
  
  },
  {
    field:"Premises",
    title:"Premises",
    filterable: true,
    encoded: false,
    hidden:false,
  },
  {
    field:"Lanlord",
    title:"Landlord",
    filterable: true,
    hidden:false
  },
  {
    field:"Cancellation_x0020_Details",
    title:"Cancellation Details",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Cancellation_x0020_Option",
    title:"Cancellation Option",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Electricity_x0020_Included",
    title:"Electricity Included",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Gas_x0020_Included",
    title:"Gas Included",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Lease_x0020_Commencement",
    title:"Lease Commencement",
    filterable: true,
    encoded: false,
    hidden:true,
    format: "{0: MMM dd yyyy}"
  },
  {
    field:"Lease_x0020_Type",
    title:"Lease Type",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Operating_x0020_Expenses",
    title:"Operating Expenses",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Opt_x002d_Out_x0020_Warning",
    title:"Opt-Out Warning",
    filterable: true,
    encoded: false,
    hidden:true,
    format: "{0: MMM dd yyyy}"
  },
  {
    field:"Renewal_x0020_Option_x0028_s_x00",
    title:"Renewal Option(s)",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"RentId",
    title:"RentId",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Right_x0020_of_x0020_First_x0020",
    title:"Right of First Refusal",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Security_x0020_Deposit",
    title:"Security Deposit",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Size",
    title:"Size",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Tenant_x0020_Improvements_x0020_",
    title:"Tenant Improvements",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Term",
    title:"Term",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Water_x0020_Included",
    title:"Water Included",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Billing_x0020_Fequency",
    title:"Billing Frequency",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Buy_x0020_Out_x0020_Option",
    title:"Buy-Out Option",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Equipment_x0020_Description",
    title:"Equipment Description",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Leasing_x0020_Company",
    title:"Leasing Company",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Minimum_x0020_Payment",
    title:"Minimum Payment",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Minimum_x0020_Term",
    title:"Minimum Term",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Equipment_x0020_Location",
    title:"Equipment Location",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Equipment_x0020_Office",
    title:"Equipment Office",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Lease_x0020_Expiration",
    title:"Lease Expiration",
    sortable: {
      initialDirection: "desc"  
    },
    filterable: true,
    encoded: false,
    hidden:false,
    format: "{0: MMM dd yyyy}"
  },
  {
    field:"Equipment_x0020_Office",
    title:"Equipment Office",
    filterable: true,
    encoded: false,
    hidden:true,
    
  },
  {
    field:"VIN",
    title:"VIN",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Project",
    title:"Project",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"CO_x002f_Phase_x002f_ORG",
    title:"CO/Phase/ORG",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Unit",
    title:"Unit",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Market_x0020_Segment",
    title:"Market Segment",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Vehicle_x0020_Office",
    title:"Vehicle Office",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Year",
    title:"Year",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Make",
    title:"Make",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Model",
    title:"Model",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Lic_x0020_State",
    title:"Lic Sate",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Plate_x0020__x0023_",
    title:"Plate #",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  {
    field:"Delivery_x0020_Date",
    title:"Delivery Date",
    filterable: true,
    encoded: false,
    hidden:true,
    format: "{0: MMM dd yyyy}"
  },
  {
    field:"Early_x0020_Cancellation",
    title:"Early Cancellation",
    filterable: true,
    encoded: false,
    hidden:true,
    format: "{0: MMM dd yyyy}"
  },
  {
    field:"Mileage",
    title:"Mileage",
    filterable: true,
    encoded: false,
    hidden:true,
  },
  { command: {title: "Remove",name:"Remove" ,click: onClickGridCmd},width: "100px" }
  
]});
  });
    }
  
  function GetExpTemplate(expdate)
  {
    if(moment(expdate).subtract(90,'days') <= moment(Date.now()))
    {
      return "<span style='color:red; font-weight:bold'>"+moment(expdate).format("MM/dd/yyy")+"</span>";
    }
    else
    {
      return kendo.toString(new Date(expdate), 'MM/dd/yyyy');
    }

  }
  function onClickGridCmd(e):any
  {
    if(e.data.commandName == "Edit")
    {
      
          selectedlease = grid.dataItem($(e.currentTarget).closest("tr"));
          
          switch(selectedlease.RecordType)
          {
            case "Property":
              WadeTrimLeaseManagerWebPart._NewItem = false;
              UpdatePropData(selectedlease);
              PropEditWindow.title(selectedlease.Title);
              PropEditWindow.center().open();
              WadeTrimLeaseManagerWebPart._NewItem = false;
              break;
              case "Plotter":
              WadeTrimLeaseManagerWebPart._NewItem = false;
              UpdateEquipData(selectedlease);
              EquipEditWindow.title(selectedlease.Title);
              EquipEditWindow.center().open();
              WadeTrimLeaseManagerWebPart._NewItem = false;
              break;
              case "Copier":
              WadeTrimLeaseManagerWebPart._NewItem = false;
              UpdateEquipData(selectedlease);
              EquipEditWindow.title(selectedlease.Title);
              EquipEditWindow.center().open();
              WadeTrimLeaseManagerWebPart._NewItem = false;
              break;
              case "Vehicle":
              WadeTrimLeaseManagerWebPart._NewItem = false;
              UpdateVehicleData(selectedlease);
              VehicleEditWindow.title(selectedlease.Title);
              VehicleEditWindow.center().open();
              WadeTrimLeaseManagerWebPart._NewItem = false;
              break;
          }
        }
        else if(e.data.commandName == "Remove")
        {
          var gridr = $("#LeaseGrid").data("kendoGrid");
          selectedlease = gridr.dataItem($(e.currentTarget).closest("tr"));
          var dialog = $('#dialog');
          dialog.kendoDialog({
            width: "300px",
            title: "Lease Deletion",
            closable: false,
            modal: true,
            content: "<p>Do you want to  delete Lease : " +selectedlease.Title+".</p>" ,
            actions: [
                { text: 'Yes', action:(control)=>{//
                  sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).delete().then(_=>{}).then(()=>{
                  var kgrid = $("#LeaseGrid").data("kendoGrid");
                  sp.web.lists.getByTitle("LeaseManagement").items.getAll().then((FirstItems:any[]) =>{
                  FirstItems.forEach((item)=>{
                  item.Lease_x0020_Expiration = mo(Date.parse(item.Lease_x0020_Expiration)).format('L');
              });
              //his._koItems(FirstItems);
              //this._koItems.notifySubscribers(FirstItems,'items');
              
              kgrid.dataSource.data(FirstItems);
              
            });
                  }
                    
                  );
                } },
                { text: 'No'}
            ],
        }).data("kendoDialog").close();

        dialog.data("kendoDialog").open();
          
        }
  }

function SetUpPropWindow() {
      $('#PropForm').kendoResponsivePanel();
      $('#Prop_Field_1_Label').text("Property Title:");
      
      
      $('#Prop_Field_2_Label').text("Premises:");
      
      
      $('#Prop_Field_2').kendoEditor({encoded:false, });

      $('#Prop_Field_3_Label').text("Landlord:");

      $('#Prop_Field_4_Label').text("Lease Commencement:");

      $('#Prop_Field_4').kendoDatePicker(
          {
              format:"{0: MMM dd, yyyy}",
          }
      );
      
      $('#Prop_Field_5_Label').text("Lease Expiration:");

      $('#Prop_Field_5').kendoDatePicker(
          {
              format:"{0: MMM dd, yyyy}",
          }
      );   
      
      $('#Prop_Field_6_Label').text("Rent:");
      $('#Prop_Field_6').kendoEditor({encoded:false, });

      $('#Prop_Field_7_Label').text("Cancellation Option :");

      $('#Prop_Field_8_Label').text("Cancellation Details :");
      $('#Prop_Field_8').kendoEditor({encoded:false, });

      $('#Prop_Field_9_Label').text("Size:");

      $('#Prop_Field_10_Label').text("Term:");

      $('#Prop_Field_11_Label').text("Lease Type:");

      $('#Prop_Field_12_Label').text("Electricity Included :");

      $('#Prop_Field_13_Label').text("Water Included :");

      $('#Prop_Field_14_Label').text("Gas Included :");

      $('#Prop_Field_15_Label').text("Operating Expenses & Taxes :");
      $('#Prop_Field_15').kendoEditor({encoded:false, });

      $('#Prop_Field_16_Label').text("Tenant Improvements :");
      $('#Prop_Field_16').kendoEditor({encoded:false, });

      $('#Prop_Field_17_Label').text("Renewal Options :");
      $('#Prop_Field_17').kendoEditor({encoded:false, });

      $('#Prop_Field_18_Label').text("Right of First Refusal :");
      
      $('#Prop_Field_19_Label').text("Security Deposit:").val(0);

      $('#Prop_Field_20_Label').text("Early Cancellation Date:");

      $('#Prop_Field_20').kendoDatePicker(
          {
              format:"{0: MMM dd, yyyy}",
          }
      );
      
      var Prop_Attachments = $("#Prop_Attachments").kendoListBox({dataTextField:"FileName",dataValueField:"ServerRelativeUrl",template:'<div class="item"><a href="#:ServerRelativeUrl#" target="_blank">#:FileName# </a></div>',selectable:"single"}).data("kendoListBox");

   $('#PropAddFile').kendoButton({
      enable:(WadeTrimLeaseManagerWebPart._NewItem?false:true),
      click:(arg)=>{
        switch(WadeTrimLeaseManagerWebPart._NewItem)
          {
            case false:
              const fileinput = $('#Prop_Field_21');
              var filereader = new FileReader();
              //var data = filereader.readAsArrayBuffer(fileinput[0].files[0])
              sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).attachmentFiles.add(fileinput[0].files[0].name,fileinput[0].files[0]).then((rdata)=>{
                sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
                  $("#Prop_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
                });
                fileinput.val('');
                $("#Prop_Attachments").data("kendoListBox").refresh();
              });
              break;
      }
    }});

    $('#PropRemoveFile').kendoButton({
      enable:(WadeTrimLeaseManagerWebPart._NewItem?false:true),
      click:(arg)=>{
        switch(WadeTrimLeaseManagerWebPart._NewItem)
          {
            case false:
              const selected = $("#Prop_Attachments").data("kendoListBox").select().first();
              var filereader = new FileReader();
              let item = sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID);
              item.attachmentFiles.getByName(selected[0].innerText).delete().then(()=>{
                sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
                  $("#Prop_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
              });
            });
              break;
      }
    }});

      $('#Prop_Save_Top').kendoButton({
          click:Update=>{
            switch(WadeTrimLeaseManagerWebPart._NewItem)
            {
              case true:
              sp.web.lists.getByTitle("LeaseManagement").items.add(
                {
                  Title:$('#Prop_Field_1').val(),
                  Premises:$('#Prop_Field_2').data("kendoEditor").value(),
                  Lanlord:$('#Prop_Field_3').val(),
                  Lease_x0020_Commencement:$('#Prop_Field_4').data("kendoDatePicker").value(),
                  Lease_x0020_Expiration:$('#Prop_Field_5').data("kendoDatePicker").value(),
                  Rent:$('#Prop_Field_6').data("kendoEditor").value(),
                  Cancellation_x0020_Option:$('#Prop_Field_7').prop('checked'),
                  Cancellation_x0020_Details:$('#Prop_Field_8').data("kendoEditor").value(),
                  Size:($('#Prop_Field_9').val())?$('#Prop_Field_9').val():0,
                  Term:($('#Prop_Field_10').val())?$('#Prop_Field_10').val():0,
                  Lease_x0020_Type:$('#Prop_Field_11').val(),
                  Electricity_x0020_Included:$('#Prop_Field_12').prop('checked'),
                  Water_x0020_Included:$('#Prop_Field_13').prop('checked'),
                  Gas_x0020_Included:$('#Prop_Field_14').prop('checked'),
                  Operating_x0020_Expenses:$('#Prop_Field_15').data("kendoEditor").value(),
                  Tenant_x0020_Improvements_x0020_:$('#Prop_Field_16').data("kendoEditor").value(),
                  Renewal_x0020_Option_x0028_s_x00:$('#Prop_Field_17').data("kendoEditor").value(),
                  Right_x0020_of_x0020_First_x0020:$('#Prop_Field_18').prop('checked'),
                  Security_x0020_Deposit:$('#Prop_Field_19').val(),
                  Early_x0020_Cancellation:$('#Prop_Field_21').data("kendoDatePicker").value(),
                  RecordType:'Property'
                }
              ).then((newrecord)=>{
                const fileinput = $('#Vehicle_Field_22');
                var filereader = new FileReader();
                //var data = filereader.readAsArrayBuffer(fileinput[0].files[0])
                sp.web.lists.getByTitle("LeaseManagement").items.getById(newrecord.data.ID).attachmentFiles.add(fileinput[0].files[0].name,fileinput[0].files[0]).then((rdata)=>{
                  sp.web.lists.getByTitle("LeaseManagement").items.getById(newrecord.data.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
                    $("#Prop_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
                  });
                  fileinput.val('');
                  $("#Prop_Attachments").data("kendoListBox").data.refresh();
                });
              }).then(()=>{
                $('#PropEditwindow').data("kendoWindow").close();
                  }); 
              break;
              case false:
              sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).update({
                  Title:$('#Prop_Field_1').val(),
                  Premises:$('#Prop_Field_2').data("kendoEditor").value(),
                  Lanlord:$('#Prop_Field_3').val(),
                  Lease_x0020_Commencement:$('#Prop_Field_4').data("kendoDatePicker").value(),
                  Lease_x0020_Expiration:$('#Prop_Field_5').data("kendoDatePicker").value(),
                  Rent:$('#Prop_Field_6').data("kendoEditor").value(),
                  Cancellation_x0020_Option:$('#Prop_Field_7').prop('checked'),
                  Cancellation_x0020_Details:$('#Prop_Field_8').data("kendoEditor").value(),
                  Size:($('#Prop_Field_9').val())?$('#Prop_Field_9').val():0,
                  Term:($('#Prop_Field_10').val())?$('#Prop_Field_10').val():0,
                  Lease_x0020_Type:$('#Prop_Field_11').val(),
                  Electricity_x0020_Included:$('#Prop_Field_12').prop('checked'),
                  Water_x0020_Included:$('#Prop_Field_13').prop('checked'),
                  Gas_x0020_Included:$('#Prop_Field_14').prop('checked'),
                  Operating_x0020_Expenses:$('#Prop_Field_15').data("kendoEditor").value(),
                  Tenant_x0020_Improvements_x0020_:$('#Prop_Field_16').data("kendoEditor").value(),
                  Renewal_x0020_Option_x0028_s_x00:$('#Prop_Field_17').data("kendoEditor").value(),
                  Right_x0020_of_x0020_First_x0020:$('#Prop_Field_18').prop('checked'),
                  Security_x0020_Deposit:$('#Prop_Field_19').val(),
                  Early_x0020_Cancellation:$('#Prop_Field_20').data("kendoDatePicker").value(),
                  RecordType:'Property'

              }).then(()=>{
              $('#PropEditwindow').data("kendoWindow").close();
                }); 
                break;
              }
                 //this.items(this._koItems);         
          }
          
            });
            $('#Prop_Save_Bottom').kendoButton({
              click:Update=>{
                switch(WadeTrimLeaseManagerWebPart._NewItem)
            {
              case true:
              sp.web.lists.getByTitle("LeaseManagement").items.add(
                {
                  Title:$('#Prop_Field_1').val(),
                  Premises:$('#Prop_Field_2').data("kendoEditor").value(),
                  Lanlord:$('#Prop_Field_3').val(),
                  Lease_x0020_Commencement:$('#Prop_Field_4').data("kendoDatePicker").value(),
                  Lease_x0020_Expiration:$('#Prop_Field_5').data("kendoDatePicker").value(),
                  Rent:$('#Prop_Field_6').data("kendoEditor").value(),
                  Cancellation_x0020_Option:$('#Prop_Field_7').prop('checked'),
                  Cancellation_x0020_Details:$('#Prop_Field_8').data("kendoEditor").value(),
                  Size:($('#Prop_Field_9').val())?$('#Prop_Field_9').val():0,
                  Term:($('#Prop_Field_10').val())?$('#Prop_Field_10').val():0,
                  Lease_x0020_Type:$('#Prop_Field_11').val(),
                  Electricity_x0020_Included:$('#Prop_Field_12').prop('checked'),
                  Water_x0020_Included:$('#Prop_Field_13').prop('checked'),
                  Gas_x0020_Included:$('#Prop_Field_14').prop('checked'),
                  Operating_x0020_Expenses:$('#Prop_Field_15').data("kendoEditor").value(),
                  Tenant_x0020_Improvements_x0020_:$('#Prop_Field_16').data("kendoEditor").value(),
                  Renewal_x0020_Option_x0028_s_x00:$('#Prop_Field_17').data("kendoEditor").value(),
                  Right_x0020_of_x0020_First_x0020:$('#Prop_Field_18').prop('checked'),
                  Security_x0020_Deposit:$('#Prop_Field_19').val(),
                  Early_x0020_Cancellation:$('#Prop_Field_20').data("kendoDatePicker").value(),
                  RecordType:'Property'
                }
              ).then((newrecord)=>{
                const fileinput = $('#Vehicle_Field_22');
                var filereader = new FileReader();
                //var data = filereader.readAsArrayBuffer(fileinput[0].files[0])
                sp.web.lists.getByTitle("LeaseManagement").items.getById(newrecord.data.ID).attachmentFiles.add(fileinput[0].files[0].name,fileinput[0].files[0]).then((rdata)=>{
                  sp.web.lists.getByTitle("LeaseManagement").items.getById(newrecord.data.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
                    $("#Prop_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
                    $("#Prop_Attachments").data("kendoListBox").refresh();
                  });
                  fileinput.val('');
                });
              }).then(()=>{
                $('#PropEditwindow').data("kendoWindow").close();
                  }); 
              break;
              case false:
              sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).update({
                  Title:$('#Prop_Field_1').val(),
                  Premises:$('#Prop_Field_2').data("kendoEditor").value(),
                  Lanlord:$('#Prop_Field_3').val(),
                  Lease_x0020_Commencement:$('#Prop_Field_4').data("kendoDatePicker").value(),
                  Lease_x0020_Expiration:$('#Prop_Field_5').data("kendoDatePicker").value(),
                  Rent:$('#Prop_Field_6').data("kendoEditor").value(),
                  Cancellation_x0020_Option:$('#Prop_Field_7').prop('checked'),
                  Cancellation_x0020_Details:$('#Prop_Field_8').data("kendoEditor").value(),
                  Size:($('#Prop_Field_9').val())?$('#Prop_Field_9').val():0,
                  Term:($('#Prop_Field_10').val())?$('#Prop_Field_10').val():0,
                  Lease_x0020_Type:$('#Prop_Field_11').val(),
                  Electricity_x0020_Included:$('#Prop_Field_12').prop('checked'),
                  Water_x0020_Included:$('#Prop_Field_13').prop('checked'),
                  Gas_x0020_Included:$('#Prop_Field_14').prop('checked'),
                  Operating_x0020_Expenses:$('#Prop_Field_15').data("kendoEditor").value(),
                  Tenant_x0020_Improvements_x0020_:$('#Prop_Field_16').data("kendoEditor").value(),
                  Renewal_x0020_Option_x0028_s_x00:$('#Prop_Field_17').data("kendoEditor").value(),
                  Right_x0020_of_x0020_First_x0020:$('#Prop_Field_18').prop('checked'),
                  Security_x0020_Deposit:$('#Prop_Field_19').val(),
                  Early_x0020_Cancellation:$('#Prop_Field_20').data("kendoDatePicker").value(),
                  RecordType:'Property'

              }).then(()=>{
              $('#PropEditwindow').data("kendoWindow").close();
                }); 
                break;
              }}
              
                });

                $('#Prop_Cancel_Top').kendoButton({
                  click:Update=>{
                    $('#PropEditwindow').data("kendoWindow").close();
                  }});

                $('#Prop_Cancel_Bottom').kendoButton({
                  click:Update=>{
                    $('#PropEditwindow').data("kendoWindow").close();
                  }});

  }

  function SetUpVehicleWindow() {
    $('#VehicleForm').kendoResponsivePanel();
    $('#VehicleType_1').kendoDropDownList();
    $('#Vehicle_Field_1_Label').text("Enterprise Id :");
    
    
    $('#Vehicle_Field_2_Label').text("Driver :");    

    $('#Vehicle_Field_3_Label').text("VIN :");

    $('#Vehicle_Field_4_Label').text("Project:");

    $('#Vehicle_Field_5_Label').text("CO/Phase/ORG :");

    $('#Vehicle_Field_6_Label').text("Unit :");

    $('#Vehicle_Field_7_Label').text("Market Segment :");

    $('#Vehicle_Field_8_Label').text("Vehicle Office :");

    $('#Vehicle_Field_9_Label').text("Leasing Company :");

    $('#Vehicle_Field_10_Label').text("Lease Expiration :");
    $('#Vehicle_Field_10').kendoDatePicker(
      {
          format:"{0: MMM dd, yyyy}",
      }
  );

    $('#Vehicle_Field_11_Label').text("Min Term :").val(0);

    $('#Vehicle_Field_12_Label').text("Billing Frequency :").val(0);

    $('#Vehicle_Field_13_Label').text("Minimum Payment:").val(0);

    $('#Vehicle_Field_14_Label').text("Year:");

    $('#Vehicle_Field_15_Label').text("Make:");

    $('#Vehicle_Field_16_Label').text("Model:");

    $('#Vehicle_Field_17_Label').text("Lic. Sate :");

    $('#Vehicle_Field_18_Label').text("Plate # :");

    $('#Vehicle_Field_19_Label').text("Delivery Date :");
    $('#Vehicle_Field_19').kendoDatePicker(
      {
          format:"{0: MMM dd, yyyy}",
      }
  );  

    $('#Vehicle_Field_20_Label').text("Mileage :");
    $('#Vehicle_Field_20').kendoEditor({encoded:false, });

    $('#Vehicle_Field_21_Label').text("Buy Out Option:");

    $('#Vehicle_Cancel_Top').kendoButton({
        click:(arg)=>{
            $('#VehicleEditwindow').data("kendoWindow").close();
        }
    });

    $('#Vehicle_Cancel_Bottom').kendoButton({
        click:(arg)=>{
            $('#VehicleEditwindow').data("kendoWindow").close();
        }
    });
    var Vehicle_Attachments = $("#Vehicle_Attachments").kendoListBox({dataTextField:"FileName",dataValueField:"ServerRelativeUrl",template:'<div class="item"><a href="#:ServerRelativeUrl#" target="_blank">#:FileName# </a></div>',selectable:"single"}).data("kendoListBox");

   $('#VehicleAddFile').kendoButton({
      enable:(WadeTrimLeaseManagerWebPart._NewItem?false:true),
      click:(arg)=>{
        switch(WadeTrimLeaseManagerWebPart._NewItem)
          {
            case false:
              const fileinput = $('#Vehicle_Field_22');
              var filereader = new FileReader();
              //var data = filereader.readAsArrayBuffer(fileinput[0].files[0])
              sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).attachmentFiles.add(fileinput[0].files[0].name,fileinput[0].files[0]).then((rdata)=>{
                sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
                  $("#Vehicle_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
                  $("#Vehicle_Attachments").data("kendoListBox").refresh();
                });
                fileinput.val('');
              });
              break;
      }
    }});

    $('#VehicleRemoveFile').kendoButton({
      enable:(WadeTrimLeaseManagerWebPart._NewItem?false:true),
      click:(arg)=>{
        switch(WadeTrimLeaseManagerWebPart._NewItem)
          {
            case false:
              const selected = $("#Vehicle_Attachments").data("kendoListBox").select().first();
              var filereader = new FileReader();
              let item = sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID);
              item.attachmentFiles.getByName(selected[0].innerText).delete().then(()=>{
                sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
                  $("#Vehicle_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
              });
            });
              break;
      }
    }});


    
    
    $('#Vehicle_Save_Top').kendoButton({
        click:Update=>{
          switch(WadeTrimLeaseManagerWebPart._NewItem)
          {
            case true:
            sp.web.lists.getByTitle("LeaseManagement").items.add(
              {
                Title:$('#Vehicle_Field_1').val(),
                Driver:$('#Vehicle_Field_2').val(),
                VIN:$('#Vehicle_Field_3').val(),
                Project:$('#Vehicle_Field_4').val(),
                CO_x002f_Phase_x002f_ORG:$('#Vehicle_Field_5').val(),
                Unit:$('#Vehicle_Field_6').val(),
                Market_x0020_Segment:$('#Vehicle_Field_7').val(),
                Vehicle_x0020_Office:$('#Vehicle_Field_8').val(),
                Leasing_x0020_Company:$('#Vehicle_Field_9').val(),
                Lease_x0020_Expiration:$('#Vehicle_Field_10').data("kendoDatePicker").value(),
                Minimum_x0020_Term:($('#Vehicle_Field_11').val())?$('#Vehicle_Field_11').val():0,
                Billing_x0020_Fequency:$('#Vehicle_Field_12').val(),
                Minimum_x0020_Payment:$($('#Vehicle_Field_13').val())?$('#Vehicle_Field_13').val():0,
                Year:$('#Vehicle_Field_14').val(),
                Make:$('#Vehicle_Field_15').val(),
                Model:$('#Vehicle_Field_16').val(),
                Lic_x0020_State:$('#Vehicle_Field_17').val(),
                Plate_x0020__x0023_:$('#Vehicle_Field_18').val(),
                Delivery_x0020_Date:$('#Vehicle_Field_19').data("kendoDatePicker").value(),
                Mileage:$('#Vehicle_Field_20').data("kendoEditor").value(),
                Buy_x0020_Out_x0020_Option:$('#Vehicle_Field_21').prop('checked'),
                RecordType:"Vehicle"
              }
            ).then((newrecord)=>{
              const fileinput = $('#Vehicle_Field_22');
              var filereader = new FileReader();
              //var data = filereader.readAsArrayBuffer(fileinput[0].files[0])
              sp.web.lists.getByTitle("LeaseManagement").items.getById(newrecord.data.ID).attachmentFiles.add(fileinput[0].files[0].name,fileinput[0].files[0]).then((rdata)=>{
                sp.web.lists.getByTitle("LeaseManagement").items.getById(newrecord.data.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
                  $("#Vehicle_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
                  $("#Vehicle_Attachments").data("kendoListBox").refresh();
                });
                fileinput.val('');
              });
            }).then(()=>{
              $('#VehicleEditwindow').data("kendoWindow").close();
                }); 
            break;
            case false:
            sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).update({
              Title:$('#Vehicle_Field_1').val(),
              Driver:$('#Vehicle_Field_2').val(),
              VIN:$('#Vehicle_Field_3').val(),
              Project:$('#Vehicle_Field_4').val(),
              CO_x002f_Phase_x002f_ORG:$('#Vehicle_Field_5').val(),
              Unit:$('#Vehicle_Field_6').val(),
              Market_x0020_Segment:$('#Vehicle_Field_7').val(),
              Vehicle_x0020_Office:$('#Vehicle_Field_8').val(),
              Leasing_x0020_Company:$('#Vehicle_Field_9').val(),
              Lease_x0020_Expiration:$('#Vehicle_Field_10').data("kendoDatePicker").value(),
              Minimum_x0020_Term:($('#Vehicle_Field_11').val())?$('#Vehicle_Field_11').val():0,
              Billing_x0020_Fequency:$('#Vehicle_Field_12').val(),
              Minimum_x0020_Payment:$($('#Vehicle_Field_13').val())?$('#Vehicle_Field_13').val():0,
              Year:$('#Vehicle_Field_14').val(),
              Make:$('#Vehicle_Field_15').val(),
              Model:$('#Vehicle_Field_16').val(),
              Lic_x0020_State:$('#Vehicle_Field_17').val(),
              Plate_x0020__x0023_:$('#Vehicle_Field_18').val(),
              Delivery_x0020_Date:$('#Vehicle_Field_19').data("kendoDatePicker").value(),
              Mileage:$('#Vehicle_Field_20').data("kendoEditor").value(),
              Buy_x0020_Out_x0020_Option:$('#Vehicle_Field_21').prop('checked'),
              RecordType:"Vehicle"
              
            }).then(()=>{
            $('#VehicleEditwindow').data("kendoWindow").close();
              }); 
              break;
            }
               //this.items(this._koItems);         
        }
        
          });
          $('#Vehicle_Save_Bottom').kendoButton({
            click:Update=>{
          switch(WadeTrimLeaseManagerWebPart._NewItem)
          {
            case true:
            sp.web.lists.getByTitle("LeaseManagement").items.add(
              {
                Title:$('#Vehicle_Field_1').val(),
                Driver:$('#Vehicle_Field_2').val(),
                VIN:$('#Vehicle_Field_3').val(),
                Project:$('#Vehicle_Field_4').val(),
                CO_x002f_Phase_x002f_ORG:$('#Vehicle_Field_5').val(),
                Unit:$('#Vehicle_Field_6').val(),
                Market_x0020_Segment:$('#Vehicle_Field_7').val(),
                Vehicle_x0020_Office:$('#Vehicle_Field_8').val(),
                Leasing_x0020_Company:$('#Vehicle_Field_9').val(),
                Lease_x0020_Expiration:$('#Vehicle_Field_10').data("kendoDatePicker").value(),
                Minimum_x0020_Term:($('#Vehicle_Field_11').val())?$('#Vehicle_Field_11').val():0,
                Billing_x0020_Fequency:$('#Vehicle_Field_12').val(),
                Minimum_x0020_Payment:$($('#Vehicle_Field_13').val())?$('#Vehicle_Field_13').val():0,
                Year:$('#Vehicle_Field_14').val(),
                Make:$('#Vehicle_Field_15').val(),
                Model:$('#Vehicle_Field_16').val(),
                Lic_x0020_State:$('#Vehicle_Field_17').val(),
                Plate_x0020__x0023_:$('#Vehicle_Field_18').val(),
                Delivery_x0020_Date:$('#Vehicle_Field_19').data("kendoDatePicker").value(),
                Mileage:$('#Vehicle_Field_20').data("kendoEditor").value(),
                Buy_x0020_Out_x0020_Option:$('#Vehicle_Field_21').prop('checked'),
                RecordType:"Vehicle"
              }
            ).then((newrecord)=>{
              const fileinput = $('#Vehicle_Field_22');
              var filereader = new FileReader();
              //var data = filereader.readAsArrayBuffer(fileinput[0].files[0])
              sp.web.lists.getByTitle("LeaseManagement").items.getById(newrecord.data.ID).attachmentFiles.add(fileinput[0].files[0].name,fileinput[0].files[0]).then((rdata)=>{
                sp.web.lists.getByTitle("LeaseManagement").items.getById(newrecord.data.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
                  $("#Vehicle_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
                  $("#Vehicle_Attachments").data("kendoListBox").refresh();
                });
                fileinput.val('');
              });
            }).then(()=>{
              $('#VehicleEditwindow').data("kendoWindow").close();
                }); 
            break;
            case false:
            sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).update({
              Title:$('#Vehicle_Field_1').val(),
              Driver:$('#Vehicle_Field_2').val(),
              VIN:$('#Vehicle_Field_3').val(),
              Project:$('#Vehicle_Field_4').val(),
              CO_x002f_Phase_x002f_ORG:$('#Vehicle_Field_5').val(),
              Unit:$('#Vehicle_Field_6').val(),
              Market_x0020_Segment:$('#Vehicle_Field_7').val(),
              Vehicle_x0020_Office:$('#Vehicle_Field_8').val(),
              Leasing_x0020_Company:$('#Vehicle_Field_9').val(),
              Lease_x0020_Expiration:$('#Vehicle_Field_10').data("kendoDatePicker").value(),
              Minimum_x0020_Term:($('#Vehicle_Field_11').val())?$('#Vehicle_Field_11').val():0,
              Billing_x0020_Fequency:$('#Vehicle_Field_12').val(),
              Minimum_x0020_Payment:$($('#Vehicle_Field_13').val())?$('#Vehicle_Field_13').val():0,
              Year:$('#Vehicle_Field_14').val(),
              Make:$('#Vehicle_Field_15').val(),
              Model:$('#Vehicle_Field_16').val(),
              Lic_x0020_State:$('#Vehicle_Field_17').val(),
              Plate_x0020__x0023_:$('#Vehicle_Field_18').val(),
              Delivery_x0020_Date:$('#Vehicle_Field_19').data("kendoDatePicker").value(),
              Mileage:$('#Vehicle_Field_20').data("kendoEditor").value(),
              Buy_x0020_Out_x0020_Option:$('#Vehicle_Field_21').prop('checked'),
              RecordType:"Vehicle"
              
            }).then(()=>{
            $('#VehicleEditwindow').data("kendoWindow").close();
              }); 
              break;
            }
               //this.items(this._koItems);         
        }            
              });

              $('#Prop_Cancel_Top').kendoButton({
                click:Update=>{
                  $('#VehicleEditwindow').data("kendoWindow").close();
                }});

              $('#Prop_Cancel_Bottom').kendoButton({
                click:Update=>{
                  $('#VehicleEditwindow').data("kendoWindow").close();
                }});

}

function SetUpEquipWindow() {
  $('#EquipForm').kendoResponsivePanel();
  $('#EquipType_1').kendoDropDownList();
  $('#EquipType_Label').text("Equipment Type");
  $('#EquipType_1').kendoDropDownList(
    {
      items:['Copier','Plotter']
    }
  );
  $('#Equip_Field_1_Label').text("Equipment Title :");
  
  
  $('#Equip_Field_2_Label').text("Equipment Description :");    
  $('#Equip_Field_2').kendoEditor({encoded:false });

  $('#Equip_Field_3_Label').text("Leasing Company :");

  $('#Equip_Field_4_Label').text("Lease Commencement :");

  $('#Equip_Field_4').kendoDatePicker(
      {
          format:"{0: MMM dd, yyyy}",
      }
  );
  
  $('#Equip_Field_5_Label').text("Lease Expiration :");

  $('#Equip_Field_5').kendoDatePicker(
      {
          format:"{0: MMM dd, yyyy}",
      }
  );   
  
  $('#Equip_Field_6_Label').text("Minimum Payment :");

  $('#Equip_Field_7_Label').text("Minimum Term :");

  $('#Equip_Field_8_Label').text("Billing Frequency :");

  $('#Equip_Field_9_Label').text("Equipment Office :");

  $('#Equip_Field_10_Label').text("Equipment Location :");

  $('#Equip_Field_11_Label').text("Buy Out Option :");

  var Equip_Attachments = $("#Equip_Attachments").kendoListBox({dataTextField:"FileName",dataValueField:"ServerRelativeUrl",template:'<div class="item"><a href="#:ServerRelativeUrl#" target="_blank">#:FileName# </a></div>',selectable:"single"}).data("kendoListBox");

   $('#EquipAddFile').kendoButton({
      enable:(WadeTrimLeaseManagerWebPart._NewItem?false:true),
      click:(arg)=>{
        switch(WadeTrimLeaseManagerWebPart._NewItem)
          {
            case false:
              const fileinput = $('#Equip_Field_12');
              var filereader = new FileReader();
              //var data = filereader.readAsArrayBuffer(fileinput[0].files[0])
              sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).attachmentFiles.add(fileinput[0].files[0].name,fileinput[0].files[0]).then((rdata)=>{
                sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
                  $("#Equip_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
                });
                fileinput.val('');
                $("#Equip_Attachments").data("kendoListBox").refresh();
              });
              break;
      }
    }});

    $('#EquipRemoveFile').kendoButton({
      enable:(WadeTrimLeaseManagerWebPart._NewItem?false:true),
      click:(arg)=>{
        switch(WadeTrimLeaseManagerWebPart._NewItem)
          {
            case false:
              const selected = $("#Equip_Attachments").data("kendoListBox").select().first();
              var filereader = new FileReader();
              let item = sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID);
              item.attachmentFiles.getByName(selected[0].innerText).delete().then(()=>{
                sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
                  $("#Equip_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
              });
            });
              break;
      }
    }});

  $('#Equip_Cancel_Top').kendoButton({
      click:(arg)=>{
          $('#EquipEditwindow').data("kendoWindow").close();
      }
  });

  $('#Equip_Cancel_Bottom').kendoButton({
      click:(arg)=>{
          $('#EquipEditwindow').data("kendoWindow").close();
      }
  });
  
  
  $('#Equip_Save_Top').kendoButton({
      click:Update=>{
        switch(WadeTrimLeaseManagerWebPart._NewItem)
        {
          case true:
          sp.web.lists.getByTitle("LeaseManagement").items.add(
            {
              Title:$('#Equip_Field_1').val(),
              Equipment_x0020_Description:$('#Equip_Field_2').data("kendoEditor").value(),
              Leasing_x0020_Company:$('#Equip_Field_3').val(),
              Lease_x0020_Commencement:$('#Equip_Field_4').data("kendoDatePicker").value(),
              Lease_x0020_Expiration:$('#Equip_Field_5').data("kendoDatePicker").value(),
              Minimum_x0020_Payment:($('#Equip_Field_6').val())?$('#Equip_Field_6').val():0,
              Minimum_x0020_Term:($('#Equip_Field_7').val())?$('#Equip_Field_7').val():0,
              Billing_x0020_Fequency:$('#Equip_Field_8').val(),
              Equipment_x0020_Office:$('#Equip_Field_9').val(),
              Equipment_x0020_Location:$('#Equip_Field_10').val(),
              Buy_x0020_Out_x0020_Option:$('#Equip_Field_11').prop('checked'),
              RecordType:$('#EquipType_1').val()
            }
          ).then((newrecord)=>{
            const fileinput = $('#Equip_Field_12');
            var filereader = new FileReader();
            //var data = filereader.readAsArrayBuffer(fileinput[0].files[0])
            sp.web.lists.getByTitle("LeaseManagement").items.getById(newrecord.data.ID).attachmentFiles.add(fileinput[0].files[0].name,fileinput[0].files[0]).then((rdata)=>{
              sp.web.lists.getByTitle("LeaseManagement").items.getById(newrecord.data.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
                $("#Equip_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
              });
              fileinput.val('');
            });
          }).then(()=>{
            $('#EquipEditwindow').data("kendoWindow").close();
              }); 
          break;
          case false:
          sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).update({
            Title:$('#Equip_Field_1').val(),
            Equipment_x0020_Description:$('#Equip_Field_2').data("kendoEditor").value(),
            Leasing_x0020_Company:$('#Equip_Field_3').val(),
            Lease_x0020_Commencement:$('#Equip_Field_4').data("kendoDatePicker").value(),
            Lease_x0020_Expiration:$('#Equip_Field_5').data("kendoDatePicker").value(),
            Minimum_x0020_Payment:($('#Equip_Field_6').val())?$('#Equip_Field_6').val():0,
            Minimum_x0020_Term:($('#Equip_Field_7').val())?$('#Equip_Field_7').val():0,
            Billing_x0020_Fequency:$('#Equip_Field_8').val(),
            Equipment_x0020_Office:$('#Equip_Field_9').val(),
            Equipment_x0020_Location:$('#Equip_Field_10').val(),
            Buy_x0020_Out_x0020_Option:$('#Equip_Field_11').prop('checked'),
            RecordType:$('#EquipType_1').val()

          }).then(()=>{
          $('#EquipEditwindow').data("kendoWindow").close();
            }); 
            break;
          }
             //this.items(this._koItems);         
      }
      
        });
        $('#Equip_Save_Bottom').kendoButton({
          click:Update=>{
        switch(WadeTrimLeaseManagerWebPart._NewItem)
        {
          case true:
          sp.web.lists.getByTitle("LeaseManagement").items.add(
            {
              Title:$('#Equip_Field_1').val(),
              Equipment_x0020_Description:$('#Equip_Field_2').data("kendoEditor").value(),
              Leasing_x0020_Company:$('#Equip_Field_3').val(),
              Lease_x0020_Commencement:$('#Equip_Field_4').data("kendoDatePicker").value(),
              Lease_x0020_Expiration:$('#Equip_Field_5').data("kendoDatePicker").value(),
              Minimum_x0020_Payment:($('#Equip_Field_6').val())?$('#Equip_Field_6').val():0,
              Minimum_x0020_Term:($('#Equip_Field_7').val())?$('#Equip_Field_7').val():0,
              Billing_x0020_Fequency:$('#Equip_Field_8').val(),
              Equipment_x0020_Office:$('#Equip_Field_9').val(),
              Equipment_x0020_Location:$('#Equip_Field_10').val(),
              Buy_x0020_Out_x0020_Option:$('#Equip_Field_11').prop('checked'),
              RecordType:$('#EquipType_1').val()
            }
          ).then((newrecord)=>{
            const fileinput = $('#Equip_Field_12');
            var filereader = new FileReader();
            //var data = filereader.readAsArrayBuffer(fileinput[0].files[0])
            sp.web.lists.getByTitle("LeaseManagement").items.getById(newrecord.data.ID).attachmentFiles.add(fileinput[0].files[0].name,fileinput[0].files[0]).then((rdata)=>{
              sp.web.lists.getByTitle("LeaseManagement").items.getById(newrecord.data.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
                $("#Equip_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
              });
              fileinput.val('');
            });
          }).then(()=>{
            $('#EquipEditwindow').data("kendoWindow").close();
              }); 
          break;
          case false:
          sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).update({
            Title:$('#Equip_Field_1').val(),
            Equipment_x0020_Description:$('#Equip_Field_2').data("kendoEditor").value(),
            Leasing_x0020_Company:$('#Equip_Field_3').val(),
            Lease_x0020_Commencement:$('#Equip_Field_4').data("kendoDatePicker").value(),
            Lease_x0020_Expiration:$('#Equip_Field_5').data("kendoDatePicker").value(),
            Minimum_x0020_Payment:($('#Equip_Field_6').val())?$('#Equip_Field_6').val():0,
            Minimum_x0020_Term:($('#Equip_Field_7').val())?$('#Equip_Field_7').val():0,
            Billing_x0020_Fequency:$('#Equip_Field_8').val(),
            Equipment_x0020_Office:$('#Equip_Field_9').val(),
            Equipment_x0020_Location:$('#Equip_Field_10').val(),
            Buy_x0020_Out_x0020_Option:$('#Equip_Field_11').prop('checked'),
            RecordType:$('#EquipType_1').val()
          }).then(()=>{
          $('#EquipEditwindow').data("kendoWindow").close();
            }); 
            break;
          }
             //this.items(this._koItems);         
      }            
            });

            $('#Prop_Cancel_Top').kendoButton({
              click:Update=>{
                $('#EquipEditwindow').data("kendoWindow").close();
              }});

            $('#Prop_Cancel_Bottom').kendoButton({
              click:Update=>{
                $('#EquipEditwindow').data("kendoWindow").close();
              }});

}

  function UpdatePropData(CurrentItem:any)
    {

        $('#PropAddFile').data('kendoButton').enable(true);
        $('#Prop_Field_1').val(CurrentItem.Title);

        var Propfield2= $('#Prop_Field_2').data("kendoEditor");
        Propfield2.value(CurrentItem.Premises);

        $('#Prop_Field_3').val(CurrentItem.Lanlord);

        var Propfield4 = $('#Prop_Field_4').data("kendoDatePicker");
        Propfield4.value(kendo.parseDate(CurrentItem.Lease_x0020_Commencement));
        Propfield4.trigger("change");

        var Propfield5 = $('#Prop_Field_5').data("kendoDatePicker");
        Propfield5.value(kendo.parseDate(CurrentItem.Lease_x0020_Expiration));
        Propfield5.trigger("change");

        var Propfield6= $('#Prop_Field_6').data("kendoEditor");
        Propfield6.value(CurrentItem.Rent);

        var Propfield7 = $('#Prop_Field_7');
        Propfield7.prop("checked",CurrentItem.Cancellation_x0020_Option);

        var Propfield8= $('#Prop_Field_8').data("kendoEditor");
        Propfield8.value(CurrentItem.Cancellation_x0020_Details);

        var Propfield9= $('#Prop_Field_9');
        Propfield9.val(CurrentItem.Size);

        var Propfield10= $('#Prop_Field_10');
        Propfield10.val(CurrentItem.Term);

        var Propfield11= $('#Prop_Field_11');
        Propfield11.val(CurrentItem.Lease_x0020_Type);

        var Propfield12 = $('#Prop_Field_12');
        Propfield12.prop("checked",CurrentItem.Electricity_x0020_Included);

        var Propfield13 = $('#Prop_Field_13');
        Propfield13.prop("checked",CurrentItem.Water_x0020_Included);

        var Propfield14 = $('#Prop_Field_14');
        Propfield14.prop("checked",CurrentItem.Gas_x0020_Included);

        var Propfield15= $('#Prop_Field_15').data("kendoEditor");
        Propfield15.value(CurrentItem.Operating_x0020_Expenses);

        var Propfield16= $('#Prop_Field_16').data("kendoEditor");
        Propfield16.value(CurrentItem.Tenant_x0020_Improvements_x0020_);

        var Propfield17= $('#Prop_Field_17').data("kendoEditor");
        Propfield17.value(CurrentItem.Renewal_x0020_Option_x0028_s_x00);

        var Propfield18= $('#Prop_Field_18');
        Propfield18.prop('checked',CurrentItem.Right_x0020_of_x0020_First_x0020);

        $('#Prop_Field_19').val(CurrentItem.Security_x0020_Deposit);

        var Propfield20 = $('#Prop_Field_20').data("kendoDatePicker");
        Propfield20.value(kendo.parseDate(CurrentItem.Early_x0020_Cancellation));
        Propfield20.trigger("change");

        sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
          $("#Prop_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
        });

    }

    function UpdateEquipData(CurrentItem:any)
    {
      $('#EquipAddFile').data('kendoButton').enable(true);
        $('#EquipType_1').data("kendoDropDownList").value(CurrentItem.RecordType);
        $('#Equip_Field_1').val(CurrentItem.Title);

        var Equipfield2= $('#Equip_Field_2').data("kendoEditor");
        Equipfield2.value(CurrentItem.Equipment_x0020_Description);

        $('#Equip_Field_3').val(CurrentItem.Leasing_x0020_Company);

        var Equipfield4 = $('#Equip_Field_4').data("kendoDatePicker");
        Equipfield4.value(kendo.parseDate(CurrentItem.Lease_x0020_Commencement));
        Equipfield4.trigger("change");

        var Equipfield5 = $('#Equip_Field_5').data("kendoDatePicker");
        Equipfield5.value(kendo.parseDate(CurrentItem.Lease_x0020_Expiration));
        Equipfield5.trigger("change");

        var Equipfield6= $('#Equip_Field_6');
        Equipfield6.val(CurrentItem.Minimum_x0020_Payment);

        var Equipfield7= $('#Equip_Field_7');
        Equipfield7.val(CurrentItem.Minimum_x0020_Term);

        var Equipfield8= $('#Equip_Field_8');
        Equipfield8.val(CurrentItem.Billing_x0020_Fequency);

        var Equipfield9 = $('#Equip_Field_9');
        Equipfield9.val(CurrentItem.Equipment_x0020_Office);

        var Equipfield10= $('#Equip_Field_10');
        Equipfield10.val(CurrentItem.Equipment_x0020_Location);

        var Equipfield11= $('#Equip_Field_11');
        Equipfield11.prop("checked",CurrentItem.Buy_x0020_Out_x0020_Option);

        sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
          $("#Equip_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
        });
        
    }

    function UpdateVehicleData(CurrentItem:any)
    {

        $('#VehicleAddFile').data('kendoButton').enable(true);
        $('#Vehicle_Field_1').val(CurrentItem.Title);

        var Vehiclefield2= $('#Vehicle_Field_2');
        Vehiclefield2.val(CurrentItem.Driver);

        $('#Vehicle_Field_3').val(CurrentItem.VIN);

        var Vehiclefield4= $('#Vehicle_Field_4');
        Vehiclefield4.val(CurrentItem.Project);

        var Vehiclefield5= $('#Vehicle_Field_5');
        Vehiclefield5.val(CurrentItem.CO_x002f_Phase_x002f_ORG);        

        var Vehiclefield6= $('#Vehicle_Field_6');
        Vehiclefield6.val(CurrentItem.Unit);

        var Vehiclefield7= $('#Vehicle_Field_7');
        Vehiclefield7.val(CurrentItem.Market_x0020_Segment);

        var Vehiclefield8= $('#Vehicle_Field_8');
        Vehiclefield8.val(CurrentItem.Vehicle_x0020_Office);

        var Vehiclefield9 = $('#Vehicle_Field_9');
        Vehiclefield9.val(CurrentItem.Leasing_x0020_Company);

        var Vehiclefield10 = $('#Vehicle_Field_10').data("kendoDatePicker");
        Vehiclefield10.value(kendo.parseDate(CurrentItem.Lease_x0020_Expiration));
        Vehiclefield10.trigger("change");

        var Vehiclefield11= $('#Vehicle_Field_11');
        Vehiclefield11.val(CurrentItem.Minimum_x0020_Term);

        var Vehiclefield12 = $('#Vehicle_Field_12');
        Vehiclefield12.val(CurrentItem.Billing_x0020_Fequency);

        var Vehiclefield13 = $('#Vehicle_Field_13');
        Vehiclefield13.val(CurrentItem.Minimum_x0020_Payment);

        var Vehiclefield14 = $('#Vehicle_Field_14');
        Vehiclefield14.val(CurrentItem.Year);

        var Vehiclefield15 = $('#Vehicle_Field_15');
        Vehiclefield15.val(CurrentItem.Make);

        var Vehiclefield16 = $('#Vehicle_Field_16');
        Vehiclefield16.val(CurrentItem.Model);
        
        var Vehiclefield17 = $('#Vehicle_Field_17');
        Vehiclefield17.val(CurrentItem.Plate_x0020__x0023_);

        var Vehiclefield18 = $('#Vehicle_Field_18');
        Vehiclefield18.val(CurrentItem.Lic_x0020_State);

        var Vehiclefield19 = $('#Vehicle_Field_19').data("kendoDatePicker");
        Vehiclefield19.value(kendo.parseDate(CurrentItem.Delivery_x0020_Date));
        Vehiclefield19.trigger("change");

        var Vehiclefield20 = $('#Vehicle_Field_20').data("kendoEditor");
        Vehiclefield20.value(CurrentItem.Mileage);

        var Vehiclefield21= $('#Vehicle_Field_21');
        Vehiclefield21.prop("checked",CurrentItem.Buy_x0020_Out_x0020_Option);

        sp.web.lists.getByTitle("LeaseManagement").items.getById(selectedlease.ID).attachmentFiles.select("FileName","ServerRelativeUrl").get().then(resault=>{
          $("#Vehicle_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:resault}));
        });
    }

  
  function ClearPropWindow()
    {
        var today = new Date();

        $('#Prop_Field_1').val('');

        var Propfield2= $('#Prop_Field_2').data("kendoEditor");
        Propfield2.value('');

        $('#Prop_Field_3').val('');

        var Propfield4 = $('#Prop_Field_4').data("kendoDatePicker");
        Propfield4.value(today);
        Propfield4.trigger("change");

        var Propfield5 = $('#Prop_Field_5').data("kendoDatePicker");
        Propfield5.value(today);
        Propfield5.trigger("change");

        var Propfield6= $('#Prop_Field_6').data("kendoEditor");
        Propfield6.value('');

        var Propfield7 = $('#Prop_Field_7');
        Propfield7.prop("checked",false);

        var Propfield8= $('#Prop_Field_8').data("kendoEditor");
        Propfield8.value('');

        var Propfield9= $('#Prop_Field_9');
        Propfield9.val('0');

        var Propfield10= $('#Prop_Field_10');
        Propfield10.val('0');

        var Propfield11= $('#Prop_Field_11');
        Propfield11.val('');

        var Propfield12 = $('#Prop_Field_12');
        Propfield12.prop("checked",false);

        var Propfield13 = $('#Prop_Field_13');
        Propfield13.prop("checked",false);

        var Propfield14 = $('#Prop_Field_14');
        Propfield14.prop("checked",false);

        var Propfield15= $('#Prop_Field_15').data("kendoEditor");
        Propfield15.value('');

        var Propfield16= $('#Prop_Field_16').data("kendoEditor");
        Propfield16.value('');

        var Propfield17= $('#Prop_Field_17').data("kendoEditor");
        Propfield17.value('');

        var Propfield18= $('#Prop_Field_18');
        Propfield18.prop('checked',false);

        var Propfield19= $('#Prop_Field_19');
        Propfield19.val('0');

        var Propfield20 = $('#Prop_Field_20').data("kendoDatePicker");
        Propfield20.value(today);
        Propfield20.trigger("change");

        var Propfield21= $('#Prop_Field_21');
        Propfield21.val('');

        $("#Prop_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:[]}));
          
        
    }

    function ClearEquipWindow()
    {
        var today = new Date();

        $('#Equip_Field_1').val('');

        var Propfield2= $('#Equip_Field_2').data("kendoEditor");
        Propfield2.value('');

        $('#Equip_Field_3').val('');

        var Propfield4 = $('#Equip_Field_4').data("kendoDatePicker");
        Propfield4.value(today);
        Propfield4.trigger("change");

        var Propfield5 = $('#Equip_Field_5').data("kendoDatePicker");
        Propfield5.value(today);
        Propfield5.trigger("change");

        var Propfield6= $('#Equip_Field_6');
        Propfield6.val('0');

        var Propfield7 = $('#Equip_Field_7');
        Propfield7.val('0');

        var Propfield8= $('#Equip_Field_8');
        Propfield8.val('0');

        var Propfield9= $('#Equip_Field_9');
        Propfield9.val('');

        var Propfield10= $('#Equip_Field_10');
        Propfield10.val('');

        var Propfield11= $('#Equip_Field_11');
        Propfield11.prop('checked',false);

        var Propfield12= $('#Equip_Field_12');
        Propfield12.val('');

        $("#Equip_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:[]}));

        
    }

    function ClearVehicleWindow()
    {
        var today = new Date();

        $('#Vehicle_Field_1').val('');

        var Propfield2= $('#Vehicle_Field_2');
        Propfield2.val('');

        $('#Vehicle_Field_3').val('');

        var Propfield4= $('#Vehicle_Field_4');
        Propfield4.val('');

        var Propfield5= $('#Vehicle_Field_5');
        Propfield5.val('');

        var Propfield6= $('#Vehicle_Field_6');
        Propfield6.val('');

        var Propfield7 = $('#Vehicle_Field_7');
        Propfield7.val('');

        var Propfield8= $('#Vehicle_Field_8');
        Propfield8.val('');

        var Propfield9= $('#Vehicle_Field_9');
        Propfield9.val('');

        var Propfield10 = $('#Vehicle_Field_10').data("kendoDatePicker");
        Propfield10.value(today);
        Propfield10.trigger("change");

        var Propfield11= $('#Vehicle_Field_11');
        Propfield11.val('0');

        var Propfield12= $('#Vehicle_Field_12');
        Propfield12.val('0');

        var Propfield13= $('#Vehicle_Field_13');
        Propfield13.val('0');

        var Propfield14= $('#Vehicle_Field_14');
        Propfield14.val('');

        var Propfield15= $('#Vehicle_Field_15');
        Propfield15.val('');

        var Propfield16= $('#Vehicle_Field_16');
        Propfield16.val('');

        var Propfield17= $('#Vehicle_Field_17');
        Propfield17.val('');

        var Propfield18= $('#Vehicle_Field_18');
        Propfield18.val('');

        var Propfield19 = $('#Vehicle_Field_19').data("kendoDatePicker");
        Propfield19.value(today);
        Propfield19.trigger("change");

        var Propfield20= $('#Vehicle_Field_20');
        Propfield18.val('');

        var Propfield21= $('#Vehicle_Field_21');
        Propfield11.prop('checked',false);

        var Propfield22= $('#Vehicle_Field_22');
        Propfield22.val('');

        $("#Vehicle_Attachments").data("kendoListBox").setDataSource(new kendo.data.DataSource({data:[]}));

        
    }

  }

  

  

  private _createComponentElement(tagName: string): HTMLElement {
    const componentElement: HTMLElement = document.createElement('div');
    componentElement.setAttribute('data-bind', `component: { name: "${tagName}", params: $data }`);
    return componentElement;
  }

  private _registerComponent(tagName: string): void {
    ko.components.register(
      tagName,
      {
        viewModel: WadeTrimLeaseManagerViewModel,
        template: require('./WadeTrimLeaseManager.template.html'),
        synchronous: false
      }
    );
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
