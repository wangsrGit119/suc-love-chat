<template>

    <div class="UserLoginForm">
        <vue-particles
                color="#409EFF"
                :particleOpacity="0.7"
                :particlesNumber="100"
                shapeType="circle"
                :particleSize="6"
                linesColor="#409EFF"
                :linesWidth="2"
                :lineLinked="true"
                :lineOpacity="0.4"
                :linesDistance="150"
                :moveSpeed="3"
                :hoverEffect="true"
                hoverMode="grab"
                :clickEffect="true"
                clickMode="push"
                class="particles-suc"
        ></vue-particles>
       <div class="top" :style="{'top':topForLoginForm+'px','left':leftForLoginForm+'px'}">
           <el-form :model="ruleForm" status-icon :rules="rules" ref="ruleForm" label-width="100px" class="demo-ruleForm">
               <el-form-item label="用户名" prop="username">
                   <el-input type="input" v-model="ruleForm.username" autocomplete="off"></el-input>
               </el-form-item>
               <el-form-item label="密码" prop="password">
                   <el-input type="password" v-model="ruleForm.password" autocomplete="off"></el-input>
               </el-form-item>
               <el-form-item>
                   <el-button type="primary" @click="onLogin('ruleForm')">提交</el-button>
                   <el-button @click="resetForm('ruleForm')">重置</el-button>
               </el-form-item>
           </el-form>
       </div>
    </div>
</template>

<script>

import {login} from '@/api/commonApi'

export default {
    name: "Login",
    data(){
        var checkUsername = (rule, value, callback) => {
            if (!value) {
                return callback(new Error('用户名不能为空'));
            }
        };
        var validatePass = (rule, value, callback) => {
            if (value === '') {
                callback(new Error('请输入密码'));
            } else {
                callback();
            }
        };
        return{
            ruleForm: {
                username: '',
                password:'',
            },
            topForLoginForm: 300,
            leftForLoginForm: 200,
            rules: {
                username: [
                    { validator: checkUsername, trigger: 'blur' }
                ],
                password: [
                    { validator: validatePass, trigger: 'blur' }
                ]
            }
        };

    },
    created() {

    },
    mounted() {
        console.log(window.innerWidth,window.innerHeight)
        let bodyHeight = window.innerHeight;
        let bodyWidth = window.innerWidth;
        this.topForLoginForm  = bodyHeight/2-(230/2);
        this.leftForLoginForm = bodyWidth/2-(320/2);

    },
    methods:{

        async onLogin(formName) {
            const that = this;
            console.log(formName)
            if(this.ruleForm.username==='' || this.ruleForm.password===''){
                this.$message.error("请输入用户名或密码")
                return ;
            }
            let params = {username:this.ruleForm.username,password:this.ruleForm.password};
            login(params).then(res=>{
                console.log('res',res)
                if(res.code===200){
                    window.sessionStorage.setItem("sucToken",res.data.token)
                    window.sessionStorage.setItem("userInfo",JSON.stringify(res.data))
                    this.$store.dispatch("commitUserInfo", res.data)
                    const loading = this.$loading({
                        lock: true,
                        text: '登录中请稍后',
                        spinner: 'el-icon-loading',
                        background: 'rgba(0, 0, 0, 0.7)'
                    });
                    setTimeout(() => {
                        loading.close();
                        that.$router.push({path:'/'})
                    }, 2000);

                }else {
                    that.$message.error(res.message)
                }
            })
        },
        resetForm(formName) {
            this.$refs[formName].resetFields();
        },



    },
    watch:{

    },

}
</script>

<style scoped>
.UserLoginForm {
    position: fixed;
    width:100%;
    height:100vh;
    top: 0;
    left: 0;
    z-index:-1;

}
.UserLoginForm .top{
    position: fixed;
    width: 320px;
    height: 230px;
    padding-top: 20px;
    padding-right: 70px;
    border: 1px red solid;
    /*margin: 0 auto;*/
    border-radius: 25px;
    background-image: url("https://cdn.jsdelivr.net/gh/wangsrGit119/wangsr-image-bucket/img-article/photo-1485796826113-174aa68fd81b.jpg");
    box-shadow:25px 22px 16px #0a0c11;
}
.particles-suc{
    /*background-color: antiquewhite;*/
    height: 100vh;
    background-image: linear-gradient(to right, #3fc7ff, #ffcef6);

}

</style>
