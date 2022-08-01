const bcrypt = require('bcrypt');
const { pool } = require('../assets/db');
const userModel = require('../models/user.model');
const postModel = require('../models/post.model');
const { response, errResponse } = require('../utilities/response');
const baseResponse = require('../utilities/baseResponseStatus');

// 사용자의 ID가 존재하는지 확인
const checkUserIdExists = async (userId) => {
    try {
        const connection = await pool.getConnection((connection) => connection);
        const checkedUser = await userModel.checkUserExistsByUserId(connection, userId);

        connection.release();
        
        // 사용자가 존재하지 않을 때
        if (checkedUser == 0){
            return false;
        }
        return true;
    } catch (e) {
        console.log(e);
        return errResponse(baseResponse.DB_ERROR);
    }
}

// 사용자의 비밀번호가 일치하는지 확인
const checkUserPassword = async (userId, userPassword) => {

    try {
        const connection = await pool.getConnection((connection) => connection);
        const checkedUserPassword = await userModel.checkUserPassword(connection, userId);

        connection.release();

        // DB 저장된 비밀번호와 사용자가 입력한 비밀번호가 일치하는지 확인
        const match = bcrypt.compareSync(userPassword, checkedUserPassword[0]["password"]);
        
        if (!match){
            return false;
        }
        return true;
    } catch (e) {
        console.log(e);
        return errResponse(baseResponse.DB_ERROR);
    }

}

// 회원정보 데이터베이스에 넣기
const postSignUp = async (phone, name, password, birth, id) => {
    try {
        // 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = await pool.getConnection(async (connection) => connection);
        
        const signUpResult = await userModel.insertUser(connection, phone, name, hashedPassword, birth, id);

        connection.release();

        return response(signUpResult);
    } catch (e){
        console.log(e);
        return errResponse(baseResponse.DB_ERROR);
    }
}

// 소셜 회원 검증
const checkSocialId = async (socialId) => {
    try {
        const connection = await pool.getConnection(async (connection) => connection);
        const checkedResult = await userModel.getSocialId(conn, socialId);

        connection.release();
        
        // 사용자가 존재하지 않을 때
        if (checkedResult == 0){
            return false;
        }
        return true;
    } catch (e){
        console.log(e);
        return errResponse(baseResponse.DB_ERROR);
    } 
}

// 카카오ID로 유저 식별자 가지고 오기
const retrieveUserIdxByKakaoId = async (socialId) => {
    try {
        const connection = await pool.getConnection(async (connection) => connection);

        const userIdxResult = await userModel.getUserIdxBySocialId(connection, socialId);

        connection.release();

        return userIdxResult;
    } catch (e){
        console.log(e);
        return errResponse(baseResponse.DB_ERROR);
    }
}

// ID로 유저 식별자 가지고 오기
const retrieveUserIdxById = async (userId) =>{
    try {
        const connection = await pool.getConnection(async (connection) => connection);
        const userIdx = await userModel.getUserIdxByUserId(connection, userId);

        connection.release();

        return userIdx;
    } catch (e){
        console.log(e);
        return errResponse(baseResponse.DB_ERROR);
    }
}

// 사용자 본인 프로필 정보 가지고 오기
const getUserInfo = async (userIdx, page) => {
    try {
        const connection = await pool.getConnection(async (connection) => connection);
        const userProfileResult = await userModel.getUserProfile(connection, userIdx);

        const offset = (page-1)*9;
        
        const userPostResult = await postModel.selectUserPosts(connection, userIdx, offset);

        connection.release();

        const userResult = { userProfileResult, userPostResult };

        return userResult;
    } catch (e){
        console.log(e);
        return errResponse(baseResponse.DB_ERROR);
    }
}

// 사용자 핸드폰번호로 비밀번호 업데이트하기
const patchPassword = async (phone, password) => {
    const connection = await pool.getConnection(async(connection) => connection);
    try {
        await connection.beginTransaction();

        const hashedPassword = await bcrypt.hash(password, 10);
        const userPhoneCheckResult = await userModel.getUserIdxByPhone(connection, phone);

        // 전화번호에 해당하는 userIdx 확인
        if (!userPhoneCheckResult){
            await connection.commit();

            return errResponse(baseResponse.USER_PHONENUMBER_NOT_MATCH);
        }
        const userIdx = userPhoneCheckResult[0].userIdx;

        const passwordParams = [ hashedPassword, userIdx ];
        await userModel.updatePassword(connection, passwordParams);

        await connection.commit();

        return response(baseResponse.SUCCESS);
    } catch (e) {
        console.log(e);
        await connection.rollback();

        return errResponse(baseResponse.DB_ERROR);
    } finally {
        connection.release();
    }
}

// 사용자 프로필 업데이트하기
const changeUserProfile = async (profileImgUrl, name, id, website, introduce, userIdx) => {
    try {
        const connection = await pool.getConnection(async(connection) => connection);
        const updatedProfileResult = await userModel.updateUserProfile(connection, profileImgUrl, name, id, website, introduce, userIdx);
        
        connection.release();
        return response(baseResponse.SUCCESS);
    } catch (e){
        console.log(e);

        return errResponse(baseResponse.DB_ERROR);
    }
}

// 이름, 아이디 변경하기
const changeNameAndId = async (name, id, userIdx) => {
    try {
        const connection = await pool.getConnection(async(connection) => connection);
        const updatedProfileResult = await userModel.updateNameAndId(connection, name, id, userIdx);
        
        connection.release();
        return response(baseResponse.SUCCESS);
    } catch (e){
        console.log(e);

        return errResponse(baseResponse.DB_ERROR);
    }
}

// 계정 공개여부 변경하기
const changePrivate = async (userIdx, privateCode) => {
    try {
        const connection = await pool.getConnection(async(connection) => connection);
        const updatedPrivateResult = await userModel.updatePrivate(connection, userIdx, privateCode);
        
        connection.release();
        return response(baseResponse.SUCCESS);
    } catch (e){
        console.log(e);

        return errResponse(baseResponse.DB_ERROR);
    }
}

// 현 팔로우 정보 확인
const checkollowStatus = async (userIdx, followUserId, followCode) =>{
    try {
        const connection = await pool.getConnection(async(connection) => connection);
        const checkFollowingResult = await userModel.checkFollow(connection, userIdx, followUserId, followCode);

        connection.release();
        return checkFollowingResult;
    } catch (e){
        console.log(e);

        return errResponse(baseResponse.DB_ERROR);
    }
}

// 팔로우하기
const followUser = async (userIdx, followUserId) => {
    const connection = await pool.getConnection(async(connection) => connection);
    try {
        await connection.beginTransaction();
        
        const userPrivateInfo = await userModel.checkUserPrivate(connection, followUserId);
        const followHistoryInfo = await userModel.checkFollow(connection, userIdx, followUserId, 1); // 이전 팔로우 기록 확인

        // 상대방이 비공개 계정일 때
        if (userPrivateInfo[0].private == 1){


            // 이전에 팔로우 했다가 지운 상태인지 확인
            followHistoryInfo[0].success == 1 ?
                //  있다면 status를 요청 대기중으로 업데이트
                ( await userModel.updateFollow(connection, userIdx, followUserId, 2)) :
                 // 없다면 새로운 칼럼으로 요청 대기중을 집어넣는다
                ( await userModel.insertFollow(connection, userIdx, followUserId, 2));

            await connection.commit();

            return response(baseResponse.FOLLOW_REQUEST_SUCCESS);
        }
        
        // 상대방이 공개 계정일 때
        // 이전에 팔로우 했다가 지운 상태인지 확인
        followHistoryInfo[0].success == 1 ?
            // 있다면 기존 칼럼 status를 업데이트
            ( await userModel.updateFollow(connection, userIdx, followUserId, 0)) :
            // 없다면 새로운 칼럼을 삽입
            ( await userModel.insertFollow(connection, userIdx, followUserId, 0));

        await connection.commit();
        
        return response(baseResponse.FOLLOW_SUCCESS);
    } catch (e) {
        console.log(e);
        await connection.rollback();

        return errResponse(baseResponse.DB_ERROR);
    } finally {
        connection.release();
    }
}

// 팔로우 취소하기
const unfollowUser = async (userIdx, unfollowUserId) => {
    try {
        const connection = await pool.getConnection(async(connection) => connection);
        const unfollowUserResult = await userModel.updateUnfollow(connection, userIdx, unfollowUserId);

        connection.release();
        return response(baseResponse.SUCCESS);
    } catch (e) {
        console.log(e);

        return errResponse(baseResponse.DB_ERROR);
    }
}

module.exports = {
    checkUserIdExists,
    checkUserPassword,
    postSignUp,
    checkSocialId,
    retrieveUserIdxByKakaoId,
    retrieveUserIdxById,
    getUserInfo,
    patchPassword,
    changeUserProfile,
    changeNameAndId,
    changePrivate,
    checkollowStatus,
    followUser,
    unfollowUser
};