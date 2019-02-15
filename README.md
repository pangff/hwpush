## 华为推送Node.js SDK

[![version](https://img.shields.io/npm/v/hwpush.svg?style=flat)](https://www.npmjs.com/package/hwpush)

---

### 使用

安装

```
npm install hwpush --save
```


示例代码（具体见samples/push-sample.js)

```
const HuaweiClient = require('hwpush')
const appId = 'xxxx'; //配置成华为申请的AppId
const secret = 'xxxx' //配置成申请的secret


//初始化HuaweiClient，如果不需要Redis缓存可以不配置redis
const huaweiClient = new HuaweiClient(appId, secret, {
      redis: {
        host: "127.0.0.1",//redis host
        port: 6379,//redis 端口
        password: "",//redis password
        db: 0
      },
      isDebug: true
    }
);


(async () => {

  let tokenResult = await huaweiClient.getToken()
  let sendResult = await huaweiClient.sendPushMessage(tokenResult.access_token, {
    deviceTokenList: ['huaweitoken'], //这里的huaweitoken换成真实token
    payload: {  //playload使用具体见华为推送文档  https://developer.huawei.com/consumer/cn/service/hms/catalog/huaweipush_agent.html?page=hmssdk_huaweipush_api_reference_agent_s2
      hps: {
        msg: {
          type: 3,
          body: {
            content: "Push message content",
            title: "Push message content"
          },
          action: {
            type: 1,
            param: {
              "intent": "#Intent;compo=com.rvr/.Activity;S.W=U;end"
            }
          }
        },
        ext: {
          biTag: "Trump",
          customize: [
            {"value":"custom"}
          ]
        }

      }
    }
  })
  console.log(tokenResult)
  console.log(sendResult)
})();


```