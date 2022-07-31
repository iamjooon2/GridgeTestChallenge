const postService = require('../services/post.service');

const baseResponse = require('../utilities/baseResponseStatus');
const {errResponse, response} = require('../utilities/response');


// 게시글 등록
const postPost = async (req, res) => {

    const userIdxFromToken = req.verifiedToken.idx;

    const { userIdx, postImgUrls, content} = req.body;

    // Authentication
    if ( userIdxFromToken[0].userIdx != userIdx){
        return res.send(errResponse(baseResponse.USER_ID_NOT_MATCH));
    }

    // validation
    if (!userIdx) {
        return res.send(errResponse(baseResponse.USER_USERIDX_EMPTY));
    } else  if (userIdx <= 0) {
        return res.send(errResponse(baseResponse.USER_USERIDX_LENGTH));
    } 

    if (postImgUrls.length <= 0) {
        return res.send(errResponse(baseResponse.POST_POSTIMGURLS_EMPTY));
    }

    if (!content){
        return res.send(errResponse(baseResponse.POST_CONTENT_EMPTY));
    } else if (content.length > 1000) {
        return res.send(errResponse(baseResponse.POST_CONTENT_LENGTH));
    }

    const createdPostResult = await postService.createPost(
        userIdx,
        postImgUrls,
        content
    );

    return res.send(response(baseResponse.SUCCESS));
}

// 게시글 수정
const patchPost = async (req, res) => {

    const idx = req.verifiedToken.idx;
    const postIdx = req.params.postIdx;
    const content = req.body.content;

    const writerOfPost = await postService.retrieveUserIdx(postIdx);

    if (writerOfPost[0].userIdx !== idx[0].userIdx) {
        return res.send(errResponse(baseResponse.USER_ID_NOT_MATCH));
    }

    if(!postIdx) {
        return res.send(errResponse(baseResponse.POST_POSTIDX_EMPTY));
    }else if (postIdx < 1) {
        return res.send(errResponse(baseResponse.POST_POSTIDX_LENGTH));
    }

    if(!content) {
        return res.send(errResponse(baseResponse.POST_CONTENT_EMPTY))
    }else if (content.length > 1000) {
        return res.send(errResponse(baseResponse.POST_CONTENT_LENGTH));
    } 

    const editPostResponse = await postService.updatePost(content, postIdx);

    return res.send(editPostResponse);
}

// 게시글 조회
const getPosts = async (req, res) => {
    
    const userIdx = req.params.userIdx;
    const page = req.query.page;

    // validation
    if(!userIdx) {
        return res.send(errResponse(baseResponse.USER_USERIDX_EMPTY));
    } else if (userIdx <= 0) {
        return res.send(errResponse(baseResponse.USER_USERIDX_LENGTH));
    }

    if (!page) {
        return res.send(errResponse(baseResponse.PAGENATION_ERROR));
    } else  if (page <= 0) {
        return res.send(errResponse(baseResponse.PAGENATION_ERROR));
    }

    const postListResult = await postService.retrievePostLists(userIdx, page);

    return res.send(response(baseResponse.SUCCESS, postListResult));
}

// 게시글 내용 조회
const getPostContent = async (req, res) => {

    const postIdx = req.params.postIdx;

    // validation
    if (!postIdx){
        return res.send(errResponse(baseResponse.POST_POSTIDX_EMPTY));
    } else if(postIdx < 1) {
        return res.send(errResponse(baseResponse.POST_POSTIDX_LENGTH));
    }

    const postContent = await postService.retrievePostContent(postIdx);

    return res.send(postContent);

}

// 게시글 삭제
const patchPostStatus = async (req ,res) => {

    const idx = req.verifiedToken.idx;
    const postIdx = req.params.postIdx;

    const writerOfPost = await postService.retrieveUserIdx(postIdx);

    // Authentication
    if (writerOfPost[0].userIdx !== idx[0].userIdx) {
        return res.send(errResponse(baseResponse.USER_ID_NOT_MATCH));
    }
    
    // validation
    if (!postIdx) {
        return res.send(errResponse(baseResponse.POST_POSTIDX_EMPTY));
    } else if (postIdx <= 0) {
        return res.send(errResponse(baseResponse.POST_POSTIDX_LENGTH));
    }

    const editPostStatusResponse = await postService.updatePostStatus(postIdx);

    return res.send(editPostStatusResponse);
}

// 게시글 좋아요
const postPostLike = async (req, res) => {

    const idx = req.verifiedToken.idx;
    const postIdx = req.params.postIdx;

    const userIdx = idx[0].userIdx;

    if(!postIdx) {
        return res.send(errResponse(baseResponse.POST_POSTIDX_EMPTY));
    } else if (postIdx < 1) {
        return res.send(errResponse(baseResponse.POST_POSTIDX_LENGTH));
    }

    const postLikeResponse = await postService.createPostLike(userIdx, postIdx);

    return res.send(postLikeResponse);
}

// 게시글 좋아요 해제
const postPostDislike = async (req, res) => {
    
    const idx = req.verifiedToken.idx;
    const postIdx = req.params.postIdx;

    const userIdx = idx[0].userIdx;

    if(!postIdx) {
        return res.send(errResponse(baseResponse.POST_POSTIDX_EMPTY));
    } else if (postIdx < 1) {
        return res.send(errResponse(baseResponse.POST_POSTIDX_LENGTH));
    }

    const postDislikeResponse = await postService.createPostDislike(userIdx, postIdx);

    return res.send(postDislikeResponse);
}   

module.exports = {
    postPost,
    patchPost,
    getPosts,
    getPostContent,
    patchPostStatus,
    postPostLike,
    postPostDislike
};