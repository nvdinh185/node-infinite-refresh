import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { StorageServiceModule } from 'angular-webstorage-service';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

import { MyApp } from './app.component';
import { TimeAgoPipe} from 'time-ago-pipe';

import { HomeNewsPage } from '../pages/home-news/home-news';
import { LinkifyPipe } from '../pipes/linkify';
import { NewlinePipe } from '../pipes/new-line';
import { ApiAuthService } from '../services/apiAuthService';
import { ApiStorageService } from '../services/apiStorageService';
import { RequestInterceptor } from '../interceptors/requestInterceptor';
import { ApiContactService } from '../services/apiContactService';
import { ApiImageService } from '../services/apiImageService';
import { Contacts } from '@ionic-native/contacts';

@NgModule({
  declarations: [
    MyApp,
    TimeAgoPipe,
    LinkifyPipe,
    NewlinePipe,
    HomeNewsPage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    StorageServiceModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomeNewsPage,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    InAppBrowser,
    ApiAuthService,
    ApiStorageService,
    RequestInterceptor,
    ApiContactService,
    ApiImageService,
    Contacts
  ]
})
export class AppModule {}
