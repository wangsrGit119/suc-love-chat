<template>
    <el-table
            :data="tableData"
            style="width: 100%">
        <el-table-column
                label="用户名"
                prop="username">
        </el-table-column>
        <el-table-column
                label="昵称"
                prop="nickname">
        </el-table-column>
        <el-table-column
                align="right">
            <template slot="header" slot-scope="scope" >
                <el-input
                        v-model="usernameForSearch"
                        size="mini"
                        @keyup.enter.native="searchUserInfo(scope)"
                        placeholder="输入关键字搜索"/>
            </template>
            <template slot-scope="scope">
                <el-tag v-if="scope.row.userId===userInfo.userId" disable-transitions>当前登录用户</el-tag>
                <el-tag v-if="scope.row.userId!==userInfo.userId && scope.row.friendsOrNot" disable-transitions>好友</el-tag>
                <el-tag v-if="scope.row.userId!==userInfo.userId && !scope.row.friendsOrNot" disable-transitions>非好友</el-tag>

                <el-button v-if="!scope.row.friendsOrNot && scope.row.userId!==userInfo.userId"
                        size="mini"
                        type="success"
                        @click="handleAdd(scope.$index, scope.row)">添加好友</el-button>
                <el-button
                        v-if="scope.row.friendsOrNot && scope.row.userId!==userInfo.userId"
                        size="mini"
                        type="danger"
                        @click="handleDelete(scope.$index, scope.row)">删除</el-button>
            </template>
        </el-table-column>
    </el-table>
</template>

<script>
import {searchUser,applyAddFriends} from '../api/commonApi'
    export default {

        name: "UserList",
        created() {
        },
        data() {
            return {
                tableData: [],
                usernameForSearch: '',
                userInfo:JSON.parse(window.sessionStorage.getItem("userInfo")),
            }
        },
        methods: {
            handleAdd(index, row) {
                const that = this;
                console.log(index, row);
                let params = {userId:that.userInfo.userId,targetId:row.userId,noteName:''}
                applyAddFriends(params).then(res=>{
                    console.log(res)
                    if(res.code===200){
                        that.$message.info(res.message)
                    }else {
                        that.$message.error(res.message)
                    }
                }).catch(error=>{
                    console.log(error)
                    that.$message.error("添加好友异常")
                })
            },
            handleDelete(index, row) {
                console.log(index, row);
            },
            searchUserInfo(scope){
                const that = this;
                console.log(scope);
                that.tableData = []
                let params = {userId:that.userInfo.userId,username:that.usernameForSearch}
                searchUser(params).then(res=>{
                    if(res.code===200 && res.data){
                        that.tableData.push(res.data)
                    }
                }).catch(error=>{
                    console.log("搜索异常",error)
                    that.$message.error("搜索异常")
                })
            }
        },
        watch:{

        }
    }
</script>

<style scoped>

</style>
