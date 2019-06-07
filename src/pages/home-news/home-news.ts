import { Component } from '@angular/core';
import { Events, ModalController } from 'ionic-angular';
import { PostNewsPage } from '../post-news/post-news';
import { ApiAuthService } from '../../services/apiAuthService';
import { DynamicCardSocialPage } from '../dynamic-card-social/dynamic-card-social';
import { ApiContactService } from '../../services/apiContactService';

@Component({
  selector: 'page-home-news',
  templateUrl: 'home-news.html'
})
export class HomeNewsPage {

  //server = ApiStorageService.newsServer;
  server = "http://localhost:9238/site-manager/news"
  userInfo: any;
  curPageIndex = 0;
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
    this.events.subscribe('event-main-login-checked'
      , (data => {
        this.userInfo = data.user;
        this.contacts = this.apiContact.getUniqueContacts();
        //console.log("this.userInfo: ", this.userInfo)
        if (this.userInfo) {
          if (!this.contacts[this.userInfo.username]) {
            Object.defineProperty(this.contacts, this.userInfo.username, {
              value: {
                fullname: this.userInfo.data.fullname,
                nickname: this.userInfo.data.nickname,
                image: this.userInfo.data.image ? this.userInfo.data.image : undefined,
                avatar: this.userInfo.data.avatar ? this.userInfo.data.avatar : this.userInfo.data.image,
                relationship: ['private']
              },
              writable: true, enumerable: true, configurable: true
            });
          } else {
            if (this.userInfo.data.image) {
              this.contacts[this.userInfo.username].image = this.userInfo.data.image;
              this.contacts[this.userInfo.username].avatar = this.userInfo.data.avatar ? this.userInfo.data.avatar : this.userInfo.data.image;
            }
          }
        }
        this.getHomeNews(true);
      })
    )
    this.events.subscribe('postok', () => {
      this.getHomeNews(true);
    });
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
    //neu chua dang nhap thi lay cac tin cua user public
    if (!this.userInfo) {
      //console.log("this.contacts", this.contacts)
      this.getHomeNews(true);
    }
  }

  getHomeNews(reNews?: boolean) {
    // console.log("456", this.contacts)
    this.dynamicCards.title = "Đây là trang tin của " + (this.userInfo ? this.userInfo.username : "Public")
    if (reNews) {
      this.curPageIndex = 0;
      this.dynamicCards.items = []
    } else {
    }
    this.getJsonPostNews()
      .then(data => {
        if (reNews) {
          console.log("new: ", data)
          data.reverse().forEach((el, idx) => {
            let index = this.dynamicCards.items
              .findIndex(x => x.group_id === el.group_id);
            if (index < 0) {
              this.dynamicCards.items.unshift(el);
            }
          })
        } else {
          console.log("data: ", data)
          data.forEach((el, idx) => {
            let index = this.dynamicCards.items
              .findIndex(x => x.group_id === el.group_id);
            if (index < 0) {
              this.dynamicCards.items.push(el);
            }
          })
        }
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
        //console.log("789", data)
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

  onClickHeader(btn) {
    if (btn.next === 'ADD') {
      let modal = this.modalCtrl.create(PostNewsPage);
      modal.present();
    }
  }

  onClickMedia(number, it) {
    let dynamicCardsOrigin: any = {
      title: it.user
      , buttons: [
        { color: "danger", icon: "close", next: "CLOSE" }
      ]
      , items: [
        {
          short_detail: {
            avatar: this.userInfo ? this.userInfo.data.image : ""
            , h1: this.userInfo ? this.userInfo.data.fullname : ""
            , p: it.content
            , note: it.time
            , action: { color: "primary", icon: "more", next: "MORE" }
          }
          , content: {
            title: it.title
            , paragraphs: [
              {
                //h2: "Chốn yên bình"
                //, p: "Là nơi bình yên nhất. Bạn có thể dạo bước trên con đường rợp bóng mát thanh bình đến lạ"
                medias: it.medias
              }
            ]
            , note: "Nguyễn Văn Định 2019"
          }
          , actions: it.actions
        }
      ]
    };
    this.openModal(DynamicCardSocialPage, { form: dynamicCardsOrigin })
  }

  openModal(form, data?: any) {
    let modal = this.modalCtrl.create(form, data);
    modal.present();
  }
}