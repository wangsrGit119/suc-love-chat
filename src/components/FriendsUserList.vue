<template>
    <el-table
            :data="tableDataFriendsUserList"
            style="width: 100%">
        <el-table-column
                label="昵称"
                width="180">
            <template slot-scope="scope">
                <i class="el-icon-s-check"></i>
                <span style="margin-left: 10px">{{ scope.row.nickname }}</span>
            </template>
        </el-table-column>
        <el-table-column
                label="用户名"
                width="180">
            <template slot-scope="scope">
                <el-popover trigger="hover" placement="top">
                    <p>对方用户名: {{ scope.row.username }}</p>
                    <p>联系方式: {{ scope.row.email }}</p>
                    <div slot="reference" class="name-wrapper">
                        <el-tag size="medium">{{ scope.row.username }}</el-tag>
                    </div>
                </el-popover>
            </template>
        </el-table-column>
        <el-table-column label="操作">
            <template slot-scope="scope">
                <el-button
                        size="mini"
                        type="danger"
                        @click="handleAccept(scope.$index, scope.row)">同意</el-button>
            </template>
        </el-table-column>
    </el-table>
</template>

<script>
import {loadReceivingFriends,acceptFriendsApply} from '../api/commonApi'
    export default {
        name: "FriendsUserList",
        props:['socket'],
        data() {
            return {
                tableDataFriendsUserList: [],
                usernameForSearch: '',
                userInfo:JSON.parse(window.sessionStorage.getItem("userInfo")),
            }
        },
        created() {
            this.loadNewFriends()
        },
        mounted() {
        },
        methods: {
            handleAccept(index, row) {
                const that = this;
                console.log(index, row);
                let params = {userId:that.userInfo.userId,targetId:row.userId,noteName:''}
                acceptFriendsApply(params).then(res=>{
                    if(res.code===200){
                        that.$message.info("已同意")
                        that.socket.emit("newFriendsNotify",{targetId:row.userId,message:that.userInfo.username+' 已同意你的好友申请'})
                        that.loadNewFriends()
                    }else {
                        that.$message.error(res.message)
                    }
                })
            },
            loadNewFriends(){
                const that = this;
                loadReceivingFriends({userId:that.userInfo.userId}).then(res=>{
                    if(res.code === 200){
                        that.tableDataFriendsUserList = res.data;
                    }
                })
            },

        },
        watch:{

        },
    }
</script>

<style scoped>

</style>
