const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const { response, errResponse } = require('../util/response');
const baseResponse = require('../util/baseResponseStatus');

const jwtMiddleware = (req, res, next) => {
    
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    token = token.replace(/^Bearer\s+/, "");
    
    if (!token){
        return res.send(errResponse(baseResponse.TOKEN_EMPTY));
    }

    //토큰 검증
    const p = new Promise(
        (resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET , (error, verifiedToken) => {
                if (error) {
                    reject(error);
                }
                //검증 성공하면 verifiedToken으로 넘기기
                resolve(verifiedToken);
            })
        }
    );

    const onError = (error) => {
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));
    }

    p.then((verifiedToken) => {
        
        //비밀번호 바뀌었을때 검증 부분 추가할 부분
        //req에 verifiedToken으로 담겠다
        req.verifiedToken = verifiedToken;

        next();
        
    }).catch(onError);
};

module.exports = jwtMiddleware;