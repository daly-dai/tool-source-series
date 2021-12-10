![timg.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7a850d14e5a24e9482b18b5700af7001~tplv-k3u1fbpfcp-watermark.image?)

### 实现的方法如下

![8E5E1569-EE99-4a30-AEB2-270BDDDC8D1E.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7a7a86e1311b4ab89b7820e877ede4eb~tplv-k3u1fbpfcp-watermark.image?)

### 实现原理

在存储 localStorage 的时候为每一项数据添加时效性 timeOut 字段（数据格式如下），当读取 localStorage 的时候去判断当前的数据是否过期，如果过期的话则无法获取数据。并同时删除相关数据

```javascript
    // 存储的数据格式
    key: {
        value:{}, // 存储的值
        timeOut: time // 过期时间
    }
```

### 基础架构

```javascript
class TimeLocalStorage {
  storage = localStorage || window.localStorage;

  status = {
    SUCCESS: "SUCCESS", // 成功
    FAILURE: "ERROR", // 失败
    OVERFLOW: "OVERFLOW", // 数据溢出
    TIMEOUT: "TIMEOUT", // 超时
  };

  deleteTimeOut: boolean; // 是否删除过期数据

  constructor(deleteTimeOut: boolean = true) {
    this.deleteTimeOut = deleteTimeOut;
  }

  /**
   * @description 向localStorage中存值，
   * @param key
   * @param value
   * @param cb
   * @param time 时间戳
   * @param day 天数
   * @param hours 小时
   * @param minutes 分钟
   */
  set({ key, value, cb, time, day, hours, minutes }: SetParams): void {}

  get(key: string, cb?: Function) {}

  /**
   * @description 删除storage，如果删除成功，返回删除的内容
   * @param key
   * @param cb
   * @returns
   */
  remove(key: string, cb?: Function) {}
}
```

TimeLocalStorage 的状态分别为**SUCCESS(成功)、FAILURE（失败） 、OVERFLOW（溢出）、TIMEOUT（超时）**，在初始化的时候设置是否在获取的时候清除过期的数据**deleteTimeOut** 默认为**true**

#### 实现的方法

1. set 方法

```
  /**
   * @description 向localStorage中存值，
   * @param key
   * @param value
   * @param cb
   * @param time 时间戳
   * @param day 天数
   * @param hours 小时
   * @param minutes 分钟
   */
  set({ key, value, cb, time, day, hours, minutes }: SetParams): void {
    // 时间都不传默认为两小时，可指定时间戳。
    // 也可以指定到具体的天、小时、分钟过期
    let status = this.status.SUCCESS;

    // 获取过期时间
    const localTime = TimeLocalStorage.getLocalTime({
      time,
      day,
      hours,
      minutes,
    });

    // 设置存储的数据格式
    const localData = {
      value,
      timeOut: localTime,
    };

    try {
      this.storage.setItem(key, JSON.stringify(localData));
    } catch (e) {
      status = this.status.OVERFLOW;
    }

    // 操作完成后的回调
    cb && cb(status, key, localData);
  }


    /**
   * @description 设置localStorage的过期时间
   * @returns 默认两小时 可以传递时间戳、也可以传递天、小时、分钟
   */
  static getLocalTime({ time, day, hours, minutes }: Time): number {
    if (!time && !day && !hours && !minutes) {
      return new Date().getTime() + 1000 * 60 * 60 * 2;
    }

    if (time) {
      return new Date(time).getTime() || time.getTime();
    }

    const dataDay = day ? day * 24 : 1;
    const dataHours = hours || 1;
    const dataMinutes = minutes || 1;

    return new Date().getTime() + 1000 * dataMinutes * dataHours * dataDay;
  }


```

2. get 方法

```javascript

  /**
   * @description 获取localStorage的值
   */
  get(key: string, cb?: Function) {
    const status = this.status.SUCCESS;
    let value: any = null;
    let result: any;

    try {
      value = this.storage.getItem(key);
    } catch (e) {
      result = TimeLocalStorage.setResult(this.status.FAILURE, null, cb);

      return result;
    }

    // 如果数据不存在的话 直接返回失败
    if (!value) {
      result = TimeLocalStorage.setResult(this.status.FAILURE, null, cb);

      return result;
    }

    value = JSON.parse(value);
    // 如果没有timeOut字段则默认未超过时间
    const time = value?.timeOut || 0;

    // 判断是否过期，
    if (time > new Date().getTime() || time === 0) {
      result = TimeLocalStorage.setResult(status, value.value || "", cb);

      return result;
    }

   // 过期的时候根据deleteTimeOut 决定是否删除数据
    this.deleteTimeOut && this.remove(key);

    result = TimeLocalStorage.setResult(this.status.TIMEOUT, null, cb);

    return result;
  }


  /**
   * @description 设置返回的结果
   */
  static setResult(status: string, value: any, cb?: Function) {
    cb && cb(status, value);

    return {
      status,
      value,
    };
  }
```

3. remove 方法

```javascript
      /**
       * @description 删除storage，如果删除成功，返回删除的内容
       */
      remove(key: string, cb?: Function) {
        let status = this.status.FAILURE;
        let value: any;

        try {
          value = this.storage.getItem(key);
        } catch (e) {
          cb && cb(status, null);
          return;
        }

        if (!value) {
          cb && cb(status, null);
          return;
        }

        try {
          this.storage.removeItem(key);
        } catch (e) {
          cb && cb(status, null);
          return;
        }

        status = this.status.SUCCESS;

        value = status === "SUCCESS" ? value?.value || value : null;

        cb && cb(status, value);
      }
```

#### 使用

```javascript
const storage = new TimeLocalStorage();

storage.set({
  key: "test",
  value: { test: 1, test2: 2 },
  cb: (data: any) => {
    console.log(data);
  },
  hours: 7,
});

const testData = storage.get("test");

console.log(testData);

const removeData = storage.remove("test");

console.log(removeData);
```

#### 源码如下

### 参考文章

[localStorage 实现一个具有过期时间的 DAO 库](https://juejin.cn/post/6844903887166504968)
