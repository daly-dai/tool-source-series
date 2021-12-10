interface Time {
  time?: Date;
  day?: number;
  hours?: number;
  minutes?: number;
}

interface SetParams extends Time {
  key: string;
  value: unknown;
  cb?: Function;
}

class TimeLocalStorage {
  storage = localStorage || window.localStorage;

  status = {
    SUCCESS: "SUCCESS", // 成功
    FAILURE: "ERROR", // 失败
    OVERFLOW: "OVERFLOW", // 数据溢出
    TIMEOUT: "TIMEOUT", // 超时
  };

  deleteTimeOut?: boolean; // 是否删除过期数据

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
  set({ key, value, cb, time, day, hours, minutes }: SetParams): void {
    // 时间都不传默认为两小时，可指定时间戳。
    // 也可以指定到具体的天、小时、分钟过期
    let status = this.status.SUCCESS;

    const localTime = TimeLocalStorage.getLocalTime({
      time,
      day,
      hours,
      minutes,
    });

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
   * @description 获取localStorage的值
   * @param key
   * @param cb
   * @returns
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

    if (!value) {
      result = TimeLocalStorage.setResult(this.status.FAILURE, null, cb);

      return result;
    }

    value = JSON.parse(value);
    const time = value?.timeOut || 0;

    // 判断是否过期，
    if (time > new Date().getTime() || time === 0) {
      result = TimeLocalStorage.setResult(status, value.value || "", cb);

      return result;
    }

    this.deleteTimeOut && this.remove(key);

    result = TimeLocalStorage.setResult(this.status.TIMEOUT, null, cb);

    return result;
  }

  /**
   * @description 删除storage，如果删除成功，返回删除的内容
   * @param key
   * @param cb
   * @returns
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

  /**
   * @description 设置localStorage的过期时间
   * @param param0
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

  /**
   * @description 设置返回的结果
   * @param status
   * @param value
   * @param cb
   * @returns
   */
  static setResult(status: string, value: any, cb?: Function) {
    cb && cb(status, value);

    return {
      status,
      value,
    };
  }
}

export { TimeLocalStorage };
