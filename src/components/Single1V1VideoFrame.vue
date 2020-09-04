<template>
    <div class="Single1V1Video">
        <video id="local" muted controls="controls"> </video>
        <video id="remote" controls="controls"> </video>
        <div v-if="isCreateOfferOwner">
            <el-button type="primary" @click="shareScreenStream" round v-if="isLocalStream">分享屏幕</el-button>
            <el-button type="primary" @click="changeLocalStream" round v-if="!isLocalStream">切回主画面</el-button>
        </div>
    </div>
</template>


<script>

    var PeerConnection = window.RTCPeerConnection ||
        window.mozRTCPeerConnection ||
        window.webkitRTCPeerConnection;
    export default {
    name: "Single1V1VideoFrame",
    props:['socket','userInfo','chatTarget'],
    data(){
        return{
            localStream:'',//本地视频流
            remoteStream:null,
            isLocalStream:true,
            isCreateOfferOwner:false,
            offerOption: {
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 1
            },
            remoteAccount:'',
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
            pc:'',

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
            await this.createNative();
            await this.nativeMedia();
            await this.initPeer();
            await this.onListener();
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
        //分享屏幕
        shareScreenStream(){
            const that = this;
            const displayMediaStreamConstraints = {
                video: {
                    cursor: "always"
                },
                audio: true
            };
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia(displayMediaStreamConstraints).then(function (mediaStream) {
                    console.log("mediaStream", mediaStream)
                    that.shareStream = mediaStream;
                    that.pc.removeStream(that.localStream)
                    that.pc.addStream(mediaStream)
                    that.onCreateOffer();
                    let video = document.querySelector('#local');
                    // 旧的浏览器可能没有srcObject
                    if ("srcObject" in video) {
                        video.srcObject = that.shareStream;
                    } else {
                        video.src = window.URL.createObjectURL(that.shareStream);
                        video.volume = 0
                    }
                    // eslint-disable-next-line no-unused-vars
                    video.onloadedmetadata = function(e) {
                        video.play();
                    };
                    that.isLocalStream = false;
                }).catch(error=>{
                    console.log("error",error)
                    that.$message.error("媒体设备获取异常，请检查设备或浏览器是否支持")
                });
            } else {
                console.log("navigator.mediaDevices.getDisplayMedia  false");
                that.$message.error("浏览器不不支持")
                // navigator.getDisplayMedia(displayMediaStreamConstraints).then(success).catch(error);
            }
        },
        //切回本地摄像头
        changeLocalStream(){
            const that = this;
            that.pc.removeStream(that.shareStream)
            that.pc.addStream(that.localStream)
            that.onCreateOffer();
            that.nativeMedia();
            that.isLocalStream = true;
        },
        //关闭本地画面
        closeNativeVideo(){
            let video = document.querySelector('#local');
            video.srcObject = null;
        },
        //挂断
        hangUp(){
            this.closeNativeVideo();
            if(this.pc){
                this.pc.close();
            }
        },
        //初始化 PeerConnection
        initPeer(){
            const that = this;
            that.pc = new PeerConnection(that.iceServers);
            that.pc.addStream(that.localStream);
            that.pc.onicecandidate = function(event) {
                console.log("监听ice候选信息",event.candidate)
                if (event.candidate) {
                    let candidate_data = {userId:that.userInfo.userId,username:that.userInfo.username,candidate:event.candidate}
                    let params = {userId:that.userInfo.userId,targetId:that.chatTarget.userId,targetName:that.chatTarget.chatName,targetType:that.chatTarget.type,data:candidate_data}
                    that.socket.emit("candidate",params)
                }else{
                    console.log("ICE收集已经完成")
                }
            };
            that.pc.onaddstream = (event) => {
                console.log("监听到视频加入 onaddstream",event)
                let video = document.querySelector('#remote');
                video.srcObject = event.stream;
                // eslint-disable-next-line no-unused-vars
                video.onloadedmetadata = function(e) {
                    video.play();
                };
            };
        },
        //监听服务器信息
        onListener(){
            const that = this;
            that.socket.on("candidate",function (e) {
                console.log("服务器发送 candidate",e)
                that.onIceCandidate(e)
            })
            that.socket.on("join",function (e) {
                console.log("服务器发送 join",e)
                that.onJoin(e)
            })
            that.socket.on("offer",function (e) {
                console.log("服务器发送 offer",e)
                that.onOffer(e)
            })
            that.socket.on("answer",function (e) {
                console.log("服务器发送 answer",e)
                that.onAnswer(e)
            })
        },
        //监听 Ice 候选
        async onIceCandidate(data) {
            const that = this;
            await that.pc.addIceCandidate(data.data.candidate)
        },
        //监听远端offer
        async onOffer(data) {
            const that = this;
            await that.pc.setRemoteDescription(data.data.offer)
            // 接收端创建 answer
            let answer = await that.pc.createAnswer();
            // 接收端设置本地 answer 描述
            await that.pc.setLocalDescription(answer);
            //发送到呼叫端 answer
            let answer_data = {userId:that.userInfo.userId,username:that.userInfo.username,answer:answer}
            let params = {userId:that.userInfo.userId,targetId:data.data.userId,targetName:data.data.username,targetType:data.targetType,data:answer_data}
            that.socket.emit("answer",params)
        },
        //监听远程响应
        async onAnswer(data) {
            const that = this;
            // 发送端 设置远程 answer 描述
            await that.pc.setRemoteDescription(data.data.answer);
        },
        //创建连接
        async onCreateOffer() {
            const that = this;
            that.isCreateOfferOwner = true;
            //创建offer
            let offer = await that.pc.createOffer(this.offerOption);
            console.log("呼叫端 创建 offer",offer)
            //设置本地描述
            await that.pc.setLocalDescription(offer)
            //远程发送到服务器
            let data = {offer:offer,userId:that.userInfo.userId,username:that.userInfo.username,info:"发送offer"}
            let params = {userId:that.userInfo.userId,targetId:that.chatTarget.userId,targetName:that.chatTarget.chatName,targetType:that.chatTarget.type,data:data}
            that.socket.emit("offer",params)
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
    .Single1V1Video{
        display: flow;
        background-color: black;
    }
    .Single1V1Video video{
        object-fit:fill;
        width: 320px;
        height: 200px;
    }

</style>
