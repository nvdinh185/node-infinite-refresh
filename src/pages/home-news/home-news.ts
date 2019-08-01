import { Component } from '@angular/core';
import { Events, ModalController } from 'ionic-angular';
import { ApiAuthService } from '../../services/apiAuthService';
import { ApiContactService } from '../../services/apiContactService';

@Component({
  selector: 'page-home-news',
  templateUrl: 'home-news.html'
})
export class HomeNewsPage {

  server = "http://localhost:9238/site-manager/news"
  userInfo: any;
  curPageIndex = 0;
  lastPageIndex = 0;
  maxOnePage = 2;
  contacts = {}
  isShow = false;

  constructor(private events: Events
    , public modalCtrl: ModalController
    , private auth: ApiAuthService
    , private apiContact: ApiContactService
  ) { }

  ngOnInit() {
    setTimeout(() => {
      console.log(this.dynamicCards.items)
    }, 2000);
    this.refreshNews();
  }

  dynamicCards = {
    title: ""
    , buttons: [
      { color: "primary", icon: "photos", next: "ADD" }
    ]
    , items: []
  }

  async refreshNews() {
    //chay ham nay de KHOI TAO CAC USER PUBLIC
    await this.apiContact.getPublicUsers(true);
    //lay cac danh ba public
    this.contacts = this.apiContact.getUniqueContacts();
    this.getHomeNews(true);
  }

  getHomeNews(reNews?: boolean) {
    // console.log("456", this.contacts)
    this.dynamicCards.title = "Đây là trang tin của " + (this.userInfo ? this.userInfo.username : "Public")
    if (reNews) {
      this.lastPageIndex = this.curPageIndex > 0 ? this.curPageIndex : this.lastPageIndex;
      this.curPageIndex = 0;
    } else {
    }
    this.getJsonPostNews()
      .then(data => {
        if (reNews) {
          console.log("new: ", data)
          let isHaveNew = false;
          data.reverse().forEach(el => {
            let index = this.dynamicCards.items
              .findIndex(x => x.group_id === el.group_id);
            if (index < 0) {
              this.dynamicCards.items.unshift(el);
              isHaveNew = true;
            }
          })
          if (!isHaveNew && this.lastPageIndex > 0) this.curPageIndex = this.lastPageIndex
          //if (isHaveNew && this.lastPageIndex > 0) this.curPageIndex = this.lastPageIndex--
        } else {
          console.log("data: ", data)
          data.forEach(el => {
            let index = this.dynamicCards.items
              .findIndex(x => x.group_id === el.group_id);
            if (index < 0) {
              this.dynamicCards.items.push(el);
            }
          })
        }
        console.log("cur", this.curPageIndex)
        console.log("last", this.lastPageIndex)
        console.log("length", this.dynamicCards.items.length)
      })
      .catch(err => console.log(err))
  }

  getJsonPostNews() {
    let linkFile = this.server + "/get-file/"
    let offset = this.curPageIndex * this.maxOnePage;
    let limit = this.maxOnePage;
    let follows = [];
    for (let key in this.contacts) {
      follows.push(key);
    }

    let json_data = {
      limit: limit,
      offset: offset,
      follows: follows
    }
    //console.log(offset)
    //console.log("json_data", json_data)
    return this.auth.postDynamicForm(this.server + "/get-news", json_data, true)
      .then(data => {
        console.log("789", data)
        let items = [];
        data.forEach(el => {
          let medias = [];
          if (el.medias) {
            el.medias.forEach(e => {
              if (e.url.includes("upload_files")) {
                e.image = linkFile + e.url;
              } else {
                e.image = e.url;
              }
              medias.push(e);
            })
          }

          el.medias = medias;
          el.actions = {
            like: { name: "LIKE", color: "primary", icon: "thumbs-up", next: "LIKE" }
            , comment: { name: "COMMENT", color: "primary", icon: "chatbubbles", next: "COMMENT" }
            , share: { name: "SHARE", color: "primary", icon: "share-alt", next: "SHARE" }
          }
          el.short_detail = {
            p: el.title
            , note: el.time
            , action: { color: "primary", icon: "more", next: "MORE" }
          }
          items.push(el);
        });
        if (items.length > 0) this.curPageIndex++;
        return items;
      })
      .catch(err => { return [] })
  }

  doInfinite(ev) {
    this.getHomeNews();
    setTimeout(() => {
      ev.complete();
    }, 500);
  }

  doRefresh(ev) {
    this.getHomeNews(true);
    setTimeout(() => {
      ev.complete();
    }, 500);
  }
}