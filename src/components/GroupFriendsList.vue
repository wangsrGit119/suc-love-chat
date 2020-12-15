<template>
    <div>
        <el-table
                :data="friendsList"
                style="width: 100%">
            <el-table-column
                    label="昵称"
                    width="580">
                <template slot-scope="scope">
                    <span style="margin-left: 10px">{{ scope.row.chatName }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作">
                <template slot-scope="scope">
                    <el-button
                            size="mini"
                            type="danger"
                            @click="handleAccept(scope.$index, scope.row)">邀请</el-button> 
                </template>
            </el-table-column>
        </el-table>
        <div class = "footer">
            <el-button @click="close()">取 消</el-button>
            <el-button type="primary" @click="creatGroup()">创建群聊</el-button>
        </div>
       
    </div>
        
</template>

<script>
import {loadUserFriendsPage,createGroup} from '../api/commonApi'
    export default {
        name: "GroupFriendsList",
        props:['socket'],
        data() {
            return {
                friendsList: [],
                userInfo:JSON.parse(window.sessionStorage.getItem("userInfo")),
                invitedUserIds:[],
            }
        },
        created() {
            this.loadFriends()
        },
        mounted() {
        },
        methods: {
            creatGroup(){
                const that = this;
                that.invitedUserIds.push(that.userInfo.userId)
                let createGroupParams = {userId:that.userInfo.userId,invitedUserIds:that.invitedUserIds}
                createGroup(createGroupParams).then(res=>{
                    if(res.code===200){
                        that.$message.info("群聊创建成功")
                        this.$emit('friendsDialogHide');
                    }else {
                        that.$message.error(res.message)
                    }
                })
            },
            handleAccept(index, row) {
                const that = this;
                that.invitedUserIds.push(row.userId)
            },
            close(){
                this.$emit('friendsDialogHide');
                
            },
            loadFriends(){
                const that = this;
                loadUserFriendsPage({userId:that.userInfo.userId}).then(res=>{
                    if(res.code === 200){
                        that.friendsList = res.data;
                    }
                })
            }

        },
        watch:{

        },
    }
</script>

<style scoped>
.footer{
    margin-top: 20px;
}

</style>
