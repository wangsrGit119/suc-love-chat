<template>
    <div class="Single1V1Video">
        <video id="local" controls="controls"> </video>
        <video id="remote" controls="controls"> </video>
    </div>
</template>


<script>
export default {
    name: "Single1V1VideoFrame",
    data(){
        return{
            localStream:'',//本地视频流
            localPeer:'',


        }
    },
    props:{
        myUsername:String,
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
            this.nativeMedia()

        },
        //创建本地流全局放置
        async createNative() {
            const that = this;
            that.localStream = await this.createMedia()
        },
        // 本地摄像头打开
        nativeMedia(){
            const that = this;
            let video = document.querySelector('#local');
            // 旧的浏览器可能没有srcObject
            if ("srcObject" in video) {
                video.srcObject = that.localStream;
            } else {
                video.src = window.URL.createObjectURL(that.localStream);
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
            try {
                streamTep = await navigator.mediaDevices.getUserMedia({audio: true, video: true})
                console.log("media stream create =>",streamTep)
            }catch (e) {
                that.$message.warning("获取媒体设备异常")
            }
            return streamTep;
        },
        //关闭本地画面
        closeNativeVideo(){
            let video = document.querySelector('#local');
            video.srcObject = null;
        },
        //挂断
        hangUp(){
            this.closeNativeVideo();
            if(this.localPeer){
                this.localPeer.close();
            }
        }

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
        width: 400px;
        height: 350px;
    }

</style>
