import axios from "axios"
import store from "../store"
import router from "../router"
import { Message } from "element-ui"

export const baseurl = process.env.NODE_ENV === "production" ? "/suc-web/" : "https://webrtc.qdhuazhiyao.cn/suc-web"
export const socketBaseUrl = process.env.NODE_ENV === "production" ? "/" : "wss://webrtc.qdhuazhiyao.cn/"

axios.defaults.withCredentials = true
// 创建axios实例
const service = axios.create({
    xsrfHeaderName: "Authorization",
    baseURL: baseurl, // api的base_url
    timeout: 60000*4 // 请求超时时间
})
// let token  =  store.state.userInfo.token;
// request拦截器
service.interceptors.request.use(
    config => {
        console.log("store.state.userInfo =>",store.state.userInfo)
        // if(token){
        //     console.log(token)
        //     config.headers["Authorization"] = token;
        // }
        return config
    },
    error => {
        alert(error)
        Promise.reject(error)
    }
)
// respone拦截器
service.interceptors.response.use(
    response => {
        // console.log(response)
        if(response.data.code === 10010){
            Message.error("登录过期，请重新登录")
            window.sessionStorage.removeItem("sucToken")
            window.sessionStorage.removeItem("userInfo")
            setTimeout(function () {
                router.push("/login")
                router.go(0)
            },2000)
        }
        return response.data
    },
    error => {
        console.log("err" + error) // for debug
        return Promise.reject(error)
    }
)

export default service
