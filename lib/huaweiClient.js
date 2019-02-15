'use strict';

const rp = require('request-promise')
const DEFAULT_GRANT_TYPE = 'client_credentials';
const debug = require('debug')('huaweipush')

const GET_TOKEN_URL = 'https://login.cloud.huawei.com/oauth2/v2/token';
const SEND_PUSH_MEG_URL = 'https://api.push.hicloud.com/pushsend.do';

const DEFAULT_SCOPE = 'nsp.auth nsp.user nsp.vfs,nsp.ping openpush.message';
const DEFAULT_NSP_SVC = 'openpush.message.api.send';
const TOKEN_CACHE_PREFIX = 'huaweipush:token'
const md5 = require('md5')
const Redis  = require('ioredis')

const DEFAULT_API_VERSION = '1';



module.exports = class HuaweiPush {

  /**
   * init config
   * @param clientId
   * @param clientSecret
   * @param options
   */
  constructor(clientId, clientSecret, options) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;

    if(!options){
      options = {};
    }
    if (options.redis) {
      this.redis = new Redis(options.redis);
    }
    this.isDebug = options.isDebug
  }

  debugLog(log){
    if(this.isDebug){
      debug(log)
    }
  }

  async getToken(options) {

    if (!options) {
      options = {};
    }
    let cacheKey = `${TOKEN_CACHE_PREFIX}:${this.clientId}:${md5(JSON.stringify(options))}`

    if (this.redis) {
      let oldToken = await this.redis.get(cacheKey)
      let token = JSON.parse(oldToken);
      if(token){
        this.debugLog('token from redis cache')
        return token;
      }
    }

    let tokenResult = await rp({
      method: 'POST',
      uri: GET_TOKEN_URL,
      form: {
        grant_type: options.grantType ? options.grantType : DEFAULT_GRANT_TYPE,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: options.scope ? options.scope : DEFAULT_SCOPE
      },
      json:true
    })

    if(tokenResult && tokenResult.access_token && this.redis){
      await this.redis.set(cacheKey,JSON.stringify(tokenResult),'EX',Math.ceil(tokenResult.expires_in*0.8))
      this.debugLog('save token in redis')
    }
    this.debugLog('token from huawei api')
    return tokenResult;
  }


  async sendPushMessage(accessToken,options){
    let ver = DEFAULT_GRANT_TYPE;
    if(options.ver){
      ver = DEFAULT_API_VERSION
    }

    let sendResult = await rp({
      method: 'POST',
      uri:`${SEND_PUSH_MEG_URL}?nsp_ctx=${encodeURIComponent(JSON.stringify({"ver":ver,"appId":this.clientId}))}`,
      form: {
        access_token:accessToken,
        nsp_ts: Date.now(),
        nsp_svc: DEFAULT_NSP_SVC,
        device_token_list:JSON.stringify(options.deviceTokenList),
        expire_time:options.expireTime,
        payload: JSON.stringify(options.payload)
      },
      json:true
    })

    return sendResult;

  }

}