<template>
  <div class="home">
    <el-container>
      <el-container>
       <!--       个人信息展示-->
        <el-aside class="el-aside01" width="3vw">
            <el-avatar size="medium" :src="userInfo.avatarUrl" :title="userInfo.username" style="cursor: pointer"></el-avatar>
            <div class="me-menu-logout">
                <i class="el-icon-switch-button" title="注销" @click="logout"></i>
            </div>
            <div class="me-menu-friends">
                <el-badge :value="newFriendsNum" class="item">
                    <i class="el-icon-s-custom" title="新朋友" @click="FriendsUserListDialogShow"></i>
                </el-badge>
            </div>
        </el-aside>
       <!--  聊天对象展示-->
        <el-aside class="el-aside02" width="10vw">
            <el-row>
                <el-col :span="20">
                    <el-input
                            width="70px"
                            maxlength="10"
                            size="small"
                            placeholder="搜索"
                            @focus="searchDialogShow"
                            prefix-icon="el-icon-search">
                    </el-input>
                </el-col>
                <el-col :span="4">
                    <div style="text-align: center;margin-top: 9px">
                        <i class="el-icon-circle-plus-outline"></i>
                    </div>
                </el-col>
            </el-row>
            <div class="chatObject"  v-for="(item,index) in chatList" :id="'obj'+item.userId+''+item.type+'obj'" :style="chatObjectCSS['obj'+item.userId+''+item.type+'obj']" :key="index" @click="chooseChat(item)">
               <div >
                   <el-avatar shape="square" size="small" :src="item.avatarUrl"></el-avatar>
               </div>
                <div  class="chatObjectNameLabel" >
                    <label >{{item.chatName}}</label>
                </div>
            </div>
        </el-aside>
        <el-container v-if="!isInit">
        <!-- 聊天记录展示-->
          <el-header height="50px">{{chatTarget.chatName}}  {{chatTarget.type === 2?'群聊':'用户'}}</el-header>
          <el-main >
              <div class="chatContentDiv"  v-for="item in chatHistoryList" :key="item.id" :style="{justifyContent: item.username === myUsername? 'flex-end':'flex-start'}">
                  <div  class="chatObjectAvatar" v-if="item.username !== myUsername">
                      <el-avatar :size="30" :src="item.avatarUrl"></el-avatar>
                  </div>
                  <div  class="chatNameAndMessage" >
                      <span class="chatNameAndMessage-name" >{{item.nickname}} : {{item.createTime}}</span>
                      <span class="chatNameAndMessage-message" >{{item.message}}</span>
                      <el-image
                              v-if="item.imageUrl !== '' && item.imageUrl !== null"
                              style="width: 100px; height: 100px"
                              :src="item.imageUrl"
                              fit="contain"></el-image>
                  </div>
                  <div  class="chatObjectAvatar"  v-if="item.username === myUsername">
                      <el-avatar :size="30" :src="item.avatarUrl"></el-avatar>
                  </div>
              </div>
          </el-main>
          <el-footer height="200px" >
              <div class="eventForChat">
                  <el-upload
                          class="upload-demo"
                          ref="upload"
                          :limit="1"
                          action="self"
                          list-type="picture"
                          :http-request="selfUploadRequest"
                          :auto-upload="true">
                      <i class="el-icon-picture-outline" title="图片" @click="uploadPicture"></i>
                  </el-upload>
                  <i class="el-icon-video-camera" title="视频通话" @click="videoWithPartner"></i>
                  <i class="el-icon-upload" title="发送文件"></i>
                  <i class="el-icon-phone-outline" title="语音电话"></i>
              </div>
              <div class="chatMessageSend">
                  <el-input  type="input" v-model="messageForNew"   @input="changeValue"  @keyup.enter.native="sendMessageToTarget"></el-input>
              </div>
          </el-footer>
        </el-container>
      </el-container>
    </el-container>
      <!-- 视频通话框1V1-->
      <el-dialog title="视频通话中"
                 :close-on-click-modal="false"
                 :close-on-press-escape="false"
                 :show-close="false"
                 :visible.sync="dialogSingle1V1Visible" >
          <Single1V1VideoFrame :socket="socket" v-if="dialogSingle1V1Visible" :userInfo="userInfo" :chatTarget="chatTarget"   ref="dialogSingle1V1VisibleRef"></Single1V1VideoFrame>
          <span slot="footer" class="dialog-footer">
<!--              <el-button type="primary" @click="closeNativeVideo">关闭本地画面</el-button>-->
                <el-button type="primary" @click="hangUp">挂断</el-button>
        </span>
      </el-dialog>
      <!-- 视频通话框多对多-->
      <el-dialog title="群通话中"
                 :close-on-click-modal="false"
                 :close-on-press-escape="false"
                 :show-close="false"
                 :visible.sync="dialogManyToManyVisible" >
          <ManyToManyVideoFrame :socket="socket" v-if="dialogManyToManyVisible" :userInfo="userInfo" :isCreateOffer="isCreateOffer" :groupUserList="groupUserList" :chatTarget="chatTarget"   ref="dialogManyToManyVisibleRef"></ManyToManyVideoFrame>
          <span slot="footer" class="dialog-footer">
                <el-button type="primary" @click="hangUp02()">离开</el-button>
        </span>
      </el-dialog>
    <!--搜索结果框-->
      <el-dialog title="搜索结果只匹配精确用户，请输入完整用户名"
                 :close-on-click-modal="false"
                 :close-on-press-escape="false"
                 :show-close="true"
                 :visible.sync="dialogUserList" >
          <UserList v-if="dialogUserList"   ref="dialogUserListRef"></UserList>
      </el-dialog>
      <!--待处理好友列表-->
      <el-dialog title="新朋友"
                 :close-on-click-modal="false"
                 :close-on-press-escape="false"
                 :show-close="true"
                 @close="closeFriendsUserListDialog"
                 :visible.sync="dialogFriendsUserList" >
          <FriendsUserList v-if="dialogFriendsUserList" :socket="socket"  ref="dialogFriendsUserListRef"></FriendsUserList>
      </el-dialog>

  </div>

</template>

<script>
import io from 'socket.io-client';
import Single1V1VideoFrame from "../components/Single1V1VideoFrame";
import UserList from "../components/UserList";
import FriendsUserList from "../components/FriendsUserList";
import ManyToManyVideoFrame from "../components/ManyToManyVideoFrame";
import {loadReceivingFriends, loadUserFriendsPage,loadMessages,loadGroupUserInfo} from '../api/commonApi'
import {socketBaseUrl} from "../util/http";

export default {
  name: 'Home',
  components: {
      Single1V1VideoFrame,
      UserList,
      FriendsUserList,
      ManyToManyVideoFrame
  },
  data(){
      return{
          isInit:true,
          socket:'',
          search:'',//搜索框
          chatList:[],//群聊列表
          chatTarget:{},//聊天对象
          myUsername:JSON.parse(window.sessionStorage.getItem("userInfo")).username,
          chatHistoryList:[],//历史聊天记录
          messageForNew:'',//新消息发送
          imageUrl:'',//图片url
          dialogSingle1V1Visible:false,//1v1视频聊天对话框
          dialogManyToManyVisible:false,//群视频聊天对话框
          dialogUserList:false,//用户搜索结果
          dialogFriendsUserList:false,//待处理好友申请
          userInfo: JSON.parse(window.sessionStorage.getItem("userInfo")),
          chatObjectCSS:[],//动态css样式集合（每个聊天目标）
          newFriendsNum:0,//好友申请数量
          groupUserList:[],//群用户列表
          isCreateOffer:false,//子组件是否创建offer判断
      }
  },
  created() {
      this.init()
      // //用户列表mock
      // let obj01 = {id:1,avatarUrl:"https://cdn.jsdelivr.net/gh/wangsrGit119/wangsr-image-bucket/img-article/photo-1596492784531-6e6eb5ea9993.jpg",chatName:'我的客服'}
      // let obj02 = {id:2,avatarUrl:"https://cdn.jsdelivr.net/gh/wangsrGit119/wangsr-image-bucket/img-article/photo-1596492784531-6e6eb5ea9993.jpg",chatName:'开发小分队开发小分队开发小分队开发小分队'}
      // let obj03 = {id:3,avatarUrl:"https://cdn.jsdelivr.net/gh/wangsrGit119/wangsr-image-bucket/img-article/photo-1596492784531-6e6eb5ea9993.jpg",chatName:'社会主义接班人'}
      // this.chatList.push(obj01)
      // this.chatList.push(obj02)
      // this.chatList.push(obj03)
      //  //聊天记录mock
      // let aa = {username:'苏克',imageUrl:'',createTime:'2020-08-15 12:43:48',avatarUrl:'https://static.easyicon.net/preview/128/1285983.gif',message:'哈喽 大家好'}
      // let bb = {username:'suc',imageUrl:'',createTime:'2020-08-15 15:23:04',avatarUrl:'https://static.easyicon.net/preview/127/1276547.gif',message:'你好 你好'}
      // let cc = {username:'fight',imageUrl:'',createTime:'2020-08-15 16:35:33',avatarUrl:'https://static.easyicon.net/preview/127/1273254.gif',message:'哈哈哈哈  划水'}
      // let bb2 = {username:'suc',imageUrl:'',createTime:'2020-08-15 17:43:52',avatarUrl:'https://static.easyicon.net/preview/127/1276547.gif',message:'emmmm'}
      // this.chatHistoryList.push(aa)
      // this.chatHistoryList.push(bb)
      // this.chatHistoryList.push(cc)
      // this.chatHistoryList.push(bb2)
    },
  mounted() {


  },
  methods:{
      //初始化基础信息
      async init(){
          const that = this;
          that.isInit = true;
          //初始化socket
          if(this.userInfo){
              this.initSocket(this.userInfo.userId)
          }
          //加载通话列表
          that.loadCommunicationUser();
          //加载未读好友申请
          that.loadNewFriends()
          //监听消息
          that.onListener()


     },
      //加载通讯录列表
      loadCommunicationUser(){
          const that = this;
          let params = {userId:this.userInfo.userId};
          loadUserFriendsPage(params).then(res=>{
              if(res.code===200){
                  that.chatList = [];
                  that.chatList = res.data;
              }else {
                  that.$message.error("通讯录加载失败，服务异常")
              }
          });
      },
      //查询好友申请实时展示具体申请人数
      loadNewFriends(){
          const that = this;
          console.log("update message list")
          loadReceivingFriends({userId:that.userInfo.userId}).then(res=>{
              if(res.code === 200){
                  that.newFriendsNum = res.data.length;
              }
          })
      },

      //初始化socket链接
      async initSocket(username) {
          let params = {
              query: 'uid=' + username
          };
          this.socket = io.connect(socketBaseUrl, params);
      },
      //选择聊天对象
      chooseChat(item){
          const that = this;
          console.log(item)
          this.isInit = false;
          that.chatTarget = item;
          //加载聊天记录
          that.loadMessages(item);
          //加载群成员信息
          if(item.type === 2){
            that.loadGroupUserInfo(item.userId);
          }
      },
      //加载群成员信息
      loadGroupUserInfo(groupId){
          const that = this;
          loadGroupUserInfo({groupId:groupId}).then(res=>{
              if(res.code===200){
                  that.groupUserList = [];
                  that.groupUserList = res.data;
              }
          }).catch(error=>{
              console.log("loadGroupUserInfo error ",error)
          })
      },
      //加载历史聊天记录
      loadMessages(row){
          const that = this;
          let params = {userId:that.userInfo.userId,targetId:row.userId,type:row.type}
          loadMessages(params).then(res=>{
              console.log(res)
              if(res.code===200){
                  that.chatHistoryList = [];
                  that.chatHistoryList = res.data;
              }
          })
      },
      //上传图片
      uploadPicture(){
          this.$refs.upload.submit();
      },
      //发送文件到服务器
      selfUploadRequest(params){
          console.log(params)
          let url = window.URL.createObjectURL(params.file)
          this.imageUrl = url
      },
      //发送消息
      sendMessageToTarget(){
          if(!this.messageForNew){
              if(this.imageUrl){
                  this.$message.info("图片发送中")
              }else {
                  this.$message.error("消息不能为空")
                  return;
              }
          }
          let message = {username:this.userInfo.username,nickname:this.userInfo.nickname,imageUrl:'',createTime:this.formatDate(new Date()),avatarUrl:this.userInfo.avatarUrl,message:this.messageForNew}
          message.imageUrl = this.imageUrl
          this.chatHistoryList.push(message)
          let params = {userId:this.userInfo.userId,targetId:this.chatTarget.userId,targetName:this.chatTarget.chatName,targetType:this.chatTarget.type,data:message}
          this.socket.emit('sendMessage',params)
          this.messageForNew = ''
          this.imageUrl = ''
      },
      formatDate(inputTime) {
          var date = new Date(inputTime);
          var y = date.getFullYear();
          var m = date.getMonth() + 1;
          m = m < 10 ? ('0' + m) : m;
          var d = date.getDate();
          d = d < 10 ? ('0' + d) : d;
          var h = date.getHours();
          h = h < 10 ? ('0' + h) : h;
          var minute = date.getMinutes();
          var second = date.getSeconds();
          minute = minute < 10 ? ('0' + minute) : minute;
          second = second < 10 ? ('0' + second) : second;
          return y + '-' + m + '-' + d+' '+h+':'+minute+':'+second;
      },
      //监听正在输入
      changeValue(){
          console.log('正在输入')
      },
      //视频聊天
      videoWithPartner(){
          //单人
          if(this.chatTarget.type===1){
              this.dialogSingle1V1Visible = true;
              let data = {type:1,info:"呼叫",userId:this.userInfo.userId,username:this.userInfo.username}
              let params = {userId:this.userInfo.userId,targetId:this.chatTarget.userId,targetName:this.chatTarget.chatName,targetType:this.chatTarget.type,data:data}
              this.socket.emit("1V1CommunicateVideo",params)
              //群聊
          }else {
              this.dialogManyToManyVisible = true;
              let data = {type:1,info:"呼叫",userId:this.userInfo.userId,username:this.userInfo.username,groupInfo:this.chatTarget}
              this.groupUserList.forEach(ele=>{
                  if(this.userInfo.username !== ele.username){
                      let params = {userId:this.userInfo.userId,targetId:ele.userId,targetName:ele.username,targetType:2,data:data}
                      this.socket.emit("ManyToManyCommunicateVideo",params)
                  }
              })

          }

      },
      closeNativeVideo(){
          this.$refs['dialogSingle1V1VisibleRef'].closeNativeVideo()
      },
      //1v1
      hangUp(){
          let data = {type:3,info:"挂断",username:this.userInfo.username}
          let params = {userId:this.userInfo.userId,targetId:this.chatTarget.userId,targetName:this.chatTarget.chatName,targetType:this.chatTarget.type,data:data}
          this.socket.emit("1V1CommunicateVideo",params)
          this.dialogSingle1V1Visible = false;
          this.$refs['dialogSingle1V1VisibleRef'].hangUp()
          this.$router.go(0)
      },
      //manyToMany
      hangUp02(){
          let data = {type:4,info:"离开房间",username:this.userInfo.username};
          this.groupUserList.forEach(ele => {
              if(this.userInfo.username !== ele.username){
                  let params = {userId:this.userInfo.userId,targetId:ele.userId,targetName:ele.username,targetType:this.chatTarget.type,data:data};
                  this.socket.emit("onLeftRoom",params);
              }
          });
          this.$refs['dialogManyToManyVisibleRef'].hangUp();
          this.dialogSingle1V1Visible = false;
          this.$router.go(0)
      },
      //注销登录
      logout(){
          const that = this;
          window.sessionStorage.removeItem("sucToken")
          window.sessionStorage.removeItem("userInfo")
          const loading = this.$loading({
              lock: true,
              text: '注销中请稍后',
              spinner: 'el-icon-loading',
              background: 'rgba(0, 0, 0, 0.7)'
          });
          setTimeout(() => {
              loading.close();
              that.$router.push({path:'/login'})
              that.$router.go(0)
          }, 2000);
      },
      //监听消息
      onListener(){
          const that = this;
          that.socket.on('connect',function () {
              that.$notify({
                  title:'提示',
                  message:'服务链接',
                  type:'success'
              })
          })
          that.socket.on('disconnect', function () {
              that.$notify({
                  title:'提示',
                  message:'服务断线',
                  type:'warn'
              })
          });
          that.socket.on("sendMessage", function (e) {
              console.log("sendMessage",e)
              //1.点对点
              if(e.targetType===1){
                  that.$notify({
                      title:'提示',
                      message:'收到'+e.data.username+'的消息',
                      type:'info'
                  });
                  //2.群聊
              }else {
                  that.$notify({
                      title:'提示',
                      message:'收到群聊 '+e.targetName+'的消息',
                      type:'info'
                  });
              }
              that.chatHistoryList.push(e.data)
              if(e.userId && e.targetType){
                  let tempRef  = 'obj'+ e.userId+''+e.targetType+'obj';
                  this.chatObjectCSS = null;
                  that.changeCss(tempRef)
              }

          });
          that.socket.on("newFriendsNotify",function (e) {
              console.log("newFriendsNotify",e)
              that.$notify({
                  title:'提示',
                  message: e.message,
                  type:'info'
              });
              setTimeout(function () {
                  that.loadNewFriends();
                  that.loadCommunicationUser()
              },2000)
          });
          that.socket.on("1V1CommunicateVideo",function (e) {
              console.log("1V1CommunicateVideo",e)
              //呼叫
              if(e.data.type===1){
                  that.$confirm('用户'+e.data.username+' 是申请视频通话，是否接听?', '提示', {
                      closeOnClickModal:false,
                      closeOnPressEscape:false,
                      confirmButtonText: '确定',
                      cancelButtonText: '取消',
                      type: 'warning'
                  }).then(() => {
                      let data = {type:2,info:"接通",username:that.userInfo.username}
                      let params = {userId:that.userInfo.userId,targetId:e.data.userId,targetName:e.data.username,targetType:e.targetType,data:data}
                      that.socket.emit("1V1CommunicateVideo",params)
                      that.dialogSingle1V1Visible = true;
                  }).catch(() => {
                      let data = {type:3,info:"拒接",username:that.userInfo.username}
                      let params = {userId:that.userInfo.userId,targetId:e.data.userId,targetName:e.data.username,targetType:e.targetType,data:data}
                      that.socket.emit("1V1CommunicateVideo",params)
                  });
                  //用户接通通知
              }else if(e.data.type===2){
                  that.$message({
                      type: 'info',
                      message: e.data.username+'用户'+e.data.info
                  });
                  console.log(that.$refs)
                  //接通后创建offer
                  setTimeout(function () {
                      that.$refs['dialogSingle1V1VisibleRef'].onCreateOffer();
                  },2000)
                  //拒接和挂断通知
              }else if(e.data.type===3){
                  that.$message({
                      type: 'error',
                      message: e.data.username+'用户'+e.data.info
                  });
                  that.dialogSingle1V1Visible = false;
                  that.$router.go(0)
              }
          });
          that.socket.on("notOnline",function (e) {
              that.$message.error(e)
          });
          //群聊监听
          that.socket.on("ManyToManyCommunicateVideo",function (e) {
              //呼叫
              if(e.data.type===1){
                  that.$confirm('用户'+e.data.username+' 邀请你加入群聊，是否加入?', '提示', {
                      closeOnClickModal:false,
                      closeOnPressEscape:false,
                      confirmButtonText: '确定',
                      cancelButtonText: '取消',
                      type: 'warning'
                  }).then(() => {
                      let id = 'obj'+e.data.groupInfo.userId+""+e.data.groupInfo.type+'obj';
                      console.log("id",id);
                      document.getElementById(id.toString()).click();
                      let data = {type:2,info:"加入群聊",username:that.userInfo.username};
                      const loading = that.$loading({
                          lock: true,
                          text: '正在加入群聊请稍后',
                          spinner: 'el-icon-loading',
                          background: 'rgba(0, 0, 0, 0.7)'
                      });
                      setTimeout(function () {
                          console.log("that.groupUserList ->",that.groupUserList)
                          if(that.groupUserList.length===0){
                              that.$message.error("群用户列表加载失败")
                              return;
                          }
                        that.groupUserList.forEach(ele =>{
                          if(that.userInfo.username !== ele.username){
                            let params = {userId:that.userInfo.userId,targetId:ele.userId,targetName:ele.username,targetType:e.targetType,data:data}
                            that.socket.emit("onJoinRoom",params);
                          }
                        });
                      },2000);
                      setTimeout(function () {
                          loading.close();
                          //接通后创建offer
                          that.isCreateOffer = true;
                          that.dialogManyToManyVisible = true;

                      },2000)
                  }).catch(() => {
                      let data = {type:3,info:"拒接",username:that.userInfo.username}
                      let params = {userId:that.userInfo.userId,targetId:e.data.userId,targetName:e.data.username,targetType:e.targetType,data:data}
                      that.socket.emit("ManyToManyCommunicateVideo",params)
                  });
              }
          })
      },
      changeCss(params){
          this.chatObjectCSS[params]={
              'animation':"msg-me 2s infinite",
              '-webkit-animation':"msg-me 5s",
          };
          this.$forceUpdate()
          console.log(this.chatObjectCSS)
      },
      //前往搜索结果页面
      searchDialogShow(){
          const that = this;
          that.dialogUserList = true;
      },
      //待处理好友申请框
      FriendsUserListDialogShow(){
          const that = this;
          that.dialogFriendsUserList = true;
      },
      //关闭好友申请处理框
      closeFriendsUserListDialog(){
          const that = this;
          that.dialogFriendsUserList = false;
          that.loadCommunicationUser();
      },

    },
    watch:{

    }
}
</script>
<style>
    .home{
        padding: 50px;
        background-image: url("https://cdn.jsdelivr.net/gh/wangsrGit119/wangsr-image-bucket/img-article/bg-index.jpg") ;
    }

  .el-header {
      text-align: left;
      border-bottom: 1px gainsboro solid;
      line-height: 60px;
      opacity:0.5
  }

  /**个人信息**/
  .el-aside01 {
    background-color: #161c23;
      padding-top: 20px;
      height: 750px;
  }
    .el-aside01 .me-menu-logout {
        margin-top:30px;
        font-size: 30px;
        cursor:pointer;
        font-weight: bold;
    }
    .el-aside01 .me-menu-friends {
        margin-top:30px;
        font-size: 30px;
        cursor:pointer;
        font-weight: bold;
    }
  /**群聊信息列表**/
  .el-aside02 {
      padding-top: 10px;
      background-color: #d7d4dc;
      opacity:0.7;
  }

@keyframes msg-me
{
    from {background: #fff6ef;}
    to {background: #ff4fa5;}
}
@-webkit-keyframes msg-me /* Safari 与 Chrome */
{
    from {background: #fff6ef;}
    to {background: #ff4fa5;}
}
 /**群聊对象整体设置**/
  .el-aside02 .chatObject{
      height: 35px;
      /*border: 1px silver solid;*/
      border-bottom: 1px gray solid;
      padding: 5px;
      transition-duration: 0.5s;
      display: flex;
      /*animation:msg-me  2s infinite;*/
      /*-webkit-animation:msg-me 2s infinite;*/
  }
  .el-aside02 .chatObject:hover{
      background: rgba(42, 54, 71, 0.16);
  }
  /**群聊对象名称字体标签设置**/
  .el-aside02 .chatObject .chatObjectNameLabel{
      margin-top: 4px;
      margin-left: 4px;
      font-size: 13px;
      font-family: Arial,sans-serif;
      overflow: hidden;/**超出部分隐藏**/
      text-overflow:ellipsis; /**超出部分添加省略号**/
      white-space: nowrap; /**不换行**/
  }
  /**聊天框内容设置**/
  .chatContentDiv{
      display: flex;
      justify-content: flex-start;
      clear: both;
  }

  .el-main {
      border-left: 1px darkgray solid;
      background-color: white;
      height: 500px;
      width: 80vw;
      line-height: 35px;
      opacity:0.7;
  }
  /**聊天内容用户显示**/
  .el-main .chatContentDiv .chatNameAndMessage{
    /*border: 1px red solid;*/
      text-align: left;
      /*width: 40vw;*/

  }
  .chatContentDiv .chatNameAndMessage .chatNameAndMessage-name{
      display: block;
      /*height: 10px;*/
      font-size: 14px ;
  }
  .chatContentDiv .chatNameAndMessage .chatNameAndMessage-message{
      display: block;
      font-size: 18px;
  }
  .el-footer {
      background: white;
      border-top: 1px gray solid;

  }
   /**发送消息框**/
 .chatMessageSend  .el-input__inner{
     background: none;
     outline: none;
     border: none;
     font-size: 25px;
 }
    /**消息框工具栏目**/
    .eventForChat{
        text-align: left;
        display: flex;
    }
  .eventForChat i{
      margin-left: 9px;
  }
    .eventForChat i:hover{
        cursor:pointer;
    }
    .eventForChat i:hover:before{
        /*content:attr(data-tooltip);*/
    }

</style>
