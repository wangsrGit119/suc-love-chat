<template>
    <div>
        <div class="ManyToManyVideo" id="ManyToManyVideo">
            <video id="local" muted controls="controls"> </video>
        </div>
    </div>
</template>


<script>

    var PeerConnection = window.RTCPeerConnection ||
        window.mozRTCPeerConnection ||
        window.webkitRTCPeerConnection;
    export default {
    name: "ManyToManyVideoFrame",
    props:['socket','userInfo','chatTarget','groupUserList','isCreateOffer'],
    data(){
        return{
            localStream:'',//本地视频流
            userPeerList:[],//用户peer列表
            offerOption: {
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 1
            },
            iceServers:{
                iceServers: [
                    { url: "stun:stun.l.google.com:19302"}, // 谷歌的公共服务
                    {
                        url: 'turn:numb.viagenie.ca',
                        credential: 'muazkh',
                        username: 'webrtc@live.com'
                    },
                ],
                sdpSemantics:'plan-b'
            },
        }
    },
    created() {
        console.log('重新初始化')
        this.init()
    },
    mounted() {

    },
    methods:{
        async init() {
            const that = this;
            await that.createNative();
            await that.nativeMedia();
            await that.initPeerList();
            await that.onListener();
            if(that.isCreateOffer){
               await that.onCreateOffer();
            }
        },
        async initPeerList(){
            const that = this;
            that.userPeerList = [];
            let localUsername = that.userInfo.username;
            console.log("groupUserList->",that.groupUserList);
            that.groupUserList.forEach(ele=>{
                if(that.userInfo.username !== ele.username){
                    let peerName = localUsername+"-"+ele.username;
                    that.initPeer(peerName,ele);
                }
            });
            console.log(that.userPeerList)
        },
        //创建本地流全局放置
        async createNative() {
            const that = this;
            that.localStream = await this.createMedia()
        },
        // 本地摄像头打开
        nativeMedia(){
            const that = this;
            console.log("open local video",that.localStream)
            let video = document.querySelector('#local');
            // 旧的浏览器可能没有srcObject
            if ("srcObject" in video) {
                video.srcObject = that.localStream;
            } else {
                video.src = window.URL.createObjectURL(that.localStream);
                video.volume = 0
            }
            // eslint-disable-next-line no-unused-vars
            video.onloadedmetadata = function(e) {
                video.play();
            };
        },
        // 创建媒体流
        async createMedia() {
            const that = this;
            let streamTep = null;
            console.log("start prepare localStream origin")
            if( !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia ){
                that.$message.error("设备不支持")
                console.log('getUserMedia is not support!')
            }
                await navigator.mediaDevices.getUserMedia({audio: true, video: true})
                    .then(function (mediaStream) {
                    console.log("mediaStream",mediaStream)
                    streamTep = mediaStream;
                }).catch(error=>{
                    console.log("获取媒体设备异常",error)
                    that.$message.warning("获取媒体设备异常")
                })
            return streamTep;
        },
        //追加视频
        createEleVideo(stream,id){
            console.log("createEleVideo",stream);
            let ele = document.getElementById("ManyToManyVideo");
            let old = document.getElementById(id);

            if(old){
                old.srcObject = stream;
            }else{
                let video = document.createElement('video');
                video.controls = true;
                video.autoplay = true;
                video.width = 230;
                video.height = 200;
                video.volume = 0.1;
                video.id = id;
                video.srcObject = stream;
                ele.append(video);
            }
        },
        //关闭本地画面
        closeNativeVideo(){
            let video = document.querySelector('#local');
            video.srcObject = null;
        },
        //挂断
        hangUp(){
            this.closeNativeVideo();
        },
        //移除视频
        removeEleVideo(eleId){
            document.getElementById("ManyToManyVideo").removeChild(document.getElementById(eleId));
        },
        //初始化 PeerConnection
        initPeer(peerName,e){
            const that = this;
            console.log(peerName+"初始化PeerConnection")
            let peer_tep = new PeerConnection(this.iceServers);
            peer_tep.addStream(that.localStream);
            peer_tep.onicecandidate = function(event) {
                console.log("监听ice候选信息",event.candidate)
                if (event.candidate) {
                    let candidate_data = {userId:that.userInfo.userId,username:that.userInfo.username,candidate:event.candidate}
                    let params = {userId:that.userInfo.userId,targetId:e.userId,targetName:e.username,targetType:2,data:candidate_data}
                    that.socket.emit("candidate",params)
                }else{
                    console.log("ICE收集已经完成")
                }
            };
            peer_tep.onaddstream = (event) => {
                console.log("监听到视频加入 加入用户 ",e.username)
                that.createEleVideo(event.stream,e.username)
            };
            that.userPeerList[peerName] = peer_tep;
        },
        //监听服务器信息
        onListener(){
            const that = this;
            that.socket.on("candidate",function (e) {
                console.log("服务器发送 candidate",e)
                that.onIceCandidate(e)
            })
            that.socket.on("offer",function (e) {
                console.log("服务器发送 offer",e)
                that.onOffer(e)
            })
            that.socket.on("answer",function (e) {
                console.log("服务器发送 answer",e)
                that.onAnswer(e)
            })
            that.socket.on("onJoinRoom",function (e) {
                console.log("服务器发送 onJoinRoom",e)
                that.$message.info("用户"+e.data.username+""+e.data.info)
                that.initPeerList();
            })
            that.socket.on("onLeftRoom",function (e) {
                console.log("服务器发送 onLeftRoom",e)
                that.$message.warning("用户"+e.data.username+"离开房间");
                that.removeEleVideo(e.data.username)
            })
        },
        //监听 Ice 候选
        async onIceCandidate(data) {
            const that = this;
            let peerName = that.userInfo.username+"-"+data.data.username;
            await that.userPeerList[peerName].addIceCandidate(data.data.candidate)
        },
        //监听远端offer
        async onOffer(data) {
            const that = this;
            let peerName = that.userInfo.username+"-"+data.data.username;
            await that.userPeerList[peerName].setRemoteDescription(data.data.offer)
            // 接收端创建 answer
            let answer = await that.userPeerList[peerName].createAnswer();
            // 接收端设置本地 answer 描述
            await that.userPeerList[peerName].setLocalDescription(answer);
            //发送到呼叫端 answer
            let answer_data = {userId:that.userInfo.userId,username:that.userInfo.username,answer:answer}
            let params = {userId:that.userInfo.userId,targetId:data.data.userId,targetName:data.data.username,targetType:data.targetType,data:answer_data}
            that.socket.emit("answer",params)
        },
        //监听远程响应
        async onAnswer(data) {
            const that = this;
            let peerName = that.userInfo.username+"-"+data.data.username;
            // 发送端 设置远程 answer 描述
            await that.userPeerList[peerName].setRemoteDescription(data.data.answer);
        },
        //创建连接
        async onCreateOffer() {
            const that = this;
            console.log("开始创建offer")
            for(const ele of that.groupUserList){
                let peerName = that.userInfo.username+"-"+ele.username;
                if(that.userInfo.username !== ele.username){
                    //创建offer
                    let offer = await that.userPeerList[peerName].createOffer(that.offerOption);
                    //设置本地描述
                    await that.userPeerList[peerName].setLocalDescription(offer)
                    //远程发送到服务器 并转发到其他的客户端
                    let data = {offer:offer,userId:that.userInfo.userId,username:that.userInfo.username,info:"发送offer"}
                    let params = {userId:that.userInfo.userId,targetId:ele.userId,targetName:ele.username,targetType:2,data:data}
                    that.socket.emit("offer",params)
                }
            }
        },

    },
    watch:{

    },
    destroyed() {
        console.log("销毁子组件")
    }
}
</script>

<style scoped>

    .ManyToManyVideo{
        display: flow;
        width: 700px;
        background-color: black;
    }
    .ManyToManyVideo video{
        object-fit:fill;
        width: 230px;
        height: 200px;
    }

</style>
