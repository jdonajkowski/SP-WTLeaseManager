import * as ko from 'knockout';
import * as $ from 'jquery';
import '@progress/kendo-ui';
import 'kendo-ui-core';
import styles from './WadeTrimLeaseManager.module.scss';
import { IWadeTrimLeaseManagerWebPartProps } from './WadeTrimLeaseManagerWebPart';
import { SPComponentLoader } from '@microsoft/sp-loader';


export interface IWadeTrimLeaseManagerBindingContext extends IWadeTrimLeaseManagerWebPartProps {
  shouter: KnockoutSubscribable<{}>;
}

export default class WadeTrimLeaseManagerViewModel {
  public description: KnockoutObservable<string> = ko.observable('');
  public items: KnockoutObservableArray<any> = ko.observableArray();

  public wadeTrimLeaseManagerClass: string = styles.wadeTrimLeaseManager;
  public containerClass: string = styles.container;
  public rowClass: string = styles.row;
  public columnClass: string = styles.column;
  public titleClass: string = styles.title;
  public subTitleClass: string = styles.subTitle;
  public descriptionClass: string = styles.description;
  public buttonClass: string = styles.button;
  public labelClass: string = styles.label;

  constructor(bindings: IWadeTrimLeaseManagerBindingContext) {
    this.description(bindings.description);
    

    // When web part description is updated, change this view model's description.
    bindings.shouter.subscribe((value: string) => {
      this.description(value);
    }, this, 'description');
    bindings.shouter.subscribe((value:any[])=>{
      this.items(value);},this,"items");

    SPComponentLoader.loadCss('https://kendo.cdn.telerik.com/2018.2.620/styles/kendo.common.min.css');
    //SPComponentLoader.loadCss('https://kendo.cdn.telerik.com/2018.2.620/styles/kendo.metro.min.css');
    //SPComponentLoader.loadCss('https://kendo.cdn.telerik.com/2018.2.620/styles/kendo.metro.mobile.min.css');
    SPComponentLoader.loadCss('https://wadetrimgroup.sharepoint.com/sites/Administration/SiteAssets/Wt-Kendo-Green.css');
    SPComponentLoader.loadCss('https://www.w3schools.com/w3css/4/w3.css');

  }
}
